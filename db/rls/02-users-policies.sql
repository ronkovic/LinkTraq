-- =============================================
-- 02. users テーブルのRLSポリシー
-- =============================================
-- ユーザーは自分のデータのみ読み書き可能

-- ポリシー削除 (既存の場合)
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- 自分のプロフィール閲覧
CREATE POLICY "Users can view own profile"
ON users
FOR SELECT
USING (auth.uid() = id);

-- 自分のプロフィール更新
CREATE POLICY "Users can update own profile"
ON users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 自分のプロフィール作成 (初回サインアップ時)
CREATE POLICY "Users can insert own profile"
ON users
FOR INSERT
WITH CHECK (auth.uid() = id);

-- 注: DELETE ポリシーは意図的に設定しない (ユーザー削除はSupabase Auth経由)
