-- =============================================
-- 01. 全テーブルのRLS有効化
-- =============================================
-- このスクリプトはすべてのテーブルでRow Level Securityを有効化します
-- 実行順序: 最初に実行

-- users テーブル
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- products テーブル
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- affiliate_links テーブル
ALTER TABLE affiliate_links ENABLE ROW LEVEL SECURITY;

-- posts テーブル
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- conversions テーブル
ALTER TABLE conversions ENABLE ROW LEVEL SECURITY;

-- link_clicks テーブル
ALTER TABLE link_clicks ENABLE ROW LEVEL SECURITY;

-- post_analytics テーブル
ALTER TABLE post_analytics ENABLE ROW LEVEL SECURITY;

-- sns_integrations テーブル
ALTER TABLE sns_integrations ENABLE ROW LEVEL SECURITY;

-- x_api_settings テーブル
ALTER TABLE x_api_settings ENABLE ROW LEVEL SECURITY;

-- app_settings テーブル
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- notifications テーブル
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- post_schedules テーブル
ALTER TABLE post_schedules ENABLE ROW LEVEL SECURITY;
