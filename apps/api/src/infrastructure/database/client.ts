import { Inject } from '@nestjs/common';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import {
  databaseConfig,
  databaseConnectionString,
} from '../../config/database.config';
import * as schema from './schema';

export const DRIZZLE_CLIENT = Symbol('DRIZZLE_CLIENT');

export type Db = NodePgDatabase<typeof schema>;

export function InjectDb(): ParameterDecorator {
  return Inject(DRIZZLE_CLIENT);
}

// The pool connects lazily, so creating it does not require a reachable database.
// With DB_SSL=false the connection is plain, so a local Postgres without TLS works.
export const pool = new Pool({
  connectionString: databaseConnectionString(),
  ssl: databaseConfig.ssl ? { rejectUnauthorized: true } : false,
  max: 10,
  connectionTimeoutMillis: 10_000,
  options: '-c timezone=UTC',
});

export const db: Db = drizzle({ client: pool, schema, casing: 'snake_case' });
