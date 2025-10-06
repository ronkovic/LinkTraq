# 外部SNSアナリティクス同期

LinkTraqの外部SNSアナリティクス同期機能の設計と実装ドキュメント

## 概要

X (Twitter) APIから投稿のメトリクスデータを定期的に取得し、Supabaseに保存します。

### 取得するメトリクス

- **インプレッション数** (impression_count)
- **いいね数** (like_count)
- **リプライ数** (reply_count)
- **リツイート数** (retweet_count)
- **引用ツイート数** (quote_count)
- **ブックマーク数** (bookmark_count)
- **URLクリック数** (url_link_clicks)

## アーキテクチャ

```
┌─────────────────────────────────────────────────┐
│     Cloudflare Cron Worker                      │
│     analytics-sync.ts                           │
│     (1時間ごと実行)                              │
└──────────────────┬──────────────────────────────┘
                   │
                   ↓ Get published posts
         ┌─────────────────────┐
         │   Supabase          │
         │  posts              │
         └──────────┬──────────┘
                    │
                    ↓ Get SNS integration
         ┌──────────────────────────┐
         │   Supabase              │
         │  sns_integrations       │
         └──────────┬───────────────┘
                    │
                    ↓ Fetch metrics
         ┌──────────────────────────┐
         │   X API                  │
         │  GET /tweets/:id         │
         └──────────┬───────────────┘
                    │
                    ↓ Save/update
         ┌──────────────────────────┐
         │   Supabase              │
         │  post_analytics         │
         └──────────────────────────┘
```

## データベーススキーマ

### post_analytics テーブル

```typescript
{
  id: uuid
  post_id: uuid (FK to posts)
  impressions: integer        // インプレッション数
  likes: integer              // いいね数
  replies: integer            // リプライ数
  retweets: integer           // リツイート数
  quotes: integer             // 引用ツイート数
  bookmarks: integer          // ブックマーク数
  link_clicks: integer        // URLクリック数
  synced_at: timestamp        // 最終同期時刻
  created_at: timestamp
}
```

## Cloudflare Cron Worker

### analytics-sync.ts

**実行頻度:** 1時間ごと

**処理フロー:**

1. **投稿一覧取得**
   - `posts` テーブルから過去7日間の投稿済み投稿を取得
   - 条件: `status = 'published'` AND `external_post_id IS NOT NULL`

2. **各投稿について:**
   - SNS連携情報取得 (`sns_integrations` テーブル)
   - X APIからメトリクス取得
   - `post_analytics` テーブルに保存または更新

3. **エラーハンドリング**
   - 個別の投稿でエラーが発生しても続行
   - エラーログ記録

**環境変数:**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## X API連携

### エンドポイント

```
GET https://api.twitter.com/2/tweets/:id
```

### クエリパラメータ

```
tweet.fields=public_metrics,non_public_metrics,organic_metrics
```

### レスポンス例

```json
{
  "data": {
    "id": "1234567890",
    "text": "投稿内容",
    "public_metrics": {
      "impression_count": 1000,
      "like_count": 50,
      "reply_count": 5,
      "retweet_count": 10,
      "quote_count": 2,
      "bookmark_count": 8
    },
    "organic_metrics": {
      "impression_count": 950,
      "url_link_clicks": 25
    }
  }
}
```

### メトリクスの種類

#### public_metrics
すべてのツイートで利用可能

- `impression_count`: インプレッション数
- `like_count`: いいね数
- `reply_count`: リプライ数
- `retweet_count`: リツイート数
- `quote_count`: 引用ツイート数
- `bookmark_count`: ブックマーク数

#### organic_metrics
自分のツイートのみ利用可能

- `impression_count`: オーガニックインプレッション数
- `url_link_clicks`: URLクリック数
- `user_profile_clicks`: プロフィールクリック数

## アクセストークン管理

### トークンリフレッシュ

X APIのアクセストークンは有効期限があります。

```typescript
async function refreshAccessToken(
  refreshToken: string
): Promise<{ access_token: string; expires_in: number }> {
  const response = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: process.env.X_CLIENT_ID!,
    }),
  })

  return await response.json()
}
```

### トークン有効期限チェック

