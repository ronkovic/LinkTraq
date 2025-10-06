import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OpenRouterClient, getServiceOpenRouterClient } from '@/lib/ai/openrouter'

describe('OpenRouterClient', () => {
  let client: OpenRouterClient

  beforeEach(() => {
    client = new OpenRouterClient('test-api-key', 'deepseek/deepseek-v3.1:free')
  })

  describe('constructor', () => {
    it('should create instance with API key', () => {
      expect(client).toBeInstanceOf(OpenRouterClient)
    })

    it('should use default model if provided', () => {
      const customClient = new OpenRouterClient('test-key', 'custom-model')
      expect(customClient).toBeInstanceOf(OpenRouterClient)
    })
  })

  describe('chat', () => {
    it('should call OpenRouter API with correct parameters', async () => {
      // Mock fetch
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              id: 'test-id',
              model: 'deepseek/deepseek-v3.1:free',
              created: Date.now(),
              choices: [
                {
                  index: 0,
                  message: {
                    role: 'assistant',
                    content: 'Test response',
                  },
                  finish_reason: 'stop',
                },
              ],
              usage: {
                prompt_tokens: 10,
                completion_tokens: 5,
                total_tokens: 15,
              },
            }),
        } as any)
      )

      const messages = [
        { role: 'user' as const, content: 'Test message' },
      ]

      const response = await client.chat(messages)

      expect(response.choices[0].message.content).toBe('Test response')
      expect(response.usage.total_tokens).toBe(15)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/chat/completions'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json',
          }),
        })
      )
    })

    it('should handle API errors', async () => {
      // Mock fetch error
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          json: () =>
            Promise.resolve({
              error: {
                message: 'Invalid API key',
                type: 'authentication_error',
                code: '401',
              },
            }),
        } as any)
      )

      const messages = [
        { role: 'user' as const, content: 'Test message' },
      ]

      await expect(client.chat(messages)).rejects.toThrow('Invalid API key')
    })

    it('should use custom options', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              id: 'test-id',
              model: 'custom-model',
              created: Date.now(),
              choices: [
                {
                  index: 0,
                  message: {
                    role: 'assistant',
                    content: 'Test response',
                  },
                  finish_reason: 'stop',
                },
              ],
              usage: {
                prompt_tokens: 10,
                completion_tokens: 5,
                total_tokens: 15,
              },
            }),
        } as any)
      )

      const messages = [
        { role: 'user' as const, content: 'Test message' },
      ]

      await client.chat(messages, {
        model: 'custom-model',
        temperature: 0.5,
        max_tokens: 100,
      })

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"model":"custom-model"'),
        })
      )
    })
  })

  describe('validateApiKey', () => {
    it('should return true for valid API key', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        } as any)
      )

      const isValid = await client.validateApiKey()
      expect(isValid).toBe(true)
    })

    it('should return false for invalid API key', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
        } as any)
      )

      const isValid = await client.validateApiKey()
      expect(isValid).toBe(false)
    })
  })
})

describe('getServiceOpenRouterClient', () => {
  it('should throw error if OPENROUTER_API_KEY is not set', () => {
    const originalKey = process.env.OPENROUTER_API_KEY
    delete process.env.OPENROUTER_API_KEY

    expect(() => getServiceOpenRouterClient()).toThrow('OPENROUTER_API_KEY is not set')

    process.env.OPENROUTER_API_KEY = originalKey
  })

  it('should create client with environment variables', () => {
    process.env.OPENROUTER_API_KEY = 'test-key'
    process.env.DEFAULT_AI_MODEL = 'test-model'

    const client = getServiceOpenRouterClient()
    expect(client).toBeInstanceOf(OpenRouterClient)
  })
})
