import { join } from 'node:path';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Client, Pool, type ClientConfig } from 'pg';
import type { TestProject } from 'vitest/node';

export default async function setup(project: TestProject): Promise<void> {
  const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, DB_SSL } =
    project.config.env;
  if (!DB_NAME?.endsWith('_test')) {
    throw new Error(
      `Refusing to run tests against database "${DB_NAME}"; its name must end with _test`,
    );
  }

  const connection: ClientConfig = {
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
    ssl: DB_SSL === 'true' ? { rejectUnauthorized: true } : false,
  };

  await createDatabaseIfMissing(connection, DB_NAME);

  const pool = new Pool({ ...connection, database: DB_NAME });
  try {
    await migrate(drizzle({ client: pool }), {
      migrationsFolder: join(
        project.config.root,
        'src/infrastructure/database/migrations',
      ),
    });
  } finally {
    await pool.end();
  }
}

async function createDatabaseIfMissing(
  connection: ClientConfig,
  name: string,
): Promise<void> {
  const client = new Client({ ...connection, database: 'postgres' });
  await client.connect();
  try {
    const existing = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [name],
    );
    if (existing.rowCount === 0) {
      await client.query(`CREATE DATABASE "${name.replaceAll('"', '""')}"`);
    }
  } finally {
    await client.end();
  }
}
