import { CoachReplyTextSchema, ModelingIntentSchema } from '@flowment/domain';
import { z } from 'zod';

export const ModelingIntentFormSchema = z.object({
  modelingIntent: ModelingIntentSchema,
});

export const CoachReplyFormSchema = z.object({
  text: CoachReplyTextSchema.min(1, 'Enter an answer'),
});
