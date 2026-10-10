import { defineConfig } from 'drizzle-kit';
import { Env } from './src/app/config/env';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/app/database/schema.ts',
  out: './src/app/database/migrations',
  casing: 'snake_case',
  dbCredentials: {
    host: Env.DB_HOST,
    port: Env.DB_PORT,
    user: Env.DB_USER,
    password: Env.DB_PASSWORD,
    database: Env.DB_NAME,
    ssl: Env.DB_SSL ? { rejectUnauthorized: true } : false,
  },
});
