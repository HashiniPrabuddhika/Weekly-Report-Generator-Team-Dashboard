import { ConfigService } from '@nestjs/config';
import { ServiceUnavailableException } from '@nestjs/common';
import { OpenRouterClient } from './openrouter-client';

const mockCreate = jest.fn();

jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: { completions: { create: mockCreate } },
  }));
});

function makeConfig(values: Record<string, string | undefined>): ConfigService {
  return { get: jest.fn((key: string) => values[key]) } as unknown as ConfigService;
}

describe('OpenRouterClient', () => {
  beforeEach(() => {
    mockCreate.mockReset();
    mockCreate.mockResolvedValue({ choices: [{ message: { content: 'mocked response' } }] });
  });

  it('is not configured when OPENROUTER_API_KEY is unset', () => {
    const client = new OpenRouterClient(makeConfig({}));
    expect(client.isConfigured).toBe(false);
  });

  it('is configured when OPENROUTER_API_KEY is set', () => {
    const client = new OpenRouterClient(makeConfig({ OPENROUTER_API_KEY: 'sk-or-v1-test' }));
    expect(client.isConfigured).toBe(true);
  });

  it('throws ServiceUnavailableException from complete() when unconfigured, without touching the network', async () => {
    const client = new OpenRouterClient(makeConfig({}));
    await expect(
      client.complete({ system: 'x', messages: [{ role: 'user', content: 'hi' }] }),
    ).rejects.toThrow(ServiceUnavailableException);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('extracts choices[0].message.content from a successful call', async () => {
    const client = new OpenRouterClient(makeConfig({ OPENROUTER_API_KEY: 'sk-or-v1-test' }));
    const result = await client.complete({
      system: 'x',
      messages: [{ role: 'user', content: 'hi' }],
    });
    expect(result).toBe('mocked response');
  });

  it('defaults to openrouter/free when OPENROUTER_MODEL is unset', async () => {
    const client = new OpenRouterClient(makeConfig({ OPENROUTER_API_KEY: 'sk-or-v1-test' }));
    await client.complete({ system: 'x', messages: [{ role: 'user', content: 'hi' }] });

    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ model: 'openrouter/free' }));
  });

  it('uses OPENROUTER_MODEL when set', async () => {
    const client = new OpenRouterClient(
      makeConfig({ OPENROUTER_API_KEY: 'sk-or-v1-test', OPENROUTER_MODEL: 'openai/gpt-4o-mini' }),
    );
    await client.complete({ system: 'x', messages: [{ role: 'user', content: 'hi' }] });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'openai/gpt-4o-mini' }),
    );
  });

  it('sends the system prompt as the first message with role "system"', async () => {
    const client = new OpenRouterClient(makeConfig({ OPENROUTER_API_KEY: 'sk-or-v1-test' }));
    await client.complete({ system: 'be concise', messages: [{ role: 'user', content: 'hi' }] });

    const [call] = mockCreate.mock.calls;
    expect(call[0].messages[0]).toEqual({ role: 'system', content: 'be concise' });
  });

  it('passes user/assistant messages through unchanged (no role mapping needed)', async () => {
    const client = new OpenRouterClient(makeConfig({ OPENROUTER_API_KEY: 'sk-or-v1-test' }));
    await client.complete({
      system: 'x',
      messages: [
        { role: 'user', content: 'first' },
        { role: 'assistant', content: 'second' },
      ],
    });

    const [call] = mockCreate.mock.calls;
    expect(call[0].messages.slice(1)).toEqual([
      { role: 'user', content: 'first' },
      { role: 'assistant', content: 'second' },
    ]);
  });

  it('wraps an SDK failure (rate limit, timeout, connection error) as a clean 503, never leaking the raw error', async () => {
    mockCreate.mockRejectedValue(new Error('429 Too Many Requests'));
    const client = new OpenRouterClient(makeConfig({ OPENROUTER_API_KEY: 'sk-or-v1-test' }));

    await expect(
      client.complete({ system: 'x', messages: [{ role: 'user', content: 'hi' }] }),
    ).rejects.toThrow(ServiceUnavailableException);
  });

  it('returns an empty string rather than "undefined"/"null" when the response has no content', async () => {
    mockCreate.mockResolvedValue({ choices: [{ message: { content: null } }] });
    const client = new OpenRouterClient(makeConfig({ OPENROUTER_API_KEY: 'sk-or-v1-test' }));

    const result = await client.complete({
      system: 'x',
      messages: [{ role: 'user', content: 'hi' }],
    });
    expect(result).toBe('');
  });
});
