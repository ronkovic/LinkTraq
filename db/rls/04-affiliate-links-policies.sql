-- =============================================
-- 04. affiliate_links テーブルのRLSポリシー
-- =============================================
-- ユーザーは自分の商品に関連するアフィリエイトリンクのみ読み書き可能

-- ポリシー削除 (既存の場合)
DROP POLICY IF EXISTS "Users can view own affiliate links" ON affiliate_links;
DROP POLICY IF EXISTS "Users can insert own affiliate links" ON affiliate_links;
DROP POLICY IF EXISTS "Users can update own affiliate links" ON affiliate_links;
DROP POLICY IF EXISTS "Users can delete own affiliate links" ON affiliate_links;

-- 自分の商品に関連するアフィリエイトリンク閲覧
CREATE POLICY "Users can view own affiliate links"
ON affiliate_links
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM products
    WHERE products.id = affiliate_links.product_id
    AND products.user_id = auth.uid()
  )
);

-- 自分の商品に関連するアフィリエイトリンク作成
CREATE POLICY "Users can insert own affiliate links"
ON affiliate_links
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM products
    WHERE products.id = affiliate_links.product_id
    AND products.user_id = auth.uid()
  )
);

-- 自分の商品に関連するアフィリエイトリンク更新
CREATE POLICY "Users can update own affiliate links"
ON affiliate_links
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM products
    WHERE products.id = affiliate_links.product_id
    AND products.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM products
    WHERE products.id = affiliate_links.product_id
    AND products.user_id = auth.uid()
  )
);

-- 自分の商品に関連するアフィリエイトリンク削除
CREATE POLICY "Users can delete own affiliate links"
ON affiliate_links
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM products
    WHERE products.id = affiliate_links.product_id
    AND products.user_id = auth.uid()
  )
);
