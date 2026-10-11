import type { ErrorResponseDto } from '../api';

function isErrorResponse(error: unknown): error is ErrorResponseDto {
  return (
    typeof error === 'object' &&
    error !== null &&
    'statusCode' in error &&
    typeof error.statusCode === 'number'
  );
}

export function isClientError(error: unknown): boolean {
  return (
    isErrorResponse(error) && error.statusCode >= 400 && error.statusCode < 500
  );
}

export function isNotFound(error: unknown): boolean {
  return (
    isErrorResponse(error) &&
    (error.statusCode === 404 || error.statusCode === 400)
  );
}

export function errorMessage(error: unknown): string {
  if (isErrorResponse(error)) {
    return Array.isArray(error.message)
      ? error.message.join(', ')
      : error.message;
  }
  return 'Something went wrong. Try again.';
}
