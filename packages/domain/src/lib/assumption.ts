import { z } from 'zod';
import { IdSchema } from './id.js';

export const AssumptionStatusSchema = z.enum(['unknown', 'assumed', 'guaranteed']);

export type AssumptionStatus = z.infer<typeof AssumptionStatusSchema>;

export const AssumptionSchema = z.object({
  id: IdSchema,
  statement: z.string(),
  status: AssumptionStatusSchema,
  evidence: z.string().optional(),
});

export type Assumption = z.infer<typeof AssumptionSchema>;
