import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { REQUEST_ID_HEADER, RequestWithId } from '../../shared/http';

// Accept an upstream id (load balancer, gateway, client) only if it looks sane.
const VALID_REQUEST_ID = /^[\w.:-]{1,128}$/;

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(
    request: IncomingMessage,
    response: ServerResponse,
    next: () => void,
  ): void {
    const incoming = request.headers[REQUEST_ID_HEADER];
    const id =
      typeof incoming === 'string' && VALID_REQUEST_ID.test(incoming)
        ? incoming
        : randomUUID();
    (request as RequestWithId).id = id;
    response.setHeader(REQUEST_ID_HEADER, id);
    next();
  }
}
