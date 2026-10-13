import {
  CoachModeSchema,
  CoachReplyTextSchema,
  CoachStageSchema,
  CoachTurnSchema,
  ExerciseObjectiveSchema,
  IdSchema,
  LearnerReplyKindSchema,
  ModelingIntentSchema,
} from '@flowment/domain';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { nullableString } from '../../shared/zod/openapi-helpers';

export const CoachSessionSchema = z.object({
  projectId: z.uuid(),
  mode: CoachModeSchema,
  modelingIntent: nullableString(),
  stage: CoachStageSchema,
  objectives: z.array(ExerciseObjectiveSchema),
  turns: z.array(CoachTurnSchema),
  activeQuestionId: nullableString(),
  designRevision: nullableString(),
});

export const UpdateModelingIntentSchema = z.object({
  modelingIntent: ModelingIntentSchema,
});

export const CoachNextSchema = z.object({
  scenarioId: IdSchema.optional(),
});

export const CoachReplySchema = z
  .object({
    questionId: IdSchema,
    kind: LearnerReplyKindSchema,
    text: CoachReplyTextSchema.default(''),
  })
  .refine((reply) => reply.kind !== 'answer' || reply.text.length > 0, {
    path: ['text'],
    message: 'Enter an answer',
  });

export type CoachSession = z.output<typeof CoachSessionSchema>;
export type UpdateModelingIntentInput = z.infer<
  typeof UpdateModelingIntentSchema
>;
export type CoachNextInput = z.infer<typeof CoachNextSchema>;
export type CoachReplyInput = z.infer<typeof CoachReplySchema>;

export class CoachSessionDto extends createZodDto(CoachSessionSchema, {
  codec: true,
}) {}
export class UpdateModelingIntentDto extends createZodDto(
  UpdateModelingIntentSchema,
) {}
export class CoachNextDto extends createZodDto(CoachNextSchema) {}
export class CoachReplyDto extends createZodDto(CoachReplySchema) {}
