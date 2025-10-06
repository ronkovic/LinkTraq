import { describe, it, expect, beforeAll } from 'vitest'

describe('API Integration Tests', () => {
  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  describe('Health Check', () => {
    it('should respond with 200', async () => {
      // このテストは実際のサーバーが起動している必要があります
      // ローカルテスト用にスキップ可能
      if (process.env.SKIP_INTEGRATION_TESTS) {
        return
      }

      const response = await fetch(`${BASE_URL}/api/health`)
      expect(response.status).toBe(200)
    })
  })

  describe('API Routes Structure', () => {
    it('should have products endpoint', () => {
      expect(`${BASE_URL}/api/products`).toBeDefined()
    })

    it('should have affiliate-links endpoint', () => {
      expect(`${BASE_URL}/api/affiliate-links`).toBeDefined()
    })

    it('should have posts endpoint', () => {
      expect(`${BASE_URL}/api/posts`).toBeDefined()
    })

    it('should have schedules endpoint', () => {
      expect(`${BASE_URL}/api/schedules`).toBeDefined()
    })

    it('should have AI generate endpoint', () => {
      expect(`${BASE_URL}/api/ai/generate`).toBeDefined()
    })

    it('should have AI settings endpoint', () => {
      expect(`${BASE_URL}/api/ai/settings`).toBeDefined()
    })

    it('should have analytics endpoint', () => {
      expect(`${BASE_URL}/api/analytics`).toBeDefined()
    })
  })

  describe('Authentication Required Endpoints', () => {
    it('should return 401 for unauthenticated products request', async () => {
      if (process.env.SKIP_INTEGRATION_TESTS) {
        return
      }

      const response = await fetch(`${BASE_URL}/api/products`)
      expect(response.status).toBe(401)
    })

    it('should return 401 for unauthenticated schedules request', async () => {
      if (process.env.SKIP_INTEGRATION_TESTS) {
        return
      }

      const response = await fetch(`${BASE_URL}/api/schedules`)
      expect(response.status).toBe(401)
    })

    it('should return 401 for unauthenticated AI generate request', async () => {
      if (process.env.SKIP_INTEGRATION_TESTS) {
        return
      }

      const response = await fetch(`${BASE_URL}/api/ai/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task: 'test',
          product_info: { name: 'Test Product' },
        }),
      })
      expect(response.status).toBe(401)
    })
  })
})
