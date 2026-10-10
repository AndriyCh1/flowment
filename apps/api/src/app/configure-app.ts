import { INestApplication } from '@nestjs/common';

export const GLOBAL_PREFIX = 'api';

export function configureApp(app: INestApplication): void {
  // Health stays at the root so load balancers and probes can reach it.
  app.setGlobalPrefix(GLOBAL_PREFIX, { exclude: ['health'] });
}
