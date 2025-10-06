# AI統合 (OpenRouter)

LinkTraqのAI文章生成機能の設計と実装ドキュメント

## 概要

OpenRouterを使用して、商品情報から自動的にSNS投稿文を生成します。

### 主な機能

- AI文章生成 (商品説明からSNS投稿文作成)
- ユーザー独自のAPI Key対応
- サービス提供のAPI Key対応
- 月次使用量制限
- モデル選択

## アーキテクチャ

```
┌─────────────────────────────────────────────────┐
│          Next.js Frontend                       │
│  - AI文章生成UI                                  │
│  - AI設定管理UI                                  │
└──────────────────┬──────────────────────────────┘
                   │
                   ↓ API Request
         ┌─────────────────────┐
         │   API Routes        │
         │  /api/ai/generate   │
         │  /api/ai/settings   │
         └──────────┬──────────┘
                    │
                    ↓ Get settings
         ┌──────────────────────────┐
         │   Supabase              │
         │  ai_settings            │
         └──────────┬───────────────┘
                    │
                    ↓ API Key
         ┌──────────────────────────┐
         │ OpenRouter Client        │
         │  openrouter.ts           │
         └──────────┬───────────────┘
                    │
                    ↓ API Call
         ┌──────────────────────────┐
         │   OpenRouter API         │
         │  https://openrouter.ai   │
         └──────────────────────────┘
```

## データベーススキーマ

### ai_settings テーブル

```typescript
{
  id: uuid
  user_id: uuid (FK to users)
  provider: text                    // "openrouter"
  default_model: text              // "deepseek/deepseek-v3.1:free"
  use_own_api_key: text            // "true" or "false"
  api_key: text                    // 暗号化 - ユーザー自身のAPI Key
  api_key_last_4: text             // 表示用 "••••1234"
  api_key_verified_at: timestamp   // API Key検証時刻
  task_model_mapping: jsonb        // タスク別モデル設定
  monthly_usage_limit: integer     // 月次使用量制限 (トークン数)
  current_month_usage: integer     // 当月使用量
  created_at: timestamp
  updated_at: timestamp
}
```

## OpenRouterクライアント

### 基本的な使い方

```typescript
import { getServiceOpenRouterClient, getUserOpenRouterClient } from '@/lib/ai/openrouter'

// サービス提供のAPI Key使用
const client = getServiceOpenRouterClient()

// ユーザー自身のAPI Key使用
const client = getUserOpenRouterClient(userApiKey, defaultModel)

// チャット完了
const response = await client.chat([
  {
    role: 'system',
    content: 'あなたはSNSマーケティングの専門家です。',
  },
  {
    role: 'user',
    content: '商品名: 高性能ワイヤレスイヤホン\n価格: 15,000円',
  },
], {
  model: 'deepseek/deepseek-v3.1:free',
  temperature: 0.7,
  max_tokens: 500,
})

console.log(response.choices[0].message.content)
console.log(response.usage.total_tokens)
```

### API Key検証

```typescript
const isValid = await client.validateApiKey()
if (!isValid) {
  throw new Error('Invalid API key')
}
```

## API エンドポイント

### POST /api/ai/generate

AI文章生成

**リクエストボディ:**
```json
{
  "task": "SNS投稿文作成",
  "product_info": {
    "name": "高性能ワイヤレスイヤホン",
    "description": "ノイズキャンセリング機能搭載",
    "price": 15000,
    "currency": "JPY",
    "category": "Electronics"
  },
  "tone": "friendly",
  "length": "medium",
  "hashtags_count": 3,
  "custom_instructions": "若い女性向けにアピール"
}
```

**レスポンス:**
```json
{
  "generated_text": "🎧 通勤・通学のお供に最適！\n\n高性能ノイズキャンセリングで、あなただけの音楽空間を。\n長時間の使用でも快適な装着感💕\n\n#ワイヤレスイヤホン #ノイキャン #音楽好き",
  "tokens_used": 234,
  "model_used": "deepseek/deepseek-v3.1:free"
}
```

### GET /api/ai/settings

AI設定取得

**レスポンス:**
```json
{
  "settings": {
    "id": "uuid",
    "user_id": "uuid",
    "provider": "openrouter",
    "default_model": "deepseek/deepseek-v3.1:free",
    "use_own_api_key": "false",
    "api_key_last_4": null,
    "api_key_verified_at": null,
    "monthly_usage_limit": 100000,
    "current_month_usage": 1234,
    "created_at": "2025-10-03T10:00:00Z",
    "updated_at": "2025-10-03T10:00:00Z"
  }
}
```

### POST /api/ai/settings

AI設定作成・更新

**リクエストボディ:**
```json
{
  "default_model": "deepseek/deepseek-v3.1:free",
  "use_own_api_key": "true",
  "api_key": "sk-or-v1-xxxxxxxxxxxxx",
  "monthly_usage_limit": 200000
}
```

