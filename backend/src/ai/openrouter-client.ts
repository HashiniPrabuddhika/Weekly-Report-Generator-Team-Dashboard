import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const DEFAULT_MODEL = 'openrouter/free';
const DEFAULT_MAX_TOKENS = 1024;

@Injectable()
export class OpenRouterClient {
  private readonly logger = new Logger(OpenRouterClient.name);
  private readonly client: OpenAI | null;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('OPENROUTER_API_KEY');
    this.client = apiKey
      ? new OpenAI({
          apiKey,
          baseURL: OPENROUTER_BASE_URL,
          defaultHeaders: {
            'X-Title': 'Weekly Report Generator & Team Dashboard',
          },
        })
      : null;
    this.model = this.config.get<string>('OPENROUTER_MODEL') ?? DEFAULT_MODEL;

    const provider = this.config.get<string>('AI_PROVIDER');
    if (provider && provider !== 'openrouter') {
      this.logger.warn(
        `AI_PROVIDER is set to "${provider}", but only "openrouter" is implemented. Using OpenRouter.`,
      );
    }
  }

  get isConfigured(): boolean {
    return this.client !== null;
  }

  async complete(params: {
    system: string;
    messages: ChatMessage[];
    maxTokens?: number;
  }): Promise<string> {
    if (!this.client) {
      throw new ServiceUnavailableException(
        'AI features are not configured on this server (missing OPENROUTER_API_KEY).',
      );
    }

    let text: string | null | undefined;
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        max_tokens: params.maxTokens ?? DEFAULT_MAX_TOKENS,
        messages: [{ role: 'system', content: params.system }, ...params.messages],
      });
      text = response.choices[0]?.message?.content;
    } catch (error) {
      this.logger.error('OpenRouter API call failed', error as Error);
      throw new ServiceUnavailableException('The AI assistant is temporarily unavailable.');
    }

    return (text ?? '').trim();
  }
}
