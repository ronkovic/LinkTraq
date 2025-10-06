-- =============================================
-- 03. products テーブルのRLSポリシー
-- =============================================
-- ユーザーは自分の商品のみ読み書き可能

-- ポリシー削除 (既存の場合)
DROP POLICY IF EXISTS "Users can view own products" ON products;
DROP POLICY IF EXISTS "Users can insert own products" ON products;
DROP POLICY IF EXISTS "Users can update own products" ON products;
DROP POLICY IF EXISTS "Users can delete own products" ON products;

-- 自分の商品閲覧
CREATE POLICY "Users can view own products"
ON products
FOR SELECT
USING (auth.uid() = user_id);

-- 自分の商品作成
CREATE POLICY "Users can insert own products"
ON products
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 自分の商品更新
CREATE POLICY "Users can update own products"
ON products
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 自分の商品削除
CREATE POLICY "Users can delete own products"
ON products
FOR DELETE
USING (auth.uid() = user_id);
