import { Global, Inject, Module, OnApplicationShutdown } from '@nestjs/common';
import type { Redis } from 'ioredis';
import { createRedisClient, REDIS_CLIENT } from './redis.client';
import { RedisHealth } from './redis.health';

@Global()
@Module({
  providers: [
    { provide: REDIS_CLIENT, useFactory: createRedisClient },
    RedisHealth,
  ],
  exports: [REDIS_CLIENT, RedisHealth],
})
export class RedisModule implements OnApplicationShutdown {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async onApplicationShutdown(): Promise<void> {
    switch (this.redis.status) {
      case 'end':
        return;
      case 'ready':
        try {
          await this.redis.quit();
        } catch {
          this.redis.disconnect();
        }
        return;
      default:
        this.redis.disconnect();
    }
  }
}
