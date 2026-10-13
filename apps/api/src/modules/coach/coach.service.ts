import { randomUUID } from 'node:crypto';
import {
  ObjectiveEvaluationSchema,
  SystemDesignSchema,
  coachStageAfter,
  designRevision,
  designStepIds,
  findCoachQuestion,
  initialCoachStage,
  knownStepIds,
  type CoachOutput,
  type CoachQuestion,
  type CoachQuestionPurpose,
  type CoachTurn,
  type ExerciseObjective,
  type SystemDesign,
} from '@flowment/domain';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import type { z } from 'zod';
import {
  InjectDb,
  coachSessions,
  type Db,
} from '../../infrastructure/database';
import { ProjectsService } from '../projects';
import {
  COACH_AI_PROVIDER,
  CoachDraftSchema,
  CoachQuestionDraftSchema,
  type CoachAiProvider,
  type CoachDraft,
  type CoachFocus,
} from './coach-ai-provider';
import { buildCoachContext, type CoachContext } from './coach-context';
import type {
  CoachNextInput,
  CoachReplyInput,
  CoachSession,
} from './coach.dto';
import {
  CoachQuestionNotActiveError,
  CoachSessionChangedError,
  CoachUnavailableError,
} from './coach.errors';

export const DISCOVERY_QUESTION =
  'What system or behavior do you want to explore?';

const MAX_REPLY_ATTEMPTS = 3;

type CoachSessionRow = typeof coachSessions.$inferSelect;

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

function isBlank(design: SystemDesign): boolean {
  return design.components.length === 0 && design.scenarios.length === 0;
}

function question(
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

function reviewPurpose(design: SystemDesign): CoachQuestionPurpose {
  return designStepIds(design).size > 0 ? 'review' : 'guide';
}

function openProjectOutput(
  draft: CoachDraft,
  design: SystemDesign,
): CoachOutput {
  if (draft.type === 'next-action') {
    return draft;
  }
  return question(
    draft.purpose === 'review' ? reviewPurpose(design) : draft.purpose,
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
    @Inject(COACH_AI_PROVIDER) private readonly ai: CoachAiProvider,
  ) {}

  async get(projectId: string): Promise<CoachSession> {
    await this.projects.get(projectId);
    const row = await this.find(projectId);
    return row ? toSession(row) : emptySession(projectId);
  }

  async setIntent(
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

  async next(
    projectId: string,
    { scenarioId }: CoachNextInput,
  ): Promise<CoachSession> {
    const project = await this.projects.get(projectId);
    const design = SystemDesignSchema.parse(project.systemDesign);
    const row = await this.ensure(projectId);

    const output = await this.respond(row, design, scenarioId ?? null);
    const turn: CoachTurn = {
      id: randomUUID(),
      role: 'coach',
      createdAt: new Date().toISOString(),
      output,
    };

    const updated = await this.write(row, {
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

  async reply(
    projectId: string,
    { questionId, kind, text }: CoachReplyInput,
  ): Promise<CoachSession> {
    await this.projects.get(projectId);

    for (let attempt = 0; attempt < MAX_REPLY_ATTEMPTS; attempt += 1) {
      const row = await this.ensure(projectId);
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

      const updated = await this.write(row, {
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

  async reset(projectId: string): Promise<CoachSession> {
    await this.projects.get(projectId);
    const existing = await this.find(projectId);
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

  private async find(projectId: string): Promise<CoachSessionRow | undefined> {
    const [row] = await this.db
      .select()
      .from(coachSessions)
      .where(eq(coachSessions.projectId, projectId));
    return row;
  }

  private async ensure(projectId: string): Promise<CoachSessionRow> {
    await this.db
      .insert(coachSessions)
      .values({ projectId, stage: initialCoachStage('open-project') })
      .onConflictDoNothing();
    const row = await this.find(projectId);
    if (!row) {
      throw new CoachSessionChangedError();
    }
    return row;
  }

  private async write(
    row: CoachSessionRow,
    changes: CoachSessionChanges,
  ): Promise<CoachSessionRow | undefined> {
    const [updated] = await this.db
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

  private async respond(
    row: CoachSessionRow,
    design: SystemDesign,
    selectedScenarioId: string | null,
  ): Promise<CoachOutput> {
    const context = buildCoachContext({
      projectId: row.projectId,
      mode: row.mode,
      modelingIntent: row.modelingIntent,
      turns: row.turns,
      design,
      selectedScenarioId,
    });

    if (row.mode === 'exercise' && row.objectives.length > 0) {
      return this.coachExercise(row.objectives, context, design);
    }

    if (!context.modelingIntent && isBlank(design)) {
      return question('discover', DISCOVERY_QUESTION, design);
    }

    const draft = await this.consult(
      'generate a response',
      CoachDraftSchema,
      () => this.ai.generateCoachQuestion({ context, focus: { kind: 'open' } }),
    );
    return openProjectOutput(draft, design);
  }

  private async coachExercise(
    objectives: readonly ExerciseObjective[],
    context: CoachContext,
    design: SystemDesign,
  ): Promise<CoachOutput> {
    const evidence: string[] = [];
    const summaries: string[] = [];

    for (const objective of objectives) {
      const evaluation = await this.consult(
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
      const draft = await this.consult(
        'ask about an objective',
        CoachQuestionDraftSchema,
        () => this.ai.generateCoachQuestion({ context, focus }),
      );

      return question(
        focus.kind === 'objective-gap' ? reviewPurpose(design) : 'clarify',
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

  private async consult<Schema extends z.ZodType>(
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
