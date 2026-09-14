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

/**
 * Thin, mockable wrapper around OpenRouter's chat completions API. Every
 * AI-facing service in this module depends on this, not on the SDK
 * directly, so tests never need real network access or a real API key.
 *
 * This is a drop-in replacement for the previous GeminiClient/ClaudeClient —
 * same `complete({ system, messages, maxTokens })` shape in, same
 * `Promise<string>` out — so AiService required no changes beyond its
 * constructor's injected type. OpenRouter speaks the OpenAI chat-completions
 * format, so we use the official `openai` SDK pointed at OpenRouter's base
 * URL rather than hand-rolling fetch calls — OpenRouter documents this as
 * the supported integration path.
 */
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
            // Optional per OpenRouter's docs — identifies this app on their
            // dashboard/leaderboards. Harmless to omit, but free to set.
            'X-Title': 'Weekly Report Generator & Team Dashboard',
          },
        })
      : null;
    this.model = this.config.get<string>('OPENROUTER_MODEL') ?? DEFAULT_MODEL;

    // AI_PROVIDER is read for operator clarity in logs/README only —
    // OpenRouter is currently the only implementation wired up, so an unset
    // or different value doesn't change behavior, only whether
    // OPENROUTER_API_KEY is expected to be present.
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
      // A clean, expected error for an unconfigured deployment — not a
      // crash. The frontend surfaces this as "AI isn't set up" rather than
      // a generic failure.
      throw new ServiceUnavailableException(
        'AI features are not configured on this server (missing OPENROUTER_API_KEY).',
      );
    }

    let text: string | null | undefined;
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        max_tokens: params.maxTokens ?? DEFAULT_MAX_TOKENS,
        // OpenRouter/OpenAI put the system prompt as its own message in the
        // same array, rather than as a separate top-level field the way
        // Anthropic and Gemini do — and 'user'/'assistant' map 1:1, so
        // ChatMessage needs no role translation here (unlike Gemini's
        // 'model' role).
        messages: [{ role: 'system', content: params.system }, ...params.messages],
      });
      text = response.choices[0]?.message?.content;
    } catch (error) {
      // Rate limits, timeouts, and connection failures are the SDK's
      // problem to throw and this class's job to translate: the caller
      // (AiService, then the controller) should only ever see "the AI
      // assistant is temporarily unavailable", never a raw SDK exception
      // shape or provider error text leaking into an HTTP response.
      this.logger.error('OpenRouter API call failed', error as Error);
      throw new ServiceUnavailableException('The AI assistant is temporarily unavailable.');
    }

    return (text ?? '').trim();
  }
}
