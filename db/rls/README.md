# Row Level Security (RLS) ポリシー

このディレクトリには、Supabaseのテーブルに対するRow Level Security (RLS) ポリシーのSQLファイルが含まれています。

## 実行方法

### Supabase Dashboardで実行
1. https://supabase.com/dashboard/project/YOUR_PROJECT_ID/editor/sql にアクセス
2. 各SQLファイルの内容をコピー＆ペースト
3. 実行順序に従って実行

### Supabase CLIで実行
```bash
supabase db execute --file db/rls/01-enable-rls.sql
supabase db execute --file db/rls/02-users-policies.sql
supabase db execute --file db/rls/03-products-policies.sql
# ... 他のファイルも同様に実行
```

## 実行順序

1. `01-enable-rls.sql` - 全テーブルのRLS有効化
2. `02-users-policies.sql` - usersテーブルのポリシー
3. `03-products-policies.sql` - productsテーブルのポリシー
4. `04-affiliate-links-policies.sql` - affiliate_linksテーブルのポリシー
5. `05-posts-policies.sql` - postsテーブルのポリシー
6. `06-analytics-policies.sql` - analytics関連テーブルのポリシー
7. `07-settings-policies.sql` - 設定関連テーブルのポリシー

## セキュリティ原則

- **自分のデータのみアクセス可能**: 各ユーザーは自分が作成したデータのみ読み書き可能
- **認証必須**: 未認証ユーザーはデータにアクセス不可
- **最小権限の原則**: 必要最小限の権限のみ付与
