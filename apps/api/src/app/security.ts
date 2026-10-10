import { INestApplication } from '@nestjs/common';
import helmet from 'helmet';
import { securityConfig } from '../config/security.config';
import { REQUEST_ID_HEADER } from '../shared/http';

export function applySecurity(app: INestApplication): void {
  app.use(helmet());

  if (securityConfig.corsOrigins.length > 0) {
    app.enableCors({
      origin: securityConfig.corsOrigins,
      credentials: true,
      exposedHeaders: [REQUEST_ID_HEADER],
    });
  }
}
