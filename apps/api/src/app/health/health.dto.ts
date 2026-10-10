import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const HealthResponseSchema = z.object({
  status: z.literal('ok'),
});

const DependencyCheckSchema = z.object({
  status: z.enum(['up', 'down']),
  error: z.string().optional(),
});

export const ReadinessResponseSchema = z.object({
  status: z.enum(['ok', 'error']),
  checks: z.object({
    database: DependencyCheckSchema,
    redis: DependencyCheckSchema,
  }),
});

export type DependencyCheck = z.infer<typeof DependencyCheckSchema>;

export class HealthResponseDto extends createZodDto(HealthResponseSchema) {}
export class ReadinessResponseDto extends createZodDto(
  ReadinessResponseSchema,
) {}
