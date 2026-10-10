import { Global, Module, OnApplicationShutdown } from '@nestjs/common';
import { db, DRIZZLE_CLIENT, pool } from './client';
import { DatabaseHealth } from './database.health';

@Global()
@Module({
  providers: [{ provide: DRIZZLE_CLIENT, useValue: db }, DatabaseHealth],
  exports: [DRIZZLE_CLIENT, DatabaseHealth],
})
export class DatabaseModule implements OnApplicationShutdown {
  async onApplicationShutdown(): Promise<void> {
    await pool.end();
  }
}
