import {
  CoachActionSchema,
  type ExerciseObjective,
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

export type CoachQuestionDraft = z.infer<typeof CoachQuestionDraftSchema>;
export type CoachDraft = z.infer<typeof CoachDraftSchema>;

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

export interface CoachAiProvider {
  generateCoachQuestion(input: CoachInput): Promise<CoachDraft>;
  evaluateObjective(
    input: ObjectiveEvaluationInput,
  ): Promise<ObjectiveEvaluation>;
}
