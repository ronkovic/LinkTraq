# 投稿スケジューリング機能

LinkTraqの投稿スケジューリングシステムの設計と実装ドキュメント

## アーキテクチャ

### コンポーネント構成

```
┌─────────────────────────────────────────────────┐
│          Next.js API Routes                     │
│  /api/schedules (CRUD for schedules)            │
└──────────────────┬──────────────────────────────┘
                   │
                   ↓ Store schedule
         ┌─────────────────────┐
         │   Supabase          │
         │  post_schedules     │
         └──────────┬──────────┘
                    │
                    ↓ Cron check (every minute)
         ┌──────────────────────────┐
         │ Cloudflare Cron Worker   │
         │  post-scheduler.ts       │
         └──────────┬───────────────┘
                    │
                    ↓ Send to queue
         ┌──────────────────────────┐
         │ Cloudflare Queue         │
         │  POST_QUEUE              │
         └──────────┬───────────────┘
                    │
                    ↓ Process batch
         ┌──────────────────────────┐
         │ Queue Consumer Worker    │
         │  post-publisher.ts       │
         └──────────┬───────────────┘
                    │
                    ↓ Publish
         ┌──────────────────────────┐
         │   SNS APIs               │
         │  (X, Instagram, etc)     │
         └──────────────────────────┘
```

## データベーススキーマ

### post_schedules テーブル

```typescript
{
  id: uuid
  post_id: uuid (FK to posts)
  scheduled_at: timestamp      // スケジュール実行時刻
  sns_platform: enum('x', 'instagram', 'facebook')
  published_at: timestamp      // 実際の投稿時刻
  status: enum('pending', 'processing', 'published', 'failed')
  retry_count: integer         // リトライ回数
  last_error: text            // 最後のエラーメッセージ
  last_retry_at: timestamp    // 最後のリトライ時刻
  next_retry_at: timestamp    // 次のリトライ時刻
}
```

### post_failures テーブル

```typescript
{
  id: uuid
  post_schedule_id: uuid (FK to post_schedules)
  user_id: uuid (FK to users)
  error_type: text            // 'api_error', 'network_error', 'auth_error', 'validation_error'
  error_code: text            // HTTP status code
  error_message: text         // エラーメッセージ
  retry_count: integer        // 失敗時のリトライ回数
  is_final_failure: text      // 'true' or 'false'
  sns_platform: text
  occurred_at: timestamp
  created_at: timestamp
}
```

## API エンドポイント

### GET /api/schedules

スケジュール一覧取得

**クエリパラメータ:**
- `status` (optional): pending, processing, published, failed
- `platform` (optional): x, instagram, facebook

**レスポンス:**
```json
{
  "schedules": [
    {
      "id": "uuid",
      "post_id": "uuid",
      "scheduled_at": "2025-10-03T10:00:00Z",
      "sns_platform": "x",
      "status": "pending",
      "retry_count": 0,
      "posts": {
        "id": "uuid",
        "content": "投稿内容",
        "image_urls": ["https://..."],
        "hashtags": ["tag1", "tag2"]
      }
    }
  ]
}
```

### POST /api/schedules

スケジュール作成

**リクエストボディ:**
```json
{
  "post_id": "uuid",
  "scheduled_at": "2025-10-03T10:00:00Z",
  "sns_platform": "x"
}
```

**レスポンス:**
```json
{
  "schedule": {
    "id": "uuid",
    "post_id": "uuid",
    "scheduled_at": "2025-10-03T10:00:00Z",
    "sns_platform": "x",
    "status": "pending",
    "retry_count": 0
  }
}
```

### GET /api/schedules/[id]

スケジュール詳細取得

### PATCH /api/schedules/[id]

スケジュール更新

**リクエストボディ:**
```json
{
  "scheduled_at": "2025-10-03T11:00:00Z",
  "sns_platform": "instagram",
  "status": "pending"
}
```

### DELETE /api/schedules/[id]

スケジュール削除

## Cloudflare Workers

### Cron Worker (post-scheduler.ts)

**実行頻度:** 毎分

