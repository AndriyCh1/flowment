// Transport-agnostic error categories. app/errors maps each to an HTTP status.
export const ErrorCode = {
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  VALIDATION: 'VALIDATION',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  UNAVAILABLE: 'UNAVAILABLE',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
