import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';

export const DOCS_PATH = 'docs';

// Used by both the live /docs page and the generate-openapi script, so they
// describe the same contract. Call after configureApp(), so paths carry the
// global prefix.
export function createOpenApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('Flowment API')
    .setVersion('0.0.1')
    .build();
  const document = cleanupOpenApiDoc(SwaggerModule.createDocument(app, config));
  return dedupeTags(document);
}

// Nest adds an implicit controller tag next to @ApiTags, producing ["health", "health"].
function dedupeTags(document: OpenAPIObject): OpenAPIObject {
  for (const pathItem of Object.values(document.paths)) {
    for (const operation of Object.values(pathItem)) {
      if (operation && typeof operation === 'object' && 'tags' in operation) {
        const tags = (operation as { tags?: string[] }).tags;
        if (tags) {
          (operation as { tags?: string[] }).tags = [...new Set(tags)];
        }
      }
    }
  }
  return document;
}
