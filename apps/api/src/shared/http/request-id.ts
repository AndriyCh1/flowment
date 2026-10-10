import type { IncomingMessage } from 'node:http';

export const REQUEST_ID_HEADER = 'x-request-id';

export type RequestWithId = IncomingMessage & { id: string };

export function getRequestId(request: unknown): string | undefined {
  const id = (request as Partial<RequestWithId> | undefined)?.id;
  return typeof id === 'string' ? id : undefined;
}
