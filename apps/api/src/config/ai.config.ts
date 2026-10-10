import { Env } from './env';

export type AiConfig =
  { provider: 'openai'; apiKey: string; model: string } | { provider: 'mock' };

export const aiConfig: AiConfig =
  Env.AI_PROVIDER === 'openai'
    ? {
        provider: 'openai',
        apiKey: Env.OPENAI_API_KEY,
        model: Env.OPENAI_MODEL,
      }
    : { provider: 'mock' };
