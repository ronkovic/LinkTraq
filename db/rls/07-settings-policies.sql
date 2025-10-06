-- =============================================
-- 07. 設定関連テーブルのRLSポリシー
-- =============================================
-- sns_integrations, x_api_settings, app_settings, notifications, post_schedules テーブル
-- ユーザーは自分の設定のみ読み書き可能

-- =============================================
-- sns_integrations テーブル
-- =============================================

-- ポリシー削除 (既存の場合)
DROP POLICY IF EXISTS "Users can view own sns integrations" ON sns_integrations;
DROP POLICY IF EXISTS "Users can insert own sns integrations" ON sns_integrations;
DROP POLICY IF EXISTS "Users can update own sns integrations" ON sns_integrations;
DROP POLICY IF EXISTS "Users can delete own sns integrations" ON sns_integrations;

-- 自分のSNS連携閲覧
CREATE POLICY "Users can view own sns integrations"
ON sns_integrations
FOR SELECT
USING (auth.uid() = user_id);

-- 自分のSNS連携作成
CREATE POLICY "Users can insert own sns integrations"
ON sns_integrations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 自分のSNS連携更新
CREATE POLICY "Users can update own sns integrations"
ON sns_integrations
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 自分のSNS連携削除
CREATE POLICY "Users can delete own sns integrations"
ON sns_integrations
FOR DELETE
USING (auth.uid() = user_id);

-- =============================================
-- x_api_settings テーブル
-- =============================================

-- ポリシー削除 (既存の場合)
DROP POLICY IF EXISTS "Users can view own x api settings" ON x_api_settings;
DROP POLICY IF EXISTS "Users can insert own x api settings" ON x_api_settings;
DROP POLICY IF EXISTS "Users can update own x api settings" ON x_api_settings;
DROP POLICY IF EXISTS "Users can delete own x api settings" ON x_api_settings;

-- 自分のX API設定閲覧
CREATE POLICY "Users can view own x api settings"
ON x_api_settings
FOR SELECT
USING (auth.uid() = user_id);

-- 自分のX API設定作成
CREATE POLICY "Users can insert own x api settings"
ON x_api_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 自分のX API設定更新
CREATE POLICY "Users can update own x api settings"
ON x_api_settings
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 自分のX API設定削除
CREATE POLICY "Users can delete own x api settings"
ON x_api_settings
FOR DELETE
USING (auth.uid() = user_id);

-- =============================================
-- app_settings テーブル
-- =============================================

-- ポリシー削除 (既存の場合)
DROP POLICY IF EXISTS "Users can view own app settings" ON app_settings;
DROP POLICY IF EXISTS "Users can insert own app settings" ON app_settings;
DROP POLICY IF EXISTS "Users can update own app settings" ON app_settings;
DROP POLICY IF EXISTS "Users can delete own app settings" ON app_settings;

-- 自分のアプリ設定閲覧
CREATE POLICY "Users can view own app settings"
ON app_settings
FOR SELECT
USING (auth.uid() = user_id);

-- 自分のアプリ設定作成
CREATE POLICY "Users can insert own app settings"
ON app_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 自分のアプリ設定更新
CREATE POLICY "Users can update own app settings"
ON app_settings
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 自分のアプリ設定削除
CREATE POLICY "Users can delete own app settings"
ON app_settings
FOR DELETE
USING (auth.uid() = user_id);

-- =============================================
-- notifications テーブル
-- =============================================

-- ポリシー削除 (既存の場合)
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;

-- 自分の通知閲覧
CREATE POLICY "Users can view own notifications"
ON notifications
FOR SELECT
USING (auth.uid() = user_id);

-- 自分の通知作成 (システムまたはユーザー自身)
CREATE POLICY "Users can insert own notifications"
ON notifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 自分の通知更新 (既読フラグ等)
CREATE POLICY "Users can update own notifications"
ON notifications
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 自分の通知削除
CREATE POLICY "Users can delete own notifications"
ON notifications
FOR DELETE
USING (auth.uid() = user_id);

-- =============================================
-- post_schedules テーブル
-- =============================================

-- ポリシー削除 (既存の場合)
DROP POLICY IF EXISTS "Users can view own post schedules" ON post_schedules;
DROP POLICY IF EXISTS "Users can insert own post schedules" ON post_schedules;
DROP POLICY IF EXISTS "Users can update own post schedules" ON post_schedules;
DROP POLICY IF EXISTS "Users can delete own post schedules" ON post_schedules;

-- 自分の投稿スケジュール閲覧
CREATE POLICY "Users can view own post schedules"
ON post_schedules
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM posts
    JOIN affiliate_links ON affiliate_links.id = posts.affiliate_link_id
    JOIN products ON products.id = affiliate_links.product_id
    WHERE posts.id = post_schedules.post_id
    AND products.user_id = auth.uid()
  )
);

-- 自分の投稿スケジュール作成
CREATE POLICY "Users can insert own post schedules"
ON post_schedules
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM posts
    JOIN affiliate_links ON affiliate_links.id = posts.affiliate_link_id
    JOIN products ON products.id = affiliate_links.product_id
    WHERE posts.id = post_schedules.post_id
    AND products.user_id = auth.uid()
  )
);

-- 自分の投稿スケジュール更新
CREATE POLICY "Users can update own post schedules"
ON post_schedules
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM posts
    JOIN affiliate_links ON affiliate_links.id = posts.affiliate_link_id
    JOIN products ON products.id = affiliate_links.product_id
    WHERE posts.id = post_schedules.post_id
    AND products.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM posts
    JOIN affiliate_links ON affiliate_links.id = posts.affiliate_link_id
    JOIN products ON products.id = affiliate_links.product_id
    WHERE posts.id = post_schedules.post_id
    AND products.user_id = auth.uid()
  )
);

-- 自分の投稿スケジュール削除
CREATE POLICY "Users can delete own post schedules"
ON post_schedules
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM posts
    JOIN affiliate_links ON affiliate_links.id = posts.affiliate_link_id
    JOIN products ON products.id = affiliate_links.product_id
    WHERE posts.id = post_schedules.post_id
    AND products.user_id = auth.uid()
  )
);
