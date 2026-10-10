import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { withTimeout } from '../../shared/utils/with-timeout';
import { InjectDb, type Db } from './client';

@Injectable()
export class DatabaseHealth {
  constructor(@InjectDb() private readonly db: Db) {}

  async ping(timeoutMs: number): Promise<void> {
    await withTimeout(this.db.execute(sql`SELECT 1`), timeoutMs, 'database');
  }
}
