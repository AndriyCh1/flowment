import { randomUUID } from 'node:crypto';
import {
  ObjectiveEvaluationSchema,
  SystemDesignSchema,
  coachStageAfter,
  designRevision,
  designStepIds,
  findCoachQuestion,
  findLatestPossibleAnswer,
  findUnlabeledInteractions,
  hintsForQuestion,
  initialCoachStage,
  isPossibleAnswerAvailable,
  knownStepIds,
  nextHintLevel,
  type CoachOutput,
  type CoachQuestion,
  type CoachQuestionPurpose,
  type CoachTurn,
  type Exercise,
  type ExerciseObjective,
  type SystemDesign,
} from '@flowment/domain';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import type { z } from 'zod';
import {
  InjectDb,
  coachHintRequests,
  coachSessions,
  type Db,
} from '../../infrastructure/database';
import { ExercisesService } from '../exercises';
import { ProjectsService } from '../projects';
import {
  COACH_AI_PROVIDER,
  CoachDraftSchema,
  CoachQuestionDraftSchema,
  HintDraftSchema,
  PossibleAnswerDraftSchema,
  type CoachAiProvider,
  type CoachDraft,
  type CoachFocus,
  type ProviderQuestion,
} from './coach-ai-provider';
import { buildCoachContext, type CoachContext } from './coach-context';
import type {
  CoachHintRequestInput,
  CoachNextInput,
  CoachPossibleAnswerRequestInput,
  CoachReplyInput,
  CoachSession,
} from './coach.dto';
import {
  CoachHintsExhaustedError,
  CoachPossibleAnswerNotAvailableError,
  CoachQuestionNotActiveError,
  CoachSessionChangedError,
  CoachUnavailableError,
} from './coach.errors';
import { unlabeledInteractionQuestion } from './explicitness-question';

export const DISCOVERY_QUESTION =
  'What system or behavior do you want to explore?';

const MAX_REPLY_ATTEMPTS = 3;

type CoachSessionRow = typeof coachSessions.$inferSelect;

type CoachedProject = {
  design: SystemDesign;
  exercise: Exercise | null;
};

type CoachSessionChanges = Partial<
  Pick<
    CoachSessionRow,
    'modelingIntent' | 'stage' | 'turns' | 'activeQuestionId' | 'designRevision'
  >
>;

function emptySession(projectId: string): CoachSession {
  return {
    projectId,
    mode: 'open-project',
    modelingIntent: null,
    stage: initialCoachStage('open-project'),
    objectives: [],
    turns: [],
    activeQuestionId: null,
    designRevision: null,
  };
}

function toSession({
  projectId,
  mode,
  modelingIntent,
  stage,
  objectives,
  turns,
  activeQuestionId,
  designRevision: revision,
}: CoachSessionRow): CoachSession {
  return {
    projectId,
    mode,
    modelingIntent,
    stage,
    objectives,
    turns,
    activeQuestionId,
    designRevision: revision,
  };
}

function isEmptyDesign(design: SystemDesign): boolean {
  return design.components.length === 0 && design.scenarios.length === 0;
}

function createQuestion(
  purpose: CoachQuestionPurpose,
  text: string,
  design: SystemDesign,
  stepIds: readonly string[] = [],
): CoachQuestion {
  const relatedStepIds = knownStepIds(design, stepIds);
  return {
    type: 'question',
    questionId: randomUUID(),
    purpose,
    text,
    ...(relatedStepIds.length > 0 ? { relatedStepIds } : {}),
  };
}

function toProviderQuestion(
  question: CoachQuestion,
  design: SystemDesign,
): ProviderQuestion {
  const relatedStepIds = knownStepIds(design, question.relatedStepIds ?? []);
  return {
    purpose: question.purpose,
    text: question.text,
    ...(relatedStepIds.length > 0 ? { relatedStepIds } : {}),
  };
}

function reviewOrGuidePurpose(design: SystemDesign): CoachQuestionPurpose {
  return designStepIds(design).size > 0 ? 'review' : 'guide';
}

