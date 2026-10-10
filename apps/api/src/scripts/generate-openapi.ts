// Standalone script, not part of the Nest app: writes the OpenAPI spec that
// apps/web generates its API client from.
//
// The app is created but never listens, and the pool connects lazily, so no
// database is needed. src/app/config/env.ts still requires the DB_* variables.
import 'reflect-metadata';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app/app.module';
import { configureApp } from '../app/configure-app';
import { createOpenApiDocument } from '../app/openapi';

const OUTPUT_PATH = resolve(__dirname, '../../../web/openapi.json');

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: false });
  try {
    configureApp(app);
    const document = createOpenApiDocument(app);
    writeFileSync(OUTPUT_PATH, `${JSON.stringify(document, null, 2)}\n`);
    console.log(`OpenAPI spec written to ${OUTPUT_PATH}`);
  } finally {
    // Also ends the pg pool (DatabaseModule's shutdown hook).
    await app.close();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
