import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app/app.module';
import { configureApp, GLOBAL_PREFIX } from './app/configure-app';
import { createOpenApiDocument, DOCS_PATH } from './app/openapi';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  SwaggerModule.setup(DOCS_PATH, app, () => createOpenApiDocument(app));
  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${GLOBAL_PREFIX}`,
  );
  Logger.log(`📖 API docs: http://localhost:${port}/${DOCS_PATH}`);
}

bootstrap();
