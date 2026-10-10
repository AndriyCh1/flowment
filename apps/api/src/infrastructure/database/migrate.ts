import { join } from 'node:path';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, pool } from './client';

const POSTGRES_ERROR_FIELDS = [
  'code',
  'severity',
  'detail',
  'hint',
  'position',
  'where',
  'schema',
  'table',
  'column',
  'constraint',
  'routine',
] as const;

function logError(error: unknown, depth = 0): void {
  const indent = '  '.repeat(depth);
  if (!(error instanceof Error)) {
    console.error(`${indent}${String(error)}`);
    return;
  }

  console.error(`${indent}${error.name}: ${error.message}`);
  const fields = error as unknown as Record<string, unknown>;
  for (const field of POSTGRES_ERROR_FIELDS) {
    if (fields[field] !== undefined) {
      console.error(`${indent}  ${field}: ${String(fields[field])}`);
    }
  }

  if (error.cause !== undefined) {
    console.error(`${indent}caused by:`);
    logError(error.cause, depth + 1);
  }
}

async function main(): Promise<void> {
  try {
    await migrate(db, {
      migrationsFolder: join(__dirname, 'migrations'),
    });
    console.log('Migrations applied.');
  } catch (error) {
    console.error('Migration failed.');
    logError(error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

void main();
