-- =============================================
-- 05. posts テーブルのRLSポリシー
-- =============================================
-- ユーザーは自分のアフィリエイトリンクに関連する投稿のみ読み書き可能

-- ポリシー削除 (既存の場合)
DROP POLICY IF EXISTS "Users can view own posts" ON posts;
DROP POLICY IF EXISTS "Users can insert own posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;

-- 自分のアフィリエイトリンクに関連する投稿閲覧
CREATE POLICY "Users can view own posts"
ON posts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM affiliate_links
    JOIN products ON products.id = affiliate_links.product_id
    WHERE affiliate_links.id = posts.affiliate_link_id
    AND products.user_id = auth.uid()
  )
);

-- 自分のアフィリエイトリンクに関連する投稿作成
CREATE POLICY "Users can insert own posts"
ON posts
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM affiliate_links
    JOIN products ON products.id = affiliate_links.product_id
    WHERE affiliate_links.id = posts.affiliate_link_id
    AND products.user_id = auth.uid()
  )
);

-- 自分のアフィリエイトリンクに関連する投稿更新
CREATE POLICY "Users can update own posts"
ON posts
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM affiliate_links
    JOIN products ON products.id = affiliate_links.product_id
    WHERE affiliate_links.id = posts.affiliate_link_id
    AND products.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM affiliate_links
    JOIN products ON products.id = affiliate_links.product_id
    WHERE affiliate_links.id = posts.affiliate_link_id
    AND products.user_id = auth.uid()
  )
);

-- 自分のアフィリエイトリンクに関連する投稿削除
CREATE POLICY "Users can delete own posts"
ON posts
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM affiliate_links
    JOIN products ON products.id = affiliate_links.product_id
    WHERE affiliate_links.id = posts.affiliate_link_id
    AND products.user_id = auth.uid()
  )
);
