import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ErrorResponseSchema = z.object({
  statusCode: z.number().int(),
  message: z.union([z.string(), z.array(z.string())]),
  // An ErrorCode for ApplicationErrors, otherwise the HTTP error name.
  error: z.string(),
  path: z.string(),
  timestamp: z.string(),
  requestId: z.string().optional(),
});

export type ErrorResponseBody = z.infer<typeof ErrorResponseSchema>;

export class ErrorResponseDto extends createZodDto(ErrorResponseSchema) {}