function openProjectOutputFromDraft(
  draft: CoachDraft,
  design: SystemDesign,
): CoachOutput {
  if (draft.type === 'next-action') {
    return draft;
  }
  return createQuestion(
    draft.purpose === 'review' ? reviewOrGuidePurpose(design) : draft.purpose,
    draft.text,
    design,
    draft.relatedStepIds,
  );
}

@Injectable()
export class CoachService {
  private readonly logger = new Logger(CoachService.name);

  constructor(
    @InjectDb() private readonly db: Db,
    private readonly projects: ProjectsService,
    private readonly exercises: ExercisesService,
    @Inject(COACH_AI_PROVIDER) private readonly ai: CoachAiProvider,
  ) {}

  async getSession(projectId: string): Promise<CoachSession> {
    await this.projects.get(projectId);
    const row = await this.findSessionRow(projectId);
    return row ? toSession(row) : emptySession(projectId);
  }

  async updateModelingIntent(
    projectId: string,
    modelingIntent: string,
  ): Promise<CoachSession> {
    await this.projects.get(projectId);
    const intent = modelingIntent || null;
    const [row] = await this.db
      .insert(coachSessions)
      .values({
        projectId,
        modelingIntent: intent,
        stage: initialCoachStage('open-project'),
      })
      .onConflictDoUpdate({
        target: coachSessions.projectId,
        set: {
          modelingIntent: intent,
          version: sql`${coachSessions.version} + 1`,
        },
      })
      .returning();
    return toSession(row);
  }

  async requestCoachResponse(
    projectId: string,
    { scenarioId }: CoachNextInput,
  ): Promise<CoachSession> {
    const project = await this.loadProjectForCoaching(projectId);
    const { design } = project;
    const row = await this.findOrCreateSessionRow(projectId);

    const output = await this.generateCoachOutput(
      row,
      project,
      scenarioId ?? null,
    );
    const turn: CoachTurn = {
      id: randomUUID(),
      role: 'coach',
      createdAt: new Date().toISOString(),
      output,
    };

    const updated = await this.updateSessionIfUnchanged(row, {
      turns: [...row.turns, turn],
      activeQuestionId: output.type === 'question' ? output.questionId : null,
      designRevision: designRevision(design),
      stage: coachStageAfter(output),
    });
    if (!updated) {
      throw new CoachSessionChangedError();
    }
    return toSession(updated);
  }

  async requestHint(
    projectId: string,
    { questionId, scenarioId }: CoachHintRequestInput,
  ): Promise<CoachSession> {
    const project = await this.loadProjectForCoaching(projectId);
    const { design } = project;
    const row = await this.findOrCreateSessionRow(projectId);

    const asked =
      row.activeQuestionId === questionId
        ? findCoachQuestion(row.turns, questionId)
        : undefined;

    if (!asked) {
      throw new CoachQuestionNotActiveError();
    }

    const level = nextHintLevel(row.turns, asked);
    if (level === null) {
      throw new CoachHintsExhaustedError();
    }

    const draft = await this.callProvider('give a hint', HintDraftSchema, () =>
      this.ai.generateHint({
        context: this.buildContext(row, project, scenarioId ?? null),
        question: toProviderQuestion(asked, design),
        level,
        previousHints: hintsForQuestion(row.turns, questionId).map(
          ({ text }) => text,
        ),
        objectives: row.mode === 'exercise' ? row.objectives : [],
      }),
    );

    const turn: CoachTurn = {
      id: randomUUID(),
      role: 'hint',
      createdAt: new Date().toISOString(),
      questionId,
      level,
      outcome: draft.outcome,
      text: draft.text,
    };
    const resolved = draft.outcome === 'resolved';

    const updated = await this.db.transaction(async (tx) => {
      const saved = await this.updateSessionIfUnchanged(
        row,
        {
          turns: [...row.turns, turn],
          ...(resolved ? { activeQuestionId: null } : {}),
        },
        tx,
      );

      if (saved) {
        await tx.insert(coachHintRequests).values({
          projectId,
          questionId,
          questionPurpose: asked.purpose,
          level,
          outcome: draft.outcome,
          designRevision: designRevision(design),
        });
      }
      return saved;
    });

    if (!updated) {
      throw new CoachSessionChangedError();
    }

    return toSession(updated);
  }