```typescript
async function getSNSIntegration(userId: string, platform: string, env: Env) {
  const integration = await fetchIntegration(userId, platform, env)

  // トークン有効期限チェック
  if (integration.expires_at && new Date(integration.expires_at) < new Date()) {
    // リフレッシュ
    const newTokens = await refreshAccessToken(integration.refresh_token)

    // 更新
    await updateIntegration(userId, platform, newTokens, env)

    integration.access_token = newTokens.access_token
  }

  return integration
}
```

## エラーハンドリング

### X APIエラー

| エラーコード | 説明 | 対処 |
|---|---|---|
| 401 | 認証エラー | トークンをリフレッシュ |
| 403 | アクセス拒否 | SNS連携を再認証 |
| 404 | ツイートが見つからない | スキップ |
| 429 | レート制限 | 待機してリトライ |

### レート制限

X APIにはレート制限があります。

```typescript
async function fetchXTweetMetrics(tweetId: string, accessToken: string) {
  try {
    const response = await fetch(/* ... */)

    if (response.status === 429) {
      const resetTime = response.headers.get('x-rate-limit-reset')
      console.log(`Rate limited. Reset at: ${new Date(parseInt(resetTime!) * 1000)}`)

      // リトライキューに追加
      // または次回のCron実行を待つ
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('API error:', error)
    throw error
  }
}
```

## wrangler.toml 設定

```toml
# アナリティクス同期用Worker
[[workers]]
name = "linktraq-analytics-sync"
main = "workers/cron/analytics-sync.ts"
compatibility_date = "2024-01-01"

[triggers]
# 1時間ごとに実行
crons = ["0 * * * *"]

[vars]
ENVIRONMENT = "production"
```

## デプロイ

```bash
# シークレット設定
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_ROLE_KEY

# デプロイ
wrangler deploy --config wrangler.analytics.toml
```

## モニタリング

### Cloudflare Dashboard

- Cron実行履歴
- エラーログ
- 実行時間

### Supabase Dashboard

- `post_analytics` テーブルの `synced_at` 確認
- 同期されていない投稿の確認

### ログ確認

```bash
wrangler tail linktraq-analytics-sync
```

## パフォーマンス最適化

### バッチ処理

大量の投稿がある場合、バッチで処理します。

```typescript
const BATCH_SIZE = 50

for (let i = 0; i < posts.length; i += BATCH_SIZE) {
  const batch = posts.slice(i, i + BATCH_SIZE)

  await Promise.allSettled(
    batch.map(post => syncAnalytics(post, env))
  )

  // レート制限回避のため少し待機
  if (i + BATCH_SIZE < posts.length) {
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
}
```

### キャッシュ

SNS連携情報をメモリキャッシュして重複取得を避けます。

```typescript
const integrationCache = new Map<string, SNSIntegration>()

async function getSNSIntegration(userId: string, platform: string, env: Env) {
  const cacheKey = `${userId}:${platform}`

  if (integrationCache.has(cacheKey)) {
    return integrationCache.get(cacheKey)!
  }

  const integration = await fetchIntegration(userId, platform, env)
  integrationCache.set(cacheKey, integration)

  return integration
}
```

## 制限事項

1. **X API制限**
   - レート制限: 300リクエスト/15分
   - 過去7日間の投稿のみ取得可能

2. **メトリクスの遅延**
   - リアルタイムではない
   - 1時間ごとの更新

3. **削除されたツイート**
   - 取得不可 (404エラー)
   - スキップして続行

## 今後の拡張

- [ ] Instagram アナリティクス対応
- [ ] Facebook アナリティクス対応
- [ ] リアルタイム同期 (Webhook)
- [ ] アナリティクスダッシュボード
- [ ] トレンド分析
- [ ] パフォーマンスレポート自動生成
- [ ] アラート機能 (急激な変化検知)

## 参考リンク

- [X API Documentation - Metrics](https://developer.twitter.com/en/docs/twitter-api/metrics)
- [X API Rate Limits](https://developer.twitter.com/en/docs/twitter-api/rate-limits)
- [OAuth 2.0 Token Refresh](https://developer.twitter.com/en/docs/authentication/oauth-2-0/user-access-token)
