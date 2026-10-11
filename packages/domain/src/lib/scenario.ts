import { z } from 'zod';
import { IdSchema } from './id.js';
import { reportDuplicateIds } from './validation.js';

export const OperationKindSchema = z.enum([
  'read',
  'write',
  'request',
  'response',
  'message',
  'internal',
  'other',
]);

export type OperationKind = z.infer<typeof OperationKindSchema>;

export const InteractionSemanticsSchema = z.strictObject({
  stateEffects: z.array(z.string()).optional(),
  operationKind: OperationKindSchema.optional(),
});

export type InteractionSemantics = z.infer<typeof InteractionSemanticsSchema>;

export const InteractionStepSchema = z.object({
  id: IdSchema,
  type: z.literal('interaction'),
  from: IdSchema,
  to: IdSchema,
  text: z.string(),
  semantics: InteractionSemanticsSchema.optional(),
});

export type InteractionStep = z.infer<typeof InteractionStepSchema>;

export const NoteStepSchema = z.object({
  id: IdSchema,
  type: z.literal('note'),
  text: z.string(),
  componentId: IdSchema.optional(),
});

export type NoteStep = z.infer<typeof NoteStepSchema>;

export const SequenceStepSchema = z.discriminatedUnion('type', [
  InteractionStepSchema,
  NoteStepSchema,
]);

export type SequenceStep = z.infer<typeof SequenceStepSchema>;

export const SequenceScenarioSchema = z
  .object({
    id: IdSchema,
    title: z.string(),
    description: z.string().optional(),
    steps: z.array(SequenceStepSchema),
  })
  .superRefine((scenario, ctx) => {
    reportDuplicateIds(scenario.steps, ['steps'], 'step', ctx);
  });

export type SequenceScenario = z.infer<typeof SequenceScenarioSchema>;
