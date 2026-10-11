import { z } from 'zod';
import { IdSchema } from './id.js';

export const ComponentKindSchema = z.enum([
  'user',
  'client',
  'service',
  'database',
  'queue',
  'storage',
  'external-system',
  'other',
]);

export type ComponentKind = z.infer<typeof ComponentKindSchema>;

export const ComponentSchema = z.object({
  id: IdSchema,
  name: z.string(),
  responsibility: z.string().optional(),
  kind: ComponentKindSchema.optional(),
});

export type Component = z.infer<typeof ComponentSchema>;
