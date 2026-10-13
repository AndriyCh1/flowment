import type { AiClient } from './ai.client';

export class UnavailableAiClient implements AiClient {
  generateObject(): Promise<never> {
    return Promise.reject(
      new Error('AI_PROVIDER is "mock", so no model is available'),
    );
  }
}
