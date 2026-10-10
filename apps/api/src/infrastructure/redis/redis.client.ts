import { Inject, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { redisConfig } from '../../config/redis.config';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

export function InjectRedis(): ParameterDecorator {
  return Inject(REDIS_CLIENT);
}

export function createRedisClient(): Redis {
  const logger = new Logger('Redis');
  const client = new Redis({
    ...redisConfig,
    // Connects on the first command, so building the app (tests, the openapi
    // script) does not require a reachable Redis.
    lazyConnect: true,
    // Fail commands quickly while Redis is down instead of queueing them
    // through 20 reconnect attempts.
    maxRetriesPerRequest: 3,
  });
  // Without a listener ioredis prints "Unhandled error event" for every retry.
  client.on('error', (error: Error) => logger.error(error.message));
  return client;
}
