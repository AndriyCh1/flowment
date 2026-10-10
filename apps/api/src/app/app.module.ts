import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import { AllExceptionsFilter } from './shared/filters/all-exceptions.filter';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [DatabaseModule, HealthModule],
  controllers: [],
  providers: [
    // Validates request DTOs made with createZodDto.
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    // Parses responses against the DTO given to @ZodSerializerDto.
    { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
    // Every error response has the same body: { statusCode, message, error, path, timestamp }.
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
