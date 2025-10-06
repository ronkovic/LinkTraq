/**
 * OpenRouter API クライアント
 * https://openrouter.ai/docs
 */

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface OpenRouterRequest {
  model: string
  messages: OpenRouterMessage[]
  temperature?: number
  max_tokens?: number
  top_p?: number
  frequency_penalty?: number
  presence_penalty?: number
  stop?: string[]
}

export interface OpenRouterResponse {
  id: string
  model: string
  created: number
  choices: {
    index: number
    message: OpenRouterMessage
    finish_reason: string
  }[]
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface OpenRouterError {
  error: {
    message: string
    type: string
    code: string
  }
}

export class OpenRouterClient {
  private apiKey: string
  private baseUrl = 'https://openrouter.ai/api/v1'
  private defaultModel = 'deepseek/deepseek-v3.1:free'

  constructor(apiKey: string, defaultModel?: string) {
    this.apiKey = apiKey
    if (defaultModel) {
      this.defaultModel = defaultModel
    }
  }

  /**
   * チャット完了API呼び出し
   */
  async chat(
    messages: OpenRouterMessage[],
    options?: {
      model?: string
      temperature?: number
      max_tokens?: number
      top_p?: number
      frequency_penalty?: number
      presence_penalty?: number
      stop?: string[]
    }
  ): Promise<OpenRouterResponse> {
    const request: OpenRouterRequest = {
      model: options?.model || this.defaultModel,
      messages,
      temperature: options?.temperature,
      max_tokens: options?.max_tokens,
      top_p: options?.top_p,
      frequency_penalty: options?.frequency_penalty,
      presence_penalty: options?.presence_penalty,
      stop: options?.stop,
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://linktraq.com',
        'X-Title': 'LinkTraq',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const error: OpenRouterError = await response.json()
      throw new Error(`OpenRouter API error: ${error.error.message}`)
    }

    return await response.json()
  }

  /**
   * モデル一覧取得
   */
  async getModels(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/models`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch models')
    }

    return await response.json()
  }

  /**
   * 使用量取得
   */
  async getUsage(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/generation`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch usage')
    }

    return await response.json()
  }

  /**
   * API Key検証
   */
  async validateApiKey(): Promise<boolean> {
    try {
      await this.getModels()
      return true
    } catch (error) {
      return false
    }
  }
}

/**
 * サービス提供のOpenRouterクライアント取得
 */
export function getServiceOpenRouterClient(): OpenRouterClient {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not set')
  }
  return new OpenRouterClient(apiKey, process.env.DEFAULT_AI_MODEL)
}

/**
 * ユーザー自身のOpenRouterクライアント取得
 */
export function getUserOpenRouterClient(
  userApiKey: string,
  defaultModel?: string
): OpenRouterClient {
  return new OpenRouterClient(userApiKey, defaultModel)
}