**処理内容:**
1. Supabaseから実行すべきスケジュールを取得
   - `status = 'pending'`
   - `scheduled_at <= 現在時刻` OR `next_retry_at <= 現在時刻`
2. 取得したスケジュールをPOST_QUEUEに送信

**環境変数:**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `POST_QUEUE` (Queue binding)

### Queue Consumer Worker (post-publisher.ts)

**トリガー:** POST_QUEUE にメッセージが追加された時

**処理内容:**
1. スケジュール情報をSupabaseから取得
2. ステータスを `processing` に更新
3. SNS連携情報を取得
4. 投稿内容を準備 (本文 + ハッシュタグ + アフィリエイトリンク)
5. SNS APIに投稿
6. 成功時: ステータスを `published` に更新
7. 失敗時: リトライまたはDLQに送信

**環境変数:**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `POST_DLQ` (Queue binding)
- `SHORT_URL_DOMAIN` (短縮URLドメイン)

## リトライ戦略

### リトライ設定

```typescript
const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAYS: [5 * 60, 15 * 60, 60 * 60], // 5分, 15分, 1時間 (秒)
}
```

### リトライフロー

1. **1回目の失敗**
   - `retry_count = 1`
   - `next_retry_at = 現在時刻 + 5分`
   - `status = 'pending'`
   - post_failuresテーブルに記録

2. **2回目の失敗**
   - `retry_count = 2`
   - `next_retry_at = 現在時刻 + 15分`
   - `status = 'pending'`
   - post_failuresテーブルに記録

3. **3回目の失敗**
   - `retry_count = 3`
   - `next_retry_at = 現在時刻 + 1時間`
   - `status = 'pending'`
   - post_failuresテーブルに記録

4. **4回目の失敗 (最終)**
   - `status = 'failed'`
   - `is_final_failure = 'true'`
   - POST_DLQ に送信
   - post_failuresテーブルに記録

## エラーハンドリング

### エラータイプ

- `auth_error`: 認証エラー (401, 403)
- `validation_error`: バリデーションエラー (400)
- `network_error`: ネットワークエラー
- `api_error`: その他のAPIエラー

### DLQ (Dead Letter Queue)

最終的に失敗した投稿は `post-dlq` に送信されます。

**DLQの用途:**
- 手動での再送
- エラー分析
- アラート通知

## デプロイ

### 1. Cloudflare Queuesの作成

```bash
# POST_QUEUE
wrangler queues create post-scheduling-queue

# POST_DLQ
wrangler queues create post-dlq
```

### 2. シークレット設定

```bash
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

### 3. デプロイ

```bash
# Cron Worker
wrangler deploy --config wrangler.toml

# Queue Consumer Worker
wrangler deploy --config wrangler.queue.toml
```

## モニタリング

### Cloudflare Dashboard

- Queue のメトリクス (メッセージ数、処理速度)
- Cron の実行履歴
- Worker のログ
- エラー率

### Supabase Dashboard

- `post_schedules` テーブルのステータス分布
- `post_failures` テーブルのエラー分析

## テスト

### ローカルテスト

```bash
# Cron Worker
wrangler dev workers/cron/post-scheduler.ts

# Queue Consumer Worker
wrangler dev workers/queue/post-publisher.ts
```

### 手動トリガー

```bash
# Cronを手動実行
curl -X POST https://linktraq-post-scheduler.your-subdomain.workers.dev/__scheduled?cron=*+*+*+*+*
```

## 注意事項

1. **タイムゾーン**: すべての時刻はUTCで保存
2. **Cron実行頻度**: 毎分実行のため、コスト注意
3. **Queue制限**: Cloudflare Queuesの制限を確認
4. **リトライ間隔**: SNS APIのレート制限を考慮
5. **DLQの監視**: 定期的にDLQをチェック

## 今後の拡張

- [ ] Instagram投稿対応
- [ ] Facebook投稿対応
- [ ] 画像アップロード対応
- [ ] スレッド投稿対応 (X)
- [ ] スケジュール一括管理UI
- [ ] DLQ自動再送機能
- [ ] 通知機能 (投稿成功/失敗)
