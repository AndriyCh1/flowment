import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  getOptionsToken,
  type ThrottlerModuleOptions,
} from '@nestjs/throttler';
import { AppModule } from '../src/app/app.module';
import { configureApp } from '../src/app/configure-app';
import { DRIZZLE_CLIENT, type Db } from '../src/infrastructure/database';

const throttlerDisabled: ThrottlerModuleOptions = {
  throttlers: [{ ttl: 60_000, limit: 1 }],
  skipIf: () => true,
};

export type TestResponse<T = unknown> = { status: number; body: T };

export type TestApp = {
  app: INestApplication;
  db: Db;
  request<T = unknown>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<TestResponse<T>>;
  close(): Promise<void>;
};

export async function createTestApp(): Promise<TestApp> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(getOptionsToken())
    .useValue(throttlerDisabled)
    .compile();

  const app = moduleRef.createNestApplication({ logger: false });
  configureApp(app);
  await app.listen(0, '127.0.0.1');
  const baseUrl = await app.getUrl();

  return {
    app,
    db: app.get<Db>(DRIZZLE_CLIENT),
    async request<T>(method: string, path: string, body?: unknown) {
      const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers:
          body === undefined ? {} : { 'content-type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const text = await response.text();
      return {
        status: response.status,
        body: (text ? JSON.parse(text) : undefined) as T,
      };
    },
    close: () => app.close(),
  };
}
