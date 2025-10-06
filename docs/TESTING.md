# テストガイド

LinkTraqのテスト実装と実行方法

## テスト構成

```
tests/
├── setup.ts                 # テストセットアップ (環境変数等)
├── unit/                    # ユニットテスト
│   └── openrouter.test.ts  # OpenRouterクライアントテスト
├── integration/             # 統合テスト
│   └── api.test.ts         # APIエンドポイントテスト
├── e2e/                     # E2Eテスト (Playwright)
├── fixtures/                # テストデータ
└── db/                      # データベーステスト
```

## テストツール

- **Vitest**: ユニットテスト・統合テスト
- **Playwright**: E2Eテスト
- **v8**: カバレッジレポート

## テスト実行

### すべてのテスト

```bash
npm test
```

### 特定のテストファイル

```bash
npm test -- tests/unit/openrouter.test.ts
```

### ウォッチモード

```bash
npm test -- --watch
```

### カバレッジレポート

```bash
npm test -- --coverage
```

### E2Eテスト (Playwright)

```bash
npm run test:e2e
```

## ユニットテスト

### OpenRouterクライアント

**ファイル**: `tests/unit/openrouter.test.ts`

**テスト内容**:
- ✅ インスタンス作成
- ✅ チャットAPI呼び出し
- ✅ APIエラーハンドリング
- ✅ カスタムオプション
- ✅ API Key検証

**実行**:
```bash
npm test -- tests/unit/openrouter.test.ts
```

**結果**:
```
✓ tests/unit/openrouter.test.ts (9 tests) 6ms
  ✓ OpenRouterClient
    ✓ constructor
      ✓ should create instance with API key
      ✓ should use default model if provided
    ✓ chat
      ✓ should call OpenRouter API with correct parameters
      ✓ should handle API errors
      ✓ should use custom options
    ✓ validateApiKey
      ✓ should return true for valid API key
      ✓ should return false for invalid API key
  ✓ getServiceOpenRouterClient
    ✓ should throw error if OPENROUTER_API_KEY is not set
    ✓ should create client with environment variables
```

## 統合テスト

### APIエンドポイント

**ファイル**: `tests/integration/api.test.ts`

**テスト内容**:
- ✅ ヘルスチェック
- ✅ APIルート構造確認
- ✅ 認証必須エンドポイント

**実行**:
```bash
# ローカルサーバーを起動
npm run dev

# 別ターミナルでテスト実行
npm test -- tests/integration/api.test.ts
```

**スキップ**:
統合テストはローカルサーバーが必要です。サーバーが起動していない場合はスキップされます。

```bash
SKIP_INTEGRATION_TESTS=true npm test
```

## テスト環境変数

`tests/setup.ts` で設定:

```typescript
// Supabase (テスト用)
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'

// OpenRouter (テスト用)
process.env.OPENROUTER_API_KEY = 'test-api-key'
process.env.DEFAULT_AI_MODEL = 'deepseek/deepseek-v3.1:free'
```

## モックの使用

### fetchのモック

```typescript
import { vi } from 'vitest'

global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: 'test' }),
  } as any)
)
```

### Supabaseクライアントのモック

```typescript
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(() => ({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { id: 'test-id' },
            error: null,
          })),
        })),
      })),
    })),
  })),
}))
```

## E2Eテスト (Playwright)

### セットアップ

```bash
npx playwright install
```

### 実行

```bash
npm run test:e2e
```

### ヘッドレスモード無効 (ブラウザ表示)

```bash
npm run test:e2e -- --headed
```

### 特定のブラウザ

```bash
npm run test:e2e -- --project=chromium
npm run test:e2e -- --project=firefox
npm run test:e2e -- --project=webkit
```

## テスト作成ガイドライン

### 1. テストファイル命名規則

- ユニットテスト: `*.test.ts`
- 統合テスト: `*.test.ts` (integration/ ディレクトリ)
- E2Eテスト: `*.spec.ts` (e2e/ ディレクトリ)

### 2. テスト構造

```typescript
import { describe, it, expect, beforeEach } from 'vitest'

describe('機能名', () => {
  beforeEach(() => {
    // 各テスト前のセットアップ
  })

  describe('メソッド名', () => {
    it('should do something', () => {
      // Arrange (準備)
      const input = 'test'

      // Act (実行)
      const result = functionToTest(input)

      // Assert (検証)
      expect(result).toBe('expected')
    })
  })
})
```

### 3. テストのベストプラクティス

#### ✅ DO

- 1つのテストで1つのことをテスト
- わかりやすいテスト名 (`should ...`)
- AAA パターン (Arrange, Act, Assert)
- モックは必要最小限
- テストデータはfixturesに分離

#### ❌ DON'T

- 外部APIに依存するテスト (モックを使用)
- テスト間で状態を共有
- ハードコードされた値 (環境変数やfixturesを使用)
- 長すぎるテスト (分割)

## カバレッジ目標

- **ユニットテスト**: 80%以上
- **統合テスト**: 主要フロー100%
- **E2Eテスト**: クリティカルパス100%

## CI/CD統合

### GitHub Actions

`.github/workflows/test.yml`:

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test -- --run

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## トラブルシューティング

### テストがタイムアウトする

```bash
# タイムアウト時間を延長
npm test -- --testTimeout=10000
```

### モジュールが見つからない

```bash
# パスエイリアスを確認
# vitest.config.ts の resolve.alias を確認
```

### 環境変数が読み込まれない

```bash
# .env.local を .env.test にコピー
cp .env.local .env.test

# または環境変数を直接設定
NEXT_PUBLIC_SUPABASE_URL=... npm test
```

## 参考リンク

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
