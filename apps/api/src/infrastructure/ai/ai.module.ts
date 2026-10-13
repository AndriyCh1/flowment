import { Global, Module } from '@nestjs/common';
import { aiConfig } from '../../config/ai.config';
import { AI_CLIENT, type AiClient } from './ai.client';
import { OpenAiClient } from './openai-ai.client';
import { UnavailableAiClient } from './unavailable-ai.client';

function createAiClient(): AiClient {
  return aiConfig.provider === 'openai'
    ? new OpenAiClient(aiConfig)
    : new UnavailableAiClient();
}

@Global()
@Module({
  providers: [{ provide: AI_CLIENT, useFactory: createAiClient }],
  exports: [AI_CLIENT],
})
export class AiModule {}
