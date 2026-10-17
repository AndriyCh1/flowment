import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import { AiModule } from '../infrastructure/ai';
import { DatabaseModule } from '../infrastructure/database';
import { RedisModule } from '../infrastructure/redis';
import { CoachModule } from '../modules/coach';
import { ExercisesModule } from '../modules/exercises';
import { ProjectsModule } from '../modules/projects';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { HealthModule } from './health/health.module';
import { RequestIdMiddleware } from './middleware/request-id.middleware';
import { AppThrottlerModule } from './throttler';

@Module({
  imports: [
    DatabaseModule,
    RedisModule,
    AiModule,
    AppThrottlerModule,
    HealthModule,
    ProjectsModule,
    ExercisesModule,
    CoachModule,
  ],
  providers: [
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // '{*splat}' (path-to-regexp v8) matches every path, including the root.
    consumer.apply(RequestIdMiddleware).forRoutes('{*splat}');
  }
}
