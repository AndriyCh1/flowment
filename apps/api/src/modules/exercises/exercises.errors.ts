import { ApplicationError, ErrorCode } from '../../shared/errors';

export class ExerciseNotFoundError extends ApplicationError {
  readonly code = ErrorCode.NOT_FOUND;

  constructor(id: string) {
    super(`Exercise ${id} not found`);
  }
}
