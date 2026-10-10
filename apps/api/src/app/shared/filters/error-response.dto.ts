import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// Documents the body AllExceptionsFilter sends for every error, so the
// generated client types `error` instead of leaving it `unknown`.
export const ErrorResponseSchema = z.object({
  statusCode: z.number().int(),
  message: z.union([z.string(), z.array(z.string())]),
  error: z.string(),
  path: z.string(),
  timestamp: z.string(),
});

export class ErrorResponseDto extends createZodDto(ErrorResponseSchema) {}