**レスポンス:**
```json
{
  "settings": {
    "id": "uuid",
    "user_id": "uuid",
    "provider": "openrouter",
    "default_model": "deepseek/deepseek-v3.1:free",
    "use_own_api_key": "true",
    "api_key_last_4": "1234",
    "api_key_verified_at": "2025-10-03T10:00:00Z",
    "monthly_usage_limit": 200000,
    "current_month_usage": 0
  }
}
```

### DELETE /api/ai/settings

API Key削除 (サービス提供のAPI Keyに戻す)

**レスポンス:**
```json
{
  "success": true
}
```

## プロンプト設計

### タスク別プロンプトテンプレート

#### 1. SNS投稿文作成

```
タスク: SNS投稿文作成

商品情報:
- 商品名: {product.name}
- 説明: {product.description}
- 価格: {product.price} {product.currency}
- カテゴリー: {product.category}

要件:
- トーン: {tone}
- 長さ: {length}
- ハッシュタグ数: {hashtags_count}個

注意事項:
- 商品の魅力を自然に伝える
- ターゲット層に響く言葉を選ぶ
- ハッシュタグは関連性の高いものを選ぶ
- アフィリエイトリンクは含めない (後で自動追加されます)
```

#### 2. ハッシュタグ提案

```
タスク: ハッシュタグ提案

商品情報:
- 商品名: {product.name}
- カテゴリー: {product.category}

要件:
- {count}個のハッシュタグを提案
- トレンドを考慮
- 検索されやすいものを優先
```

## トーン・長さの設定

### トーン (tone)

| 値 | 説明 |
|---|---|
| `friendly` | フレンドリーで親しみやすい |
| `professional` | プロフェッショナルで信頼感のある |
| `casual` | カジュアルでリラックスした |
| `enthusiastic` | 熱意があり情熱的な |
| `informative` | 情報的で教育的な |

### 長さ (length)

| 値 | 説明 | 文字数 |
|---|---|---|
| `short` | 短い | 50-100文字 |
| `medium` | 中程度 | 100-200文字 |
| `long` | 長い | 200-280文字 |

## 推奨モデル

### 無料モデル

| モデル | 用途 | 特徴 |
|---|---|---|
| `deepseek/deepseek-v3.1:free` | 汎用 | 高性能、無料 |
| `google/gemini-flash-1.5-8b:free` | 高速生成 | 高速、無料 |

### 有料モデル (高品質)

| モデル | 用途 | 特徴 |
|---|---|---|
| `anthropic/claude-3.5-sonnet` | 高品質な文章 | 非常に高品質 |
| `openai/gpt-4o` | 汎用 | 高品質、幅広い知識 |

## 使用量制限

### サービス提供のAPI Key

- デフォルト制限: 月100,000トークン/ユーザー
- `ai_settings.current_month_usage` で追跡
- 毎月1日にリセット (Cron実装予定)

### ユーザー独自のAPI Key

- 制限なし (OpenRouterの制限に従う)
- ユーザー自身で管理

## セキュリティ

### API Key保護

1. **暗号化**: Supabase Vaultで暗号化 (将来実装)
2. **表示制限**: 最後の4文字のみ表示 (`api_key_last_4`)
3. **レスポンス除外**: API Keyはレスポンスに含めない

### 検証

- API Key登録時に必ず検証
- `api_key_verified_at` で記録

## エラーハンドリング

### OpenRouter APIエラー

```typescript
try {
  const response = await client.chat(messages)
} catch (error) {
  if (error.message.includes('401')) {
    // 認証エラー
  } else if (error.message.includes('429')) {
    // レート制限
  } else if (error.message.includes('insufficient_quota')) {
    // クォータ不足
  } else {
    // その他のエラー
  }
}
```

### 使用量超過

```typescript
if (aiSettings.current_month_usage >= aiSettings.monthly_usage_limit) {
  return NextResponse.json(
    { error: 'Monthly usage limit exceeded' },
    { status: 429 }
  )
}
```

## 今後の拡張

- [ ] 画像生成対応 (DALL-E, Stable Diffusion)
- [ ] 複数言語対応
- [ ] A/Bテスト機能 (複数パターン生成)
- [ ] 生成履歴保存
- [ ] カスタムプロンプトテンプレート
- [ ] タスク別モデル自動選択
- [ ] 月次使用量自動リセット (Cron)
- [ ] Supabase Vault統合 (API Key暗号化)

## 参考リンク

- [OpenRouter API Documentation](https://openrouter.ai/docs)
- [OpenRouter Models](https://openrouter.ai/models)
- [OpenRouter Pricing](https://openrouter.ai/docs#pricing)
