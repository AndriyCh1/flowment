import {
  CoachActionSchema,
  HintOutcomeSchema,
  type CoachQuestion,
  type ExerciseObjective,
  type HintLevel,
  type ObjectiveEvaluation,
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

export type CoachQuestionDraft = z.infer<typeof CoachQuestionDraftSchema>;
export type CoachDraft = z.infer<typeof CoachDraftSchema>;
export type HintDraft = z.infer<typeof HintDraftSchema>;

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

export type HintInput = {
  context: CoachContext;
  question: Pick<CoachQuestion, 'purpose' | 'text' | 'relatedStepIds'>;
  level: HintLevel;
  previousHints: string[];
  objectives: ExerciseObjective[];
};

export interface CoachAiProvider {
  generateCoachQuestion(input: CoachInput): Promise<CoachDraft>;
  generateHint(input: HintInput): Promise<HintDraft>;
  evaluateObjective(
    input: ObjectiveEvaluationInput,
  ): Promise<ObjectiveEvaluation>;
}
