import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import type { z } from 'zod';
import type { AiClient, GenerateObjectRequest } from './ai.client';

const REQUEST_TIMEOUT_MS = 45_000;

type OpenAiSettings = { apiKey: string; model: string };

export class OpenAiClient implements AiClient {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor({ apiKey, model }: OpenAiSettings) {
    this.client = new OpenAI({ apiKey, timeout: REQUEST_TIMEOUT_MS });
    this.model = model;
  }

  async generateObject<Schema extends z.ZodType>({
    name,
    instructions,
    input,
    schema,
  }: GenerateObjectRequest<Schema>): Promise<z.output<Schema>> {
    const response = await this.client.responses.parse({
      model: this.model,
      instructions,
      input,
      store: false,
      text: { format: zodTextFormat(schema, name) },
    });

    if (response.output_parsed === null) {
      throw new Error(`The model returned no "${name}" output`);
    }

    return schema.parse(response.output_parsed);
  }
}
