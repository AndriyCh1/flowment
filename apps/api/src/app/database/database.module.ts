import { Global, Module, OnApplicationShutdown } from '@nestjs/common';
import { db, DRIZZLE_CLIENT, pool } from './client';

@Global()
@Module({
  providers: [{ provide: DRIZZLE_CLIENT, useValue: db }],
  exports: [DRIZZLE_CLIENT],
})
export class DatabaseModule implements OnApplicationShutdown {
  async onApplicationShutdown(): Promise<void> {
    await pool.end();
  }
}
