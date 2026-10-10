import { ArgumentsHost, Logger, NotFoundException } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ApplicationError, ErrorCode } from '../../shared/errors';
import { AllExceptionsFilter } from './all-exceptions.filter';

class ThingConflictError extends ApplicationError {
  readonly code = ErrorCode.CONFLICT;
}

function setup() {
  const reply =
    vi.fn<(response: unknown, body: unknown, status: number) => void>();
  const adapterHost = {
    httpAdapter: { getRequestUrl: () => '/api/things', reply },
  } as unknown as HttpAdapterHost;
  const host = {
    switchToHttp: () => ({
      getRequest: () => ({ id: 'req-1' }),
      getResponse: () => ({}),
    }),
  } as unknown as ArgumentsHost;
  const filter = new AllExceptionsFilter(adapterHost);
  return { filter, host, reply };
}

describe('AllExceptionsFilter', () => {
  it('maps an ApplicationError code to its HTTP status', () => {
    const { filter, host, reply } = setup();

    filter.catch(new ThingConflictError('Thing exists'), host);

    expect(reply).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        statusCode: 409,
        message: 'Thing exists',
        error: 'CONFLICT',
        path: '/api/things',
        requestId: 'req-1',
      }),
      409,
    );
  });

  it('passes HttpException status and message through', () => {
    const { filter, host, reply } = setup();

    filter.catch(new NotFoundException('Nope'), host);

    expect(reply).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        statusCode: 404,
        message: 'Nope',
        error: 'Not Found',
      }),
      404,
    );
  });

  it('hides unknown errors behind a 500', () => {
    const { filter, host, reply } = setup();
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    filter.catch(new Error('db password is hunter2'), host);

    expect(reply).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        statusCode: 500,
        message: 'Internal server error',
        requestId: 'req-1',
      }),
      500,
    );
  });
});
