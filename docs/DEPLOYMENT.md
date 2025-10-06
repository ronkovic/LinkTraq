# デプロイガイド

LinkTraqのデプロイ手順

## 前提条件

- Node.js 18以上
- npm または pnpm
- Cloudflare アカウント
- Supabase アカウント
- Wrangler CLI

## 1. Supabaseセットアップ

### 1.1 プロジェクト作成

1. [Supabase Dashboard](https://supabase.com/dashboard) にアクセス
2. "New project" をクリック
3. プロジェクト名、データベースパスワード、リージョンを設定

### 1.2 データベースマイグレーション実行

#### 方法1: Supabase Dashboard (推奨)

1. `https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new` にアクセス
2. `db/migrations/0000_numerous_spot.sql` の内容をコピー＆ペースト
3. "Run" をクリック

#### 方法2: ローカルから実行

```bash
# DATABASE_URL設定
export DATABASE_URL="postgresql://postgres:PASSWORD@HOST:5432/postgres"

# マイグレーション実行
npm run db:migrate
```

### 1.3 RLS (Row Level Security) 設定

`db/rls/` ディレクトリ内のSQLファイルを順番に実行:

1. `01-enable-rls.sql` - 全テーブルのRLS有効化
2. `02-users-policies.sql` - usersテーブルのポリシー
3. `03-products-policies.sql` - productsテーブルのポリシー
4. `04-affiliate-links-policies.sql` - affiliate_linksテーブルのポリシー
5. `05-posts-policies.sql` - postsテーブルのポリシー
6. `06-analytics-policies.sql` - analytics関連テーブルのポリシー
7. `07-settings-policies.sql` - 設定関連テーブルのポリシー

実行方法:
```bash
supabase db execute --file db/rls/01-enable-rls.sql
supabase db execute --file db/rls/02-users-policies.sql
# ... (以下同様)
```

### 1.4 環境変数取得

Supabase Dashboardから以下を取得:

- **Project URL**: `https://YOUR_PROJECT_ID.supabase.co`
- **Anon Key**: Settings > API > Project API keys > anon public
- **Service Role Key**: Settings > API > Project API keys > service_role (秘密)

## 2. Next.jsアプリケーションデプロイ (Cloudflare Pages)

### 2.1 環境変数設定

`.env.local` を作成 (`.env.example` を参考):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenRouter
OPENROUTER_API_KEY=sk-or-v1-your-api-key
DEFAULT_AI_MODEL=deepseek/deepseek-v3.1:free

# X (Twitter) API (開発用)
X_API_KEY=your-x-api-key
X_API_SECRET=your-x-api-secret

# アプリケーション
NEXT_PUBLIC_APP_URL=https://linktraq.com
NEXT_PUBLIC_SHORT_URL_DOMAIN=https://go.linktraq.com
```

### 2.2 ビルド確認

```bash
npm run build
```

### 2.3 Cloudflare Pages デプロイ

#### 方法1: GitHub連携 (推奨)

1. GitHubリポジトリにプッシュ
2. Cloudflare Dashboard > Pages > Create a project
3. "Connect to Git" を選択
4. リポジトリを選択
5. ビルド設定:
   - **Build command**: `npm run build`
   - **Build output directory**: `.next`
   - **Root directory**: `/`
6. 環境変数を設定 (上記参照)
7. "Save and Deploy" をクリック

#### 方法2: Wrangler CLI

```bash
# ビルド
npm run build

# デプロイ
npx wrangler pages deploy .next --project-name=linktraq
```

### 2.4 カスタムドメイン設定

1. Cloudflare Dashboard > Pages > linktraq > Custom domains
2. "Set up a custom domain" をクリック
3. ドメイン名を入力 (例: `app.linktraq.com`)
4. DNS設定を確認

## 3. Cloudflare Workers デプロイ

### 3.1 Wrangler設定

`wrangler.toml` を編集:

```toml
account_id = "YOUR_CLOUDFLARE_ACCOUNT_ID"
```

Account IDの取得:
```bash
wrangler whoami
```

### 3.2 Queueの作成

```bash
# 投稿スケジューリング用Queue
wrangler queues create post-scheduling-queue

# Dead Letter Queue
wrangler queues create post-dlq
```

### 3.3 シークレット設定

```bash
# Supabase
wrangler secret put SUPABASE_URL
# 入力: https://YOUR_PROJECT_ID.supabase.co

wrangler secret put SUPABASE_SERVICE_ROLE_KEY
# 入力: your-service-role-key
```

### 3.4 Cron Worker デプロイ (投稿スケジューラー)

```bash
wrangler deploy --config wrangler.toml
```

確認:
```bash
wrangler tail linktraq-post-scheduler
```

### 3.5 Queue Consumer Worker デプロイ (投稿実行)

`wrangler.queue.toml` を作成:

```toml
name = "linktraq-post-publisher"
main = "workers/queue/post-publisher.ts"
compatibility_date = "2024-01-01"
account_id = "YOUR_CLOUDFLARE_ACCOUNT_ID"

[[queues.consumers]]
queue = "post-scheduling-queue"
max_batch_size = 10
max_batch_timeout = 30
max_retries = 3
dead_letter_queue = "post-dlq"

[[queues.producers]]
binding = "POST_DLQ"
queue = "post-dlq"
```

デプロイ:
```bash
wrangler deploy --config wrangler.queue.toml
```

### 3.6 Analytics Sync Worker デプロイ

`wrangler.analytics.toml` を作成:

```toml
name = "linktraq-analytics-sync"
main = "workers/cron/analytics-sync.ts"
compatibility_date = "2024-01-01"
account_id = "YOUR_CLOUDFLARE_ACCOUNT_ID"

[triggers]
crons = ["0 * * * *"]  # 1時間ごと
```

デプロイ:
```bash
wrangler deploy --config wrangler.analytics.toml
```

## 4. 動作確認

### 4.1 Next.jsアプリケーション

1. `https://your-domain.com` にアクセス
2. サインアップ/ログイン動作確認
3. 商品作成、アフィリエイトリンク作成を確認

### 4.2 Cron Worker

```bash
# ログ確認
wrangler tail linktraq-post-scheduler

# 手動トリガー (テスト用)
curl -X POST https://linktraq-post-scheduler.YOUR_SUBDOMAIN.workers.dev/__scheduled?cron=*+*+*+*+*
```

### 4.3 Queue Consumer Worker

```bash
# ログ確認
wrangler tail linktraq-post-publisher

# Queueメトリクス確認
wrangler queues list
```

### 4.4 Analytics Sync Worker

```bash
# ログ確認
wrangler tail linktraq-analytics-sync
```

## 5. 監視・ログ

### 5.1 Cloudflare Dashboard

- **Workers & Pages** > **linktraq** > **Logs**
- **Queues** > メトリクス確認
- **Analytics** > リクエスト数、エラー率

### 5.2 Supabase Dashboard

- **Database** > テーブルデータ確認
- **Logs** > リアルタイムログ
- **API** > リクエストログ

## 6. トラブルシューティング

### ビルドエラー

```bash
# 型チェック
npm run type-check

# ビルド
npm run build
```

### Worker デプロイエラー

```bash
# Wrangler認証確認
wrangler whoami

# 再ログイン
wrangler login

# デプロイ (詳細ログ)
wrangler deploy --config wrangler.toml --verbose
```

### Queueが動作しない

1. Queueが作成されているか確認
   ```bash
   wrangler queues list
   ```

2. Queue Consumer Workerがデプロイされているか確認
   ```bash
   wrangler deployments list
   ```

3. シークレットが設定されているか確認
   ```bash
   wrangler secret list
   ```

### マイグレーションエラー

DATABASE_URLのパスワードをURLエンコード:

```bash
# 例: パスワード "Pass@123" → "Pass%40123"
DATABASE_URL="postgresql://postgres:Pass%40123@..."
```

## 7. 本番環境のセキュリティ

### 7.1 環境変数

- `.env.local` は `.gitignore` に含める
- シークレットはCloudflare Dashboard または `wrangler secret` で管理
- 本番環境のAPIキーは開発環境と分ける

### 7.2 RLS (Row Level Security)

- すべてのテーブルでRLSを有効化
- 最小権限の原則に従う
- 定期的にポリシーをレビュー

### 7.3 API Key管理

- ユーザー独自のAPI Keyは暗号化 (将来: Supabase Vault)
- Service Role Keyは絶対に公開しない
- 定期的にローテーション

## 8. スケーリング

### 8.1 Cloudflare Workers

- 無料プラン: 100,000リクエスト/日
- 有料プラン ($5/月): 無制限リクエスト
- Durable Objects: 将来のリアルタイム機能用

### 8.2 Supabase

- 無料プラン: 500MB データベース
- Pro プラン ($25/月): 8GB データベース
- 自動バックアップ、ポイントインタイムリカバリ

### 8.3 パフォーマンス最適化

- Cloudflare CDN: 静的アセット配信
- Cloudflare KV: キャッシュ用 (将来実装)
- Database Indexing: 頻繁なクエリを最適化

## 参考リンク

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Cloudflare Queues Documentation](https://developers.cloudflare.com/queues/)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
