import { Injectable } from '@nestjs/common';
import type { Redis } from 'ioredis';
import { withTimeout } from '../../shared/utils/with-timeout';
import { InjectRedis } from './redis.client';

@Injectable()
export class RedisHealth {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  /** Resolves when Redis answers PING; rejects otherwise. */
  async ping(timeoutMs: number): Promise<void> {
    await withTimeout(this.redis.ping(), timeoutMs, 'redis');
  }
}
