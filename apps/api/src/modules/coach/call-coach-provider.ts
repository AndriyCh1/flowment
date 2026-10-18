import type { Logger } from '@nestjs/common';
import type { z } from 'zod';
import { CoachUnavailableError } from './coach.errors';

export async function callCoachProvider<Schema extends z.ZodType>(
  logger: Logger,
  task: string,
  schema: Schema,
  call: () => Promise<unknown>,
): Promise<z.output<Schema>> {
  try {
    return schema.parse(await call());
  } catch (error) {
    logger.error(
      `The coach provider failed to ${task}`,
      error instanceof Error ? (error.stack ?? error.message) : String(error),
    );
    throw new CoachUnavailableError({ cause: error });
  }
}
