import {
  CoachActionSchema,
  HintOutcomeSchema,
  type CoachQuestion,
  type ExerciseObjective,
  type HintLevel,
  type ObjectiveEvaluation,
  type ReviewFeedback,
} from '@flowment/domain';
import { z } from 'zod';
import type { CoachContext } from './coach-context';

export const COACH_AI_PROVIDER = Symbol('COACH_AI_PROVIDER');

export const CoachQuestionDraftSchema = z.object({
  type: z.literal('question'),
  purpose: z.enum(['clarify', 'guide', 'review']),
  text: z.string().trim().min(1),
  relatedStepIds: z.array(z.string()).optional(),
});

export const CoachActionDraftSchema = z.object({
  type: z.literal('next-action'),
  action: CoachActionSchema,
  text: z.string().trim().min(1),
});

export const CoachDraftSchema = z.discriminatedUnion('type', [
  CoachQuestionDraftSchema,
  CoachActionDraftSchema,
]);

export const HintDraftSchema = z.object({
  outcome: HintOutcomeSchema,
  text: z.string().trim().min(1),
});

export const PossibleAnswerDraftSchema = z.object({
  approach: z.string().trim().min(1),
  rationale: z.string().trim().min(1),
  suggestedInteractions: z.array(
    z.object({
      from: z.string().trim().min(1),
      to: z.string().trim().min(1),
      text: z.string().trim(),
    }),
  ),
});

export type CoachQuestionDraft = z.infer<typeof CoachQuestionDraftSchema>;
export type CoachDraft = z.infer<typeof CoachDraftSchema>;
export type HintDraft = z.infer<typeof HintDraftSchema>;
export type PossibleAnswerDraft = z.infer<typeof PossibleAnswerDraftSchema>;

export type CoachFocus =
  | { kind: 'open' }
  | {
      kind: 'objective-gap';
      objective: ExerciseObjective;
      gap: string;
      evidence: string[];
    }
  | { kind: 'objective-unclear'; objective: ExerciseObjective; reason: string };

export type CoachInput = { context: CoachContext; focus: CoachFocus };

export type ObjectiveEvaluationInput = {
  context: CoachContext;
  objective: ExerciseObjective;
};

export type ProviderQuestion = Pick<
  CoachQuestion,
  'purpose' | 'text' | 'relatedStepIds'
>;

export type HintInput = {
  context: CoachContext;
  question: ProviderQuestion;
  level: HintLevel;
  previousHints: string[];
  objectives: ExerciseObjective[];
};

export type PossibleAnswerInput = {
  context: CoachContext;
  question: ProviderQuestion;
  previousHints: string[];
  objectives: ExerciseObjective[];
};

export type ReviewInput = {
  context: CoachContext;
  objectives: ExerciseObjective[];
};

export interface CoachAiProvider {
  generateCoachQuestion(input: CoachInput): Promise<CoachDraft>;
  generateHint(input: HintInput): Promise<HintDraft>;
  generatePossibleAnswer(
    input: PossibleAnswerInput,
  ): Promise<PossibleAnswerDraft>;
  evaluateObjective(
    input: ObjectiveEvaluationInput,
  ): Promise<ObjectiveEvaluation>;
  generateReview(input: ReviewInput): Promise<ReviewFeedback>;
}
