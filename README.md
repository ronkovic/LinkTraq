# LinkTraq - SNSアフィリエイト管理サービス

> SNSでアフィリエイトリンクを効果的に投稿・管理するためのWEBサービス

---

## 🚀 Quick Start

### プロジェクト初期化 (初回のみ)

プロジェクトを初めてセットアップする場合:

👉 **[PROJECT_INIT.md](./PROJECT_INIT.md) - 詳細な初期化ガイド**

主な手順:
1. Next.js プロジェクト作成
2. ディレクトリ構造構築
3. パッケージインストール
4. 環境変数設定 (.env.local)
5. Supabase セットアップ
6. Cloudflare セットアップ
7. 開発サーバー起動確認

### 開発開始 (初期化完了後)

```bash
# プロジェクトディレクトリで
claude

# セッション内で
/start
```

---

## 📋 Claude Code カスタムコマンド

### `/start` - 開発開始
プランニングファイルを確認してから開発を開始

```bash
/start
```

**実行内容:**
1. DEVELOPMENT_RULES.md 確認
2. PROJECT_PLAN.md 確認
3. 現在のフェーズ把握
4. タスク実行

---

### `/check` - プランニング確認
現在の進捗とプランニング状態を確認

```bash
/check
```

**実行内容:**
- 開発ルール確認
- 全体設計確認
- 未決定事項の確認
- 次のタスク提案

---

### `/implement <機能名>` - 機能実装
設計確認後、特定機能の実装を開始

```bash
/implement X API統合
/implement 商品管理画面
/implement ダッシュボード
```

**実行内容:**
1. プランニングファイル確認
2. 既存設計との整合性チェック
3. 関連設計ファイル確認
4. 実装開始

---

### `/plan <機能名>` - 新機能設計
新機能の設計・プランニング（PROJECT_PLAN.md更新）

```bash
/plan Instagram連携機能
/plan 収益レポート機能
```

**実行内容:**
1. 既存設計確認
2. 新機能設計作成
3. PROJECT_PLAN.md 更新
4. 詳細設計ファイル作成

---

## 📚 プランニングファイル

### 必読ドキュメント

| ファイル | 説明 | 優先度 |
|---------|------|--------|
| **DEVELOPMENT_RULES.md** | 開発ルール (最重要) | ⭐⭐⭐⭐⭐ |
| **PROJECT_PLAN.md** | 全体設計 (Single Source of Truth) | ⭐⭐⭐⭐⭐ |
| **PROJECT_INIT.md** | プロジェクト初期化ガイド | ⭐⭐⭐⭐⭐ |
| **X_API_INTEGRATION.md** | X API詳細設計 | ⭐⭐⭐⭐ |
| **REVIEW_ITEMS.md** | 検討項目リスト | ⭐⭐⭐ |
| **CLAUDE.md** | プロジェクト概要 | ⭐⭐ |

---

## 🎯 開発フロー

```
┌─────────────────────────────────────┐
│ 1. プロジェクトディレクトリで       │
│    claude                           │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ 2. カスタムコマンド実行             │
│    /start    - 開発開始             │
│    /check    - 進捗確認             │
│    /implement - 機能実装            │
│    /plan     - 新機能設計           │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ 3. プランニングファイル自動確認     │
│    - DEVELOPMENT_RULES.md           │
│    - PROJECT_PLAN.md                │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ 4. 設計に従って実装                 │
└─────────────────────────────────────┘
```

---

## 📖 使用例

### 例1: 開発を始める

```bash
$ claude
> /start

# Claude が自動で:
# 1. DEVELOPMENT_RULES.md 読み込み
# 2. PROJECT_PLAN.md 確認
# 3. 現在のフェーズ報告
# 4. タスクを聞いてくる
```

### 例2: X API実装を始める

```bash
$ claude
> /implement X API統合

# Claude が自動で:
# 1. プランニングファイル確認
# 2. X_API_INTEGRATION.md 確認
# 3. 設計に従って実装開始
```

### 例3: 新機能を設計する

```bash
$ claude
> /plan Instagram連携機能

# Claude が自動で:
# 1. 既存設計確認
# 2. Instagram連携の設計作成
# 3. PROJECT_PLAN.md 更新
# 4. 詳細設計ファイル作成
```

### 例4: 進捗確認

```bash
$ claude
> /check

# Claude が自動で:
# 1. 完了した項目を報告
# 2. 未決定の項目を報告
# 3. 次のタスクを提案
```

