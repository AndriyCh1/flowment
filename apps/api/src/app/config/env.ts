import 'dotenv/config';
import { z } from 'zod';

/** `OPENAI_*` are required only when OpenAI is the provider. */
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
    DB_HOST: z.string().min(1),
    DB_PORT: z.coerce.number().int().positive(),
    DB_USER: z.string().min(1),
    DB_PASSWORD: z.string(),
    DB_NAME: z.string().min(1),
    DB_SSL: z.enum(['true', 'false']).transform((value) => value === 'true'),
  })
  .and(AiEnvSchema);

export type Env = z.infer<typeof EnvSchema>;

function loadEnv(): Env {
  // Without AI_PROVIDER the mock is used, so the app runs without an AI key.
  const result = EnvSchema.safeParse({ AI_PROVIDER: 'mock', ...process.env });
  if (!result.success) {
    console.error('Invalid environment variables:');
    console.error(z.prettifyError(result.error));
    process.exit(1);
  }
  return result.data;
}

export const Env = loadEnv();
