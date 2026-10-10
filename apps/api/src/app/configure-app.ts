import { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { securityConfig } from '../config/security.config';
import { applySecurity } from './security';

export const GLOBAL_PREFIX = 'api';

export function configureApp(app: INestApplication): void {
  if (securityConfig.trustProxy) {
    // Use X-Forwarded-For for req.ip, so rate limits apply per client, not per proxy.
    (app as NestExpressApplication).set('trust proxy', true);
  }

  applySecurity(app);
  // Health stays at the root so load balancers and probes can reach it.
  app.setGlobalPrefix(GLOBAL_PREFIX, { exclude: ['health', 'health/ready'] });
}
