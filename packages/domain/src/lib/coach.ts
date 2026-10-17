import { z } from 'zod';
import { IdSchema } from './id.js';
import type { SystemDesign } from './system-design.js';

export const MODELING_INTENT_MAX_LENGTH = 2000;
export const COACH_REPLY_MAX_LENGTH = 2000;

export const ModelingIntentSchema = z
  .string()
  .trim()
  .max(
    MODELING_INTENT_MAX_LENGTH,
    `Keep the description under ${MODELING_INTENT_MAX_LENGTH} characters`,
  );

export const CoachReplyTextSchema = z
  .string()
  .trim()
  .max(
    COACH_REPLY_MAX_LENGTH,
    `Keep the answer under ${COACH_REPLY_MAX_LENGTH} characters`,
  );

export const CoachModeSchema = z.enum(['exercise', 'open-project']);

export type CoachMode = z.infer<typeof CoachModeSchema>;

export const CoachStageSchema = z.enum([
  'discovering',
  'clarifying',
  'guiding',
  'reviewing',
  'objective-reached',
]);

export type CoachStage = z.infer<typeof CoachStageSchema>;

export const ExerciseObjectiveSchema = z.object({
  id: IdSchema,
  description: z.string().trim().min(1),
});

export type ExerciseObjective = z.infer<typeof ExerciseObjectiveSchema>;

export const ObjectiveEvaluationSchema = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('satisfied'),
    evidence: z.array(z.string()),
    summary: z.string(),
  }),
  z.object({
    status: z.literal('unsatisfied'),
    evidence: z.array(z.string()),
    gap: z.string(),
  }),
  z.object({
    status: z.literal('indeterminate'),
    reason: z.string(),
  }),
]);

export type ObjectiveEvaluation = z.infer<typeof ObjectiveEvaluationSchema>;

export const CoachQuestionPurposeSchema = z.enum([
  'discover',
  'clarify',
  'guide',
  'review',
]);

export type CoachQuestionPurpose = z.infer<typeof CoachQuestionPurposeSchema>;

export const CoachActionSchema = z.enum([
  'create-scenario',
  'create-component',
  'add-step',
  'record-assumption',
]);

export type CoachAction = z.infer<typeof CoachActionSchema>;

export const CoachQuestionSchema = z.object({
  type: z.literal('question'),
  questionId: IdSchema,
  purpose: CoachQuestionPurposeSchema,
  text: z.string().min(1),
  relatedStepIds: z.array(IdSchema).optional(),
});

export type CoachQuestion = z.infer<typeof CoachQuestionSchema>;

export const CoachNextActionSchema = z.object({
  type: z.literal('next-action'),
  text: z.string().min(1),
  action: CoachActionSchema,
});

export type CoachNextAction = z.infer<typeof CoachNextActionSchema>;

export const CoachObjectiveSatisfiedSchema = z.object({
  type: z.literal('objective-satisfied'),
  evidence: z.array(z.string()),
  summary: z.string(),
});

export type CoachObjectiveSatisfied = z.infer<
  typeof CoachObjectiveSatisfiedSchema
>;

export const CoachOutputSchema = z.discriminatedUnion('type', [
  CoachQuestionSchema,
  CoachNextActionSchema,
  CoachObjectiveSatisfiedSchema,
]);

export type CoachOutput = z.infer<typeof CoachOutputSchema>;

export const LearnerReplyKindSchema = z.enum([
  'answer',
  'unknown',
  'skip',
  'rephrase',
]);

export type LearnerReplyKind = z.infer<typeof LearnerReplyKindSchema>;

export const LearnerTurnSchema = z.object({
  id: IdSchema,
  role: z.literal('learner'),
  createdAt: z.iso.datetime(),
  kind: LearnerReplyKindSchema,
  text: z.string(),
  relatedQuestionId: IdSchema,
});

export type LearnerTurn = z.infer<typeof LearnerTurnSchema>;

export const CoachResponseTurnSchema = z.object({
  id: IdSchema,
  role: z.literal('coach'),
  createdAt: z.iso.datetime(),
  output: CoachOutputSchema,
});

export type CoachResponseTurn = z.infer<typeof CoachResponseTurnSchema>;

export const MAX_HINTS = 3;

export const HintLevelSchema = z.int().min(1).max(MAX_HINTS);

export type HintLevel = z.infer<typeof HintLevelSchema>;

export const HintOutcomeSchema = z.enum(['hint', 'resolved']);

export type HintOutcome = z.infer<typeof HintOutcomeSchema>;

export const HintTurnSchema = z.object({
  id: IdSchema,
  role: z.literal('hint'),
  createdAt: z.iso.datetime(),
  questionId: IdSchema,
  level: HintLevelSchema,
  outcome: HintOutcomeSchema,
  text: z.string().min(1),
});

export type HintTurn = z.infer<typeof HintTurnSchema>;

export const CoachTurnSchema = z.discriminatedUnion('role', [
  LearnerTurnSchema,
  CoachResponseTurnSchema,
  HintTurnSchema,
]);

export type CoachTurn = z.infer<typeof CoachTurnSchema>;

const stageByPurpose: Record<CoachQuestionPurpose, CoachStage> = {
  discover: 'discovering',
  clarify: 'clarifying',
  guide: 'guiding',
  review: 'reviewing',
};

export function initialCoachStage(mode: CoachMode): CoachStage {
  return mode === 'exercise' ? 'guiding' : 'discovering';
}

export function coachStageAfter(output: CoachOutput): CoachStage {
  switch (output.type) {
    case 'question':
      return stageByPurpose[output.purpose];
    case 'next-action':
      return 'guiding';
    case 'objective-satisfied':
      return 'objective-reached';
  }
}

export function coachOutputText(output: CoachOutput): string {
  return output.type === 'objective-satisfied' ? output.summary : output.text;
}

export function findCoachQuestion(
  turns: readonly CoachTurn[],
  questionId: string,
): CoachQuestion | undefined {
  for (const turn of turns) {
    if (
      turn.role === 'coach' &&
      turn.output.type === 'question' &&
      turn.output.questionId === questionId
    ) {
      return turn.output;
    }
  }
  return undefined;
}

export function maxHintsForPurpose(purpose: CoachQuestionPurpose): number {
  return purpose === 'guide' || purpose === 'review' ? MAX_HINTS : 1;
}

export function hintsForQuestion(
  turns: readonly CoachTurn[],
  questionId: string,
): HintTurn[] {
  return turns.filter(
    (turn): turn is HintTurn =>
      turn.role === 'hint' && turn.questionId === questionId,
  );
}

export function nextHintLevel(
  turns: readonly CoachTurn[],
  question: CoachQuestion,
): HintLevel | null {
  const hints = hintsForQuestion(turns, question.questionId);
  if (hints.some(({ outcome }) => outcome === 'resolved')) {
    return null;
  }

  return hints.length < maxHintsForPurpose(question.purpose)
    ? hints.length + 1
    : null;
}

export function designStepIds(design: SystemDesign): Set<string> {
  return new Set(
    design.scenarios.flatMap((scenario) => scenario.steps.map(({ id }) => id)),
  );
}

export function knownStepIds(
  design: SystemDesign,
  stepIds: readonly string[],
): string[] {
  const known = designStepIds(design);
  return [...new Set(stepIds)].filter((id) => known.has(id));
}
