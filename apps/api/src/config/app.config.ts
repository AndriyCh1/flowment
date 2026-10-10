import { Env } from './env';

const LOG_LEVELS = [
  'verbose',
  'debug',
  'log',
  'warn',
  'error',
  'fatal',
] as const;

export type LogLevel = (typeof LOG_LEVELS)[number];

const isProduction = Env.NODE_ENV === 'production';

export const appConfig = {
  nodeEnv: Env.NODE_ENV,
  isProduction,
  port: Env.PORT,
  logLevels: LOG_LEVELS.slice(LOG_LEVELS.indexOf(Env.LOG_LEVEL)) as LogLevel[],
  docsEnabled: Env.API_DOCS_ENABLED ?? !isProduction,
  shutdownTimeoutMs: Env.SHUTDOWN_TIMEOUT_MS,
};
