import 'dotenv/config';
import { z } from 'zod';

const booleanString = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true');

const AiEnvSchema = z.discriminatedUnion('AI_PROVIDER', [
  z.object({
    AI_PROVIDER: z.literal('openai'),
    OPENAI_API_KEY: z.string().min(1),
    OPENAI_MODEL: z.string().min(1),
  }),
  z.object({ AI_PROVIDER: z.literal('mock') }),
]);

const EnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']),
    PORT: z.coerce.number().int().positive(),
    LOG_LEVEL: z
      .enum(['verbose', 'debug', 'log', 'warn', 'error', 'fatal'])
      .default('log'),
    API_DOCS_ENABLED: booleanString.optional(),
    SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().positive(),

    DB_HOST: z.string().min(1),
    DB_PORT: z.coerce.number().int().positive(),
    DB_USER: z.string().min(1),
    DB_PASSWORD: z.string(),
    DB_NAME: z.string().min(1),
    DB_SSL: booleanString,

    REDIS_HOST: z.string().min(1),
    REDIS_PORT: z.coerce.number().int().positive(),
    REDIS_PASSWORD: z.string().optional(),
    REDIS_DB: z.coerce.number().int().min(0),

    // Comma-separated. Empty disables CORS; the web dev server proxies instead.
    CORS_ORIGINS: z.string().transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
    // Set to true behind a load balancer, so rate limiting sees client IPs.
    TRUST_PROXY: booleanString.default(false),
    THROTTLE_TTL_MS: z.coerce.number().int().positive(),
    THROTTLE_LIMIT: z.coerce.number().int().positive(),
  })
  .and(AiEnvSchema);

export type Env = z.infer<typeof EnvSchema>;

function loadEnv(): Env {
  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment variables:');
    console.error(z.prettifyError(result.error));
    process.exit(1);
  }
  return result.data;
}

export const Env = loadEnv();
