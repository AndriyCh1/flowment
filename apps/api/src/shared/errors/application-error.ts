import type { ErrorCode } from './error-codes';

/**
 * Base class for expected business errors. Modules extend it with their own
 * errors instead of throwing HTTP exceptions, and the
 * global exception filter turns `code` into a status and response body.
 */
export abstract class ApplicationError extends Error {
  abstract readonly code: ErrorCode;

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
  }
}
