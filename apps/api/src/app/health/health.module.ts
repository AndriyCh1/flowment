import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

// DatabaseHealth and RedisHealth come from their global infrastructure modules.
@Module({
  controllers: [HealthController],
})
export class HealthModule {}