  async requestPossibleAnswer(
    projectId: string,
    { questionId, scenarioId }: CoachPossibleAnswerRequestInput,
  ): Promise<CoachSession> {
    const project = await this.loadProjectForCoaching(projectId);
    const { design } = project;
    const row = await this.findOrCreateSessionRow(projectId);

    const asked =
      row.activeQuestionId === questionId
        ? findCoachQuestion(row.turns, questionId)
        : undefined;

    if (!asked) {
      throw new CoachQuestionNotActiveError();
    }

    if (!isPossibleAnswerAvailable(row.turns, questionId)) {
      throw new CoachPossibleAnswerNotAvailableError();
    }

    const revision = designRevision(design);
    if (
      findLatestPossibleAnswer(row.turns, questionId)?.designRevision ===
      revision
    ) {
      return toSession(row);
    }

    const draft = await this.callProvider(
      'show a possible answer',
      PossibleAnswerDraftSchema,
      () =>
        this.ai.generatePossibleAnswer({
          context: this.buildContext(row, project, scenarioId ?? null),
          question: toProviderQuestion(asked, design),
          previousHints: hintsForQuestion(row.turns, questionId).map(
            ({ text }) => text,
          ),
          objectives: row.mode === 'exercise' ? row.objectives : [],
        }),
    );

    const turn: CoachTurn = {
      id: randomUUID(),
      role: 'possible-answer',
      createdAt: new Date().toISOString(),
      questionId,
      designRevision: revision,
      ...draft,
    };

    const updated = await this.updateSessionIfUnchanged(row, {
      turns: [...row.turns, turn],
    });

    if (!updated) {
      throw new CoachSessionChangedError();
    }

    return toSession(updated);
  }

  async replyToQuestion(
    projectId: string,
    { questionId, kind, text }: CoachReplyInput,
  ): Promise<CoachSession> {
    await this.projects.get(projectId);

    for (let attempt = 0; attempt < MAX_REPLY_ATTEMPTS; attempt += 1) {
      const row = await this.findOrCreateSessionRow(projectId);
      const asked =
        row.activeQuestionId === questionId
          ? findCoachQuestion(row.turns, questionId)
          : undefined;

      if (!asked) {
        throw new CoachQuestionNotActiveError();
      }

      const turn: CoachTurn = {
        id: randomUUID(),
        role: 'learner',
        createdAt: new Date().toISOString(),
        kind,
        text,
        relatedQuestionId: questionId,
      };

      const statesIntent =
        asked.purpose === 'discover' &&
        kind === 'answer' &&
        !row.modelingIntent;

      const updated = await this.updateSessionIfUnchanged(row, {
        turns: [...row.turns, turn],
        activeQuestionId: null,
        ...(statesIntent ? { modelingIntent: text } : {}),
      });

      if (updated) {
        return toSession(updated);
      }
    }

    throw new CoachSessionChangedError();
  }

  async resetConversation(projectId: string): Promise<CoachSession> {
    await this.projects.get(projectId);
    const existing = await this.findSessionRow(projectId);
    if (!existing) {
      return emptySession(projectId);
    }

    const [row] = await this.db
      .update(coachSessions)
      .set({
        turns: [],
        activeQuestionId: null,
        designRevision: null,
        stage: initialCoachStage(existing.mode),
        version: sql`${coachSessions.version} + 1`,
      })
      .where(eq(coachSessions.projectId, projectId))
      .returning();
    return toSession(row);
  }

  private async findSessionRow(
    projectId: string,
  ): Promise<CoachSessionRow | undefined> {
    const [row] = await this.db
      .select()
      .from(coachSessions)
      .where(eq(coachSessions.projectId, projectId));
    return row;
  }

  private async findOrCreateSessionRow(
    projectId: string,
  ): Promise<CoachSessionRow> {
    await this.db
      .insert(coachSessions)
      .values({ projectId, stage: initialCoachStage('open-project') })
      .onConflictDoNothing();
    const row = await this.findSessionRow(projectId);
    if (!row) {
      throw new CoachSessionChangedError();
    }
    return row;
  }

