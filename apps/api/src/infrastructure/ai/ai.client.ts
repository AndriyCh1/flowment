import { Inject } from '@nestjs/common';
import type { z } from 'zod';

export const AI_CLIENT = Symbol('AI_CLIENT');

export function InjectAiClient(): ParameterDecorator {
  return Inject(AI_CLIENT);
}

export type GenerateObjectRequest<Schema extends z.ZodType> = {
  name: string;
  instructions: string;
  input: string;
  schema: Schema;
};

export interface AiClient {
  generateObject<Schema extends z.ZodType>(
    request: GenerateObjectRequest<Schema>,
  ): Promise<z.output<Schema>>;
}
