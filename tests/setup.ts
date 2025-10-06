import { beforeAll, afterAll, afterEach } from 'vitest'

beforeAll(async () => {
  // Test setup
  console.log('🧪 Setting up test environment...')

  // 環境変数設定
  // @ts-ignore - NODE_ENV is read-only in some environments
  process.env.NODE_ENV = 'test'
  process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
  process.env.NEXT_PUBLIC_SHORT_URL_DOMAIN = 'http://localhost:8787'

  // Supabase (テスト用)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
  }

  // OpenRouter (テスト用)
  if (!process.env.OPENROUTER_API_KEY) {
    process.env.OPENROUTER_API_KEY = 'test-api-key'
  }
  process.env.DEFAULT_AI_MODEL = 'deepseek/deepseek-v3.1:free'
})

afterAll(async () => {
  // Test cleanup
  console.log('✨ Cleaning up test environment...')
})

afterEach(() => {
  // 各テスト後のクリーンアップ
})
