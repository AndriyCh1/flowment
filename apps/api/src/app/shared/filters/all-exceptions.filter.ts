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

type ErrorResponseBody = {
  statusCode: number;
  message: string | string[];
  error: string;
  path: string;
  timestamp: string;
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

    const { statusCode, message, error } = this.normalize(exception, path);

    const body: ErrorResponseBody = {
      statusCode,
      message,
      error,
      path,
      timestamp: new Date().toISOString(),
    };

    httpAdapter.reply(ctx.getResponse(), body, statusCode);
  }

  private normalize(
    exception: unknown,
    path: string,
  ): { statusCode: number; message: string | string[]; error: string } {
    if (exception instanceof ZodSerializationException) {
      const zodError = exception.getZodError();

      this.logger.error(
        `Response serialization failed for ${path}`,
        zodError instanceof ZodError
          ? JSON.stringify(zodError.issues, null, 2)
          : zodError,
      );

      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        error: 'Internal Server Error',
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();

      if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
        this.logger.error(
          `${status} on ${path}`,
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
      `Unhandled exception on ${path}`,
      exception instanceof Error
        ? (exception.stack ?? exception.message)
        : String(exception),
    );

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error: 'Internal Server Error',
    };
  }
}
