# 環境変数セットアップガイド

このドキュメントは、LinkTraqプロジェクトの環境変数を設定する手順を説明します。

---

## 📋 前提条件

以下のアカウント・プロジェクトを事前に作成してください:

1. ✅ [Supabase](https://supabase.com) プロジェクト作成
2. ✅ [Cloudflare](https://cloudflare.com) アカウント作成
3. ✅ [OpenRouter](https://openrouter.ai) アカウント作成 (APIキー取得)
4. ✅ [X Developer Platform](https://developer.x.com) アカウント作成 (開発・テスト用)

---

## 🚀 開発環境のセットアップ

### Step 1: `.env.local` ファイルの作成

```bash
# プロジェクトルートで実行
cp .env.example .env.local
```

### Step 2: Supabase 設定

1. [Supabase Dashboard](https://app.supabase.com) にアクセス
2. プロジェクトを選択
3. **Settings** → **API** から以下を取得:

```bash
# .env.local に追記
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **注意**: `SUPABASE_SERVICE_ROLE_KEY` はサーバーサイド専用。絶対に公開しない。

### Step 3: Cloudflare R2 設定

1. Cloudflare Dashboard → **R2** → **Create bucket**
2. バケット名: `linktraq-images`
3. **Manage R2 API Tokens** → **Create API Token**
4. 権限: Read & Write
5. 以下を `.env.local` に追記:

```bash
CLOUDFLARE_ACCOUNT_ID=your-account-id
R2_BUCKET_NAME=linktraq-images
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
```

### Step 4: OpenRouter (AI) 設定

1. [OpenRouter Keys](https://openrouter.ai/keys) にアクセス
2. **Create Key** をクリック
3. APIキーをコピー
4. `.env.local` に追記:

```bash
OPENROUTER_API_KEY=sk-or-v1-your-api-key-here
DEFAULT_AI_MODEL=deepseek/deepseek-v3.1:free
```

### Step 5: X API 設定 (開発・テスト用)

⚠️ **注意**: 本番環境ではユーザーが各自のAPI Keyを登録します。
これは開発・テスト用の設定です。

1. [X Developer Portal](https://developer.x.com) にアクセス
2. プロジェクト作成 → アプリ作成
3. **Keys and tokens** から以下を取得:
   - API Key
   - API Key Secret
   - Bearer Token

4. `.env.local` に追記:

```bash
X_API_KEY=your-x-api-key
X_API_SECRET=your-x-api-secret
X_BEARER_TOKEN=your-x-bearer-token
```

### Step 6: その他の設定

```bash
# アプリケーションURL (開発環境)
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SHORT_URL_DOMAIN=http://localhost:8787

# JWT Secret (ランダムな文字列を生成)
JWT_SECRET=$(openssl rand -base64 32)

# 環境
NODE_ENV=development
LOG_LEVEL=debug
```

---

## 🔧 Cloudflare Workers のセットアップ

### Step 1: `wrangler.toml` の作成

```bash
cp wrangler.example.toml wrangler.toml
```

### Step 2: アカウントID の設定

`wrangler.toml` を編集:

```toml
account_id = "your-cloudflare-account-id"
```

アカウントIDの確認方法:
1. Cloudflare Dashboard → 右側のサイドバーに表示
2. または、`wrangler whoami` コマンドで確認

### Step 3: Secrets の設定

Cloudflare Workers で使用するシークレットを設定:

```bash
# OpenRouter API Key
wrangler secret put OPENROUTER_API_KEY
# → プロンプトが表示されたら、APIキーを貼り付け

# Supabase Service Role Key
wrangler secret put SUPABASE_SERVICE_ROLE_KEY

# R2 Access Keys
wrangler secret put R2_ACCESS_KEY_ID
wrangler secret put R2_SECRET_ACCESS_KEY

# JWT Secret
wrangler secret put JWT_SECRET
```

### Step 4: 環境別の設定

開発環境用のシークレット設定:

```bash
wrangler secret put OPENROUTER_API_KEY --env development
wrangler secret put SUPABASE_SERVICE_ROLE_KEY --env development
```

---

## 🌐 本番環境のセットアップ

### GitHub Actions Secrets

本番デプロイ用にGitHub Secrets を設定:

1. GitHub リポジトリ → **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret** をクリック
3. 以下のシークレットを追加:

| Name | Value |
|------|-------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token (Workers deploy権限) |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare アカウントID |
| `SUPABASE_URL` | Supabase プロジェクトURL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key |
| `OPENROUTER_API_KEY` | OpenRouter API Key |
| `R2_ACCESS_KEY_ID` | R2 Access Key ID |
| `R2_SECRET_ACCESS_KEY` | R2 Secret Access Key |
| `JWT_SECRET` | JWT Secret |

### Cloudflare Pages 環境変数

1. Cloudflare Dashboard → **Pages** → プロジェクト選択
2. **Settings** → **Environment variables**
3. 以下を追加:

| Variable | Value | Production / Preview |
|----------|-------|---------------------|
| `NEXT_PUBLIC_APP_URL` | `https://app.linktraq.com` | Production |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Both |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Both |
| `OPENROUTER_API_KEY` | `sk-or-v1-...` | Production (Encrypted) |

---

## ✅ 確認方法

### 開発環境の確認

```bash
# 環境変数が読み込まれているか確認
npm run dev

# 以下のエンドポイントで確認 (実装後)
curl http://localhost:3000/api/health
```

### Cloudflare Workers の確認

```bash
# ローカルでWorkers を起動
wrangler dev

# 本番環境にデプロイ
wrangler deploy
```

---

## 🔒 セキュリティチェックリスト

開発開始前に以下を確認:

- [ ] `.env.local` が `.gitignore` に含まれている
- [ ] `wrangler.toml` が `.gitignore` に含まれている
- [ ] APIキー・シークレットをGitにコミットしていない
- [ ] `NEXT_PUBLIC_*` 以外の環境変数をクライアント側で使用していない
- [ ] Supabase Service Role Key をサーバーサイドでのみ使用
- [ ] OpenRouter API Key をWorkers経由でのみ使用
- [ ] 本番環境のシークレットをGitHub Secretsに保存済み

---

## 🆘 トラブルシューティング

### Q: 環境変数が反映されない

**Next.js**:
- 開発サーバーを再起動 (`npm run dev` を停止して再実行)
- `NEXT_PUBLIC_*` 変数はビルド時に埋め込まれるため、変更後は再ビルド必要

**Cloudflare Workers**:
- `wrangler dev` を再起動
- シークレットの変更は `wrangler secret put` で再設定

### Q: Supabase に接続できない

1. Supabase プロジェクトが起動しているか確認
2. `.env.local` のURL・キーが正しいか確認
3. ファイアウォール・VPNの影響を確認

### Q: R2 にアクセスできない

1. バケット名が正しいか確認
2. API Token の権限を確認 (Read & Write)
3. Account ID が正しいか確認

### Q: OpenRouter API が動作しない

1. APIキーが有効か確認 (https://openrouter.ai/keys)
2. クレジット残高を確認 (無料モデル使用時は不要)
3. レート制限に達していないか確認

---

## 📚 関連ドキュメント

- [.env.example](./.env.example) - 環境変数テンプレート
- [wrangler.example.toml](./wrangler.example.toml) - Workers設定テンプレート
- [PROJECT_PLAN.md](./PROJECT_PLAN.md) - プロジェクト全体設計
- [DEVELOPMENT_RULES.md](./DEVELOPMENT_RULES.md) - 開発ルール

---

**最終更新**: 2025-10-03
