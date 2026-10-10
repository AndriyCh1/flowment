import { Env } from './env';

export const redisConfig = {
  host: Env.REDIS_HOST,
  port: Env.REDIS_PORT,
  // An empty REDIS_PASSWORD means no auth.
  password: Env.REDIS_PASSWORD || undefined,
  db: Env.REDIS_DB,
};
