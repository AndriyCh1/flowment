import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ZodSerializationException } from 'nestjs-zod';
import { ZodError } from 'zod';
import { ApplicationError, ErrorCode } from '../../shared/errors';
import { ErrorResponseBody, getRequestId } from '../../shared/http';

const ERROR_CODE_STATUS: Record<ErrorCode, HttpStatus> = {
  [ErrorCode.NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorCode.CONFLICT]: HttpStatus.CONFLICT,
  [ErrorCode.VALIDATION]: HttpStatus.BAD_REQUEST,
  [ErrorCode.UNAUTHORIZED]: HttpStatus.UNAUTHORIZED,
  [ErrorCode.FORBIDDEN]: HttpStatus.FORBIDDEN,
};

type NormalizedError = Pick<
  ErrorResponseBody,
  'statusCode' | 'message' | 'error'
>;

const INTERNAL_ERROR: NormalizedError = {
  statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
  message: 'Internal server error',
  error: 'Internal Server Error',
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const path: string = httpAdapter.getRequestUrl(request) ?? '';
    const requestId = getRequestId(request);

    const { statusCode, message, error } = this.normalize(
      exception,
      requestId ? `${path} [${requestId}]` : path,
    );

    const body: ErrorResponseBody = {
      statusCode,
      message,
      error,
      path,
      timestamp: new Date().toISOString(),
      requestId,
    };

    httpAdapter.reply(ctx.getResponse(), body, statusCode);
  }

  private normalize(exception: unknown, where: string): NormalizedError {
    // Expected business errors from modules: map the code, don't log as failures.
    if (exception instanceof ApplicationError) {
      return {
        statusCode: ERROR_CODE_STATUS[exception.code],
        message: exception.message,
        error: exception.code,
      };
    }

    if (exception instanceof ZodSerializationException) {
      const zodError = exception.getZodError();

      this.logger.error(
        `Response serialization failed for ${where}`,
        zodError instanceof ZodError
          ? JSON.stringify(zodError.issues, null, 2)
          : zodError,
      );

      return INTERNAL_ERROR;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();

      if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
        this.logger.error(
          `${status} on ${where}`,
          exception.stack ?? exception.message,
        );
      }

      if (typeof response === 'string') {
        return { statusCode: status, message: response, error: exception.name };
      }

      const record = response as Record<string, unknown>;

      return {
        statusCode: status,
        message: (record.message as string | string[]) ?? exception.message,
        error: (record.error as string) ?? exception.name,
      };
    }

    this.logger.error(
      `Unhandled exception on ${where}`,
      exception instanceof Error
        ? (exception.stack ?? exception.message)
        : String(exception),
    );

    return INTERNAL_ERROR;
  }
}
