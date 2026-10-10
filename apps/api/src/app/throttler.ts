import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { ThrottlerModule } from '@nestjs/throttler';
import type { Redis } from 'ioredis';
import { securityConfig } from '../config/security.config';
import { REDIS_CLIENT } from '../infrastructure/redis';

export const AppThrottlerModule = ThrottlerModule.forRootAsync({
  inject: [REDIS_CLIENT],
  useFactory: (redis: Redis) => ({
    throttlers: [
      {
        name: 'default',
        ttl: securityConfig.throttle.ttlMs,
        limit: securityConfig.throttle.limit,
      },
    ],
    storage: new ThrottlerStorageRedisService(redis),
  }),
});
