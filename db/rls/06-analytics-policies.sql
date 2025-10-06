-- =============================================
-- 06. analytics関連テーブルのRLSポリシー
-- =============================================
-- conversions, link_clicks, post_analytics テーブル
-- ユーザーは自分のデータに関連するアナリティクスのみ閲覧可能

-- =============================================
-- conversions テーブル
-- =============================================

-- ポリシー削除 (既存の場合)
DROP POLICY IF EXISTS "Users can view own conversions" ON conversions;
DROP POLICY IF EXISTS "Users can insert conversions" ON conversions;

-- 自分のアフィリエイトリンクに関連するコンバージョン閲覧
CREATE POLICY "Users can view own conversions"
ON conversions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM affiliate_links
    JOIN products ON products.id = affiliate_links.product_id
    WHERE affiliate_links.id = conversions.affiliate_link_id
    AND products.user_id = auth.uid()
  )
);

-- コンバージョン作成 (Cloudflare Workers経由で作成されるため、認証不要)
-- 注: このポリシーはサービスロールキーで実行されることを想定
CREATE POLICY "Users can insert conversions"
ON conversions
FOR INSERT
WITH CHECK (true);

-- 注: UPDATE/DELETE ポリシーは意図的に設定しない (コンバージョンは作成後変更不可)

-- =============================================
-- link_clicks テーブル
-- =============================================

-- ポリシー削除 (既存の場合)
DROP POLICY IF EXISTS "Users can view own link clicks" ON link_clicks;
DROP POLICY IF EXISTS "Users can insert link clicks" ON link_clicks;

-- 自分のアフィリエイトリンクに関連するクリック閲覧
CREATE POLICY "Users can view own link clicks"
ON link_clicks
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM affiliate_links
    JOIN products ON products.id = affiliate_links.product_id
    WHERE affiliate_links.id = link_clicks.affiliate_link_id
    AND products.user_id = auth.uid()
  )
);

-- クリック作成 (Cloudflare Workers経由で作成されるため、認証不要)
CREATE POLICY "Users can insert link clicks"
ON link_clicks
FOR INSERT
WITH CHECK (true);

-- 注: UPDATE/DELETE ポリシーは意図的に設定しない (クリックは作成後変更不可)

-- =============================================
-- post_analytics テーブル
-- =============================================

-- ポリシー削除 (既存の場合)
DROP POLICY IF EXISTS "Users can view own post analytics" ON post_analytics;
DROP POLICY IF EXISTS "Users can insert post analytics" ON post_analytics;
DROP POLICY IF EXISTS "Users can update post analytics" ON post_analytics;

-- 自分の投稿に関連するアナリティクス閲覧
CREATE POLICY "Users can view own post analytics"
ON post_analytics
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM posts
    JOIN affiliate_links ON affiliate_links.id = posts.affiliate_link_id
    JOIN products ON products.id = affiliate_links.product_id
    WHERE posts.id = post_analytics.post_id
    AND products.user_id = auth.uid()
  )
);

-- アナリティクス作成 (Cloudflare Workers経由で作成されるため、認証不要)
CREATE POLICY "Users can insert post analytics"
ON post_analytics
FOR INSERT
WITH CHECK (true);

-- アナリティクス更新 (Cloudflare Workers経由で更新されるため、認証不要)
CREATE POLICY "Users can update post analytics"
ON post_analytics
FOR UPDATE
USING (true)
WITH CHECK (true);

-- 注: DELETE ポリシーは意図的に設定しない (アナリティクスは削除不可)
