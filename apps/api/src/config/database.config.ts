import { Env } from './env';

export const databaseConfig = {
  host: Env.DB_HOST,
  port: Env.DB_PORT,
  user: Env.DB_USER,
  password: Env.DB_PASSWORD,
  database: Env.DB_NAME,
  ssl: Env.DB_SSL,
};

export function databaseConnectionString(): string {
  const user = encodeURIComponent(databaseConfig.user);
  const password = encodeURIComponent(databaseConfig.password);
  return `postgres://${user}:${password}@${databaseConfig.host}:${databaseConfig.port}/${databaseConfig.database}`;
}
