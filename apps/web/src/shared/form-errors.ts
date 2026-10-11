import type { FieldError } from 'react-hook-form';

export function fieldErrorMessages(error: FieldError | undefined): string[] {
  if (!error) {
    return [];
  }

  const messages = Object.values(error.types ?? {})
    .flat()
    .filter((message): message is string => typeof message === 'string');

  if (messages.length > 0) {
    return messages;
  }

  return error.message ? [error.message] : [];
}