  private async updateSessionIfUnchanged(
    row: CoachSessionRow,
    changes: CoachSessionChanges,
    executor: Pick<Db, 'update'> = this.db,
  ): Promise<CoachSessionRow | undefined> {
    const [updated] = await executor
      .update(coachSessions)
      .set({ ...changes, version: row.version + 1 })
      .where(
        and(
          eq(coachSessions.projectId, row.projectId),
          eq(coachSessions.version, row.version),
        ),
      )
      .returning();
    return updated;
  }

  private async loadProjectForCoaching(
    projectId: string,
  ): Promise<CoachedProject> {
    const project = await this.projects.get(projectId);
    return {
      design: SystemDesignSchema.parse(project.systemDesign),
      exercise: project.exerciseId
        ? (this.exercises.findExercise(project.exerciseId) ?? null)
        : null,
    };
  }

  private buildContext(
    row: CoachSessionRow,
    { design, exercise }: CoachedProject,
    selectedScenarioId: string | null,
  ): CoachContext {
    return buildCoachContext({
      projectId: row.projectId,
      mode: row.mode,
      exercise: row.mode === 'exercise' ? exercise : null,
      modelingIntent: row.modelingIntent,
      turns: row.turns,
      design,
      selectedScenarioId,
    });
  }

  private async generateCoachOutput(
    row: CoachSessionRow,
    project: CoachedProject,
    selectedScenarioId: string | null,
  ): Promise<CoachOutput> {
    const { design } = project;
    const context = this.buildContext(row, project, selectedScenarioId);

    if (context.exercise?.mode === 'trace') {
      const [unlabeled] = findUnlabeledInteractions(design);
      if (unlabeled) {
        return createQuestion(
          'review',
          unlabeledInteractionQuestion(design, unlabeled),
          design,
          [unlabeled.step.id],
        );
      }
    }

    if (row.mode === 'exercise' && row.objectives.length > 0) {
      return this.coachTowardObjectives(row.objectives, context, design);
    }

    if (!context.modelingIntent && isEmptyDesign(design)) {
      return createQuestion('discover', DISCOVERY_QUESTION, design);
    }

    const draft = await this.callProvider(
      'generate a response',
      CoachDraftSchema,
      () => this.ai.generateCoachQuestion({ context, focus: { kind: 'open' } }),
    );
    return openProjectOutputFromDraft(draft, design);
  }

  private async coachTowardObjectives(
    objectives: readonly ExerciseObjective[],
    context: CoachContext,
    design: SystemDesign,
  ): Promise<CoachOutput> {
    const evidence: string[] = [];
    const summaries: string[] = [];

    for (const objective of objectives) {
      const evaluation = await this.callProvider(
        'evaluate an objective',
        ObjectiveEvaluationSchema,
        () => this.ai.evaluateObjective({ context, objective }),
      );

      if (evaluation.status === 'satisfied') {
        evidence.push(...evaluation.evidence);
        summaries.push(evaluation.summary);
        continue;
      }

      const focus: CoachFocus =
        evaluation.status === 'unsatisfied'
          ? {
              kind: 'objective-gap',
              objective,
              gap: evaluation.gap,
              evidence: evaluation.evidence,
            }
          : {
              kind: 'objective-unclear',
              objective,
              reason: evaluation.reason,
            };
      const draft = await this.callProvider(
        'ask about an objective',
        CoachQuestionDraftSchema,
        () => this.ai.generateCoachQuestion({ context, focus }),
      );

      return createQuestion(
        focus.kind === 'objective-gap'
          ? reviewOrGuidePurpose(design)
          : 'clarify',
        draft.text,
        design,
        draft.relatedStepIds,
      );
    }

    return {
      type: 'objective-satisfied',
      evidence,
      summary: summaries.join(' '),
    };
  }

  private async callProvider<Schema extends z.ZodType>(
    task: string,
    schema: Schema,
    call: () => Promise<unknown>,
  ): Promise<z.output<Schema>> {
    try {
      return schema.parse(await call());
    } catch (error) {
      this.logger.error(
        `The coach provider failed to ${task}`,
        error instanceof Error ? (error.stack ?? error.message) : String(error),
      );
      throw new CoachUnavailableError({ cause: error });
    }
  }
}
