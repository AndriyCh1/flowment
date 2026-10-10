import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { appConfig } from '../config/app.config';
import { createLogger } from '../infrastructure/logging';
import { AppModule } from './app.module';
import { configureApp, GLOBAL_PREFIX } from './configure-app';
import { registerProcessHandlers } from './shutdown';
import { createOpenApiDocument, DOCS_PATH } from './openapi';

export async function bootstrap(): Promise<void> {
  registerProcessHandlers();

  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(createLogger());

  configureApp(app);
  if (appConfig.docsEnabled) {
    SwaggerModule.setup(DOCS_PATH, app, () => createOpenApiDocument(app));
  }

  app.enableShutdownHooks();

  await app.listen(appConfig.port);

  const logger = new Logger('Bootstrap');
  logger.log(
    `Application (${appConfig.nodeEnv}) is running on: http://localhost:${appConfig.port}/${GLOBAL_PREFIX}`,
  );

  if (appConfig.docsEnabled) {
    logger.log(`API docs: http://localhost:${appConfig.port}/${DOCS_PATH}`);
  }
}