---

## 🔑 重要なルール

### ⚠️ プランニングファイル優先原則

**すべての実装・検討は、プランニングファイルに基づいて行う**

1. **変更前に必ずプランニングファイルを確認**
2. **変更がある場合は必ずプランニングファイルを先に更新**
3. **実装はプランニングファイルに従う**

詳細: [DEVELOPMENT_RULES.md](./DEVELOPMENT_RULES.md)

---

## 🏗️ プロジェクト構成

```
x-affiliate-demo/
├── .claude/
│   ├── commands/          # カスタムスラッシュコマンド
│   │   ├── start.md       # /start
│   │   ├── check.md       # /check
│   │   ├── implement.md   # /implement
│   │   └── plan.md        # /plan
│   ├── prompts/           # カスタムプロンプト
│   │   ├── continue-planning.md
│   │   └── start-implementation.md
│   └── settings.local.json
├── src/                   # ソースコード (初期化後)
│   ├── app/               # Next.js App Router
│   ├── components/        # React コンポーネント
│   ├── lib/               # ライブラリ・ユーティリティ
│   └── ...
├── workers/               # Cloudflare Workers (初期化後)
├── db/                    # Drizzle ORM (初期化後)
├── DEVELOPMENT_RULES.md   # 開発ルール ⭐⭐⭐⭐⭐
├── PROJECT_PLAN.md        # 全体設計 ⭐⭐⭐⭐⭐
├── PROJECT_INIT.md        # 初期化ガイド ⭐⭐⭐⭐⭐
├── X_API_INTEGRATION.md   # X API詳細設計
├── REVIEW_ITEMS.md        # 検討項目リスト
├── CLAUDE.md              # プロジェクト概要
├── .env.example           # 環境変数テンプレート
├── wrangler.example.toml  # Workers設定テンプレート
└── README.md              # このファイル
```

---

## 🎨 技術スタック

### インフラ
- **Frontend**: Cloudflare Pages
- **Backend**: Cloudflare Workers
- **Database**: Supabase (PostgreSQL)
- **Storage**: Cloudflare R2
- **Domain**: linktraq.com (Cloudflare Registrar)

### フロントエンド
- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Zustand / React Query

### 外部サービス
- **AI**: OpenRouter (DeepSeek V3.1, Gemini, Llama 4)
- **X API**: ユーザーごとのAPI Key (Free プラン推奨)

---

## 💰 コスト見積もり

### サービス側コスト (月額)
- Cloudflare: $0.87-30.87/月
- X API: $0 (ユーザー負担)

### ユーザー側コスト
- X API Free: $0/月 (1,500投稿/月)
- X API Basic: $100/月 (3,000投稿/月)

---

## 📝 開発ステータス

### ✅ 完了
- 要件定義
- 技術スタック選定
- 全体設計 (PROJECT_PLAN.md)
- AI統合計画 (OpenRouter)
- ドメイン決定 (linktraq.com)
- X API戦略決定 (ユーザーごとのAPI Key)
- 環境変数管理方針確定
- コンバージョン追跡設計
- SNS投稿制限バリデーション設計
- 投稿失敗リトライ・通知戦略設計
- **Phase 1プランニング完了**

### 🔄 進行中
- なし (Phase 1実装開始待ち)

### ⏳ 未着手
- Phase 1: プロジェクト初期化 (実装)
- Phase 2以降: 機能実装

### 📋 次のステップ
1. PROJECT_INIT.md に従ってプロジェクト初期化
2. 開発環境セットアップ完了
3. Phase 2: 認証・認可実装開始

---

## 🆘 ヘルプ

### よくあるコマンド

```bash
# 開発開始
/start

# 進捗確認
/check

# 機能実装
/implement <機能名>

# 新機能設計
/plan <機能名>

# プランニング続行
claude -r "プランニング続行"

# 実装開始
claude -r "実装開始"
```

### トラブルシューティング

**Q: プランニングファイルと実装が乖離した**
→ A: プランニングファイルを優先。実装を修正してください。

**Q: 新機能を追加したい**
→ A: `/plan <機能名>` で設計してからPROJECT_PLAN.mdに追記

**Q: 設計変更が必要**
→ A: まずPROJECT_PLAN.mdを更新してから実装

---

## 📄 ライセンス

TBD

---

**最終更新**: 2025-10-02
