import { ApplicationError, ErrorCode } from '../../shared/errors';

export class CoachQuestionNotActiveError extends ApplicationError {
  readonly code = ErrorCode.CONFLICT;

  constructor() {
    super('That question is no longer active');
  }
}

export class CoachHintsExhaustedError extends ApplicationError {
  readonly code = ErrorCode.CONFLICT;

  constructor() {
    super('There are no more hints for this question');
  }
}

export class CoachPossibleAnswerNotAvailableError extends ApplicationError {
  readonly code = ErrorCode.CONFLICT;

  constructor() {
    super('A possible answer is available only after the third hint');
  }
}

export class ReviewDesignEmptyError extends ApplicationError {
  readonly code = ErrorCode.CONFLICT;

  constructor() {
    super('Add something to the design before submitting it for review');
  }
}

export class CoachSessionChangedError extends ApplicationError {
  readonly code = ErrorCode.CONFLICT;

  constructor() {
    super(
      'The conversation changed while the coach was responding. Try again.',
    );
  }
}

export class CoachUnavailableError extends ApplicationError {
  readonly code = ErrorCode.UNAVAILABLE;

  constructor(options?: ErrorOptions) {
    super("The coach couldn't respond. Try again.", options);
  }
}
