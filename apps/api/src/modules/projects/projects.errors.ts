import { ApplicationError, ErrorCode } from '../../shared/errors';

export class ProjectNotFoundError extends ApplicationError {
  readonly code = ErrorCode.NOT_FOUND;

  constructor(id: string) {
    super(`Project ${id} not found`);
  }
}
