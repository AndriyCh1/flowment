import { Env } from './env';

export const securityConfig = {
  corsOrigins: Env.CORS_ORIGINS,
  trustProxy: Env.TRUST_PROXY,
  throttle: {
    ttlMs: Env.THROTTLE_TTL_MS,
    limit: Env.THROTTLE_LIMIT,
  },
};
