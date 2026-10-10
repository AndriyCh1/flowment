import { defineConfig } from 'drizzle-kit';
import { databaseConfig } from './src/config/database.config';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/infrastructure/database/schema/index.ts',
  out: './src/infrastructure/database/migrations',
  casing: 'snake_case',
  dbCredentials: {
    host: databaseConfig.host,
    port: databaseConfig.port,
    user: databaseConfig.user,
    password: databaseConfig.password,
    database: databaseConfig.database,
    ssl: databaseConfig.ssl ? { rejectUnauthorized: true } : false,
  },
});
