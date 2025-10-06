-- Enable Row Level Security (RLS) for all tables
-- This migration enables RLS and creates policies for multi-tenant isolation

-- ==========================================
-- STEP 1: Enable RLS on all tables
-- ==========================================

ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "posts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "post_schedules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "affiliate_links" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "click_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "conversions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sns_integrations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ai_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "import_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "product_import_mappings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "x_api_usage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "x_api_alerts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "post_templates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "post_analytics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tag_groups" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "product_tags" ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- STEP 2: Create RLS Policies
-- ==========================================

-- Users: Users can only view and update their own record
CREATE POLICY "users_select_own" ON "users"
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON "users"
    FOR UPDATE
    USING (auth.uid() = id);

-- Products: Users can manage their own products
CREATE POLICY "products_select_own" ON "products"
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "products_insert_own" ON "products"
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "products_update_own" ON "products"
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "products_delete_own" ON "products"
    FOR DELETE
    USING (auth.uid() = user_id);

-- Posts: Users can manage their own posts
CREATE POLICY "posts_select_own" ON "posts"
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "posts_insert_own" ON "posts"
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "posts_update_own" ON "posts"
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "posts_delete_own" ON "posts"
    FOR DELETE
    USING (auth.uid() = user_id);

-- Post Schedules: Users can manage schedules for their own posts
CREATE POLICY "post_schedules_select_own" ON "post_schedules"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM posts
            WHERE posts.id = post_schedules.post_id
            AND posts.user_id = auth.uid()
        )
    );

CREATE POLICY "post_schedules_insert_own" ON "post_schedules"
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM posts
            WHERE posts.id = post_schedules.post_id
            AND posts.user_id = auth.uid()
        )
    );

CREATE POLICY "post_schedules_update_own" ON "post_schedules"
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM posts
            WHERE posts.id = post_schedules.post_id
            AND posts.user_id = auth.uid()
        )
    );

CREATE POLICY "post_schedules_delete_own" ON "post_schedules"
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM posts
            WHERE posts.id = post_schedules.post_id
            AND posts.user_id = auth.uid()
        )
    );

-- Affiliate Links: Users can manage their own affiliate links
CREATE POLICY "affiliate_links_select_own" ON "affiliate_links"
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "affiliate_links_insert_own" ON "affiliate_links"
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "affiliate_links_update_own" ON "affiliate_links"
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "affiliate_links_delete_own" ON "affiliate_links"
    FOR DELETE
    USING (auth.uid() = user_id);

-- Click Logs: Users can view click logs for their own affiliate links
-- Public can insert (for tracking clicks)
CREATE POLICY "click_logs_select_own" ON "click_logs"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM affiliate_links
            WHERE affiliate_links.id = click_logs.affiliate_link_id
            AND affiliate_links.user_id = auth.uid()
        )
    );

CREATE POLICY "click_logs_insert_public" ON "click_logs"
    FOR INSERT
    WITH CHECK (true);

-- Conversions: Users can manage conversions for their own affiliate links
CREATE POLICY "conversions_select_own" ON "conversions"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM affiliate_links
            WHERE affiliate_links.id = conversions.affiliate_link_id
            AND affiliate_links.user_id = auth.uid()
        )
    );

CREATE POLICY "conversions_insert_own" ON "conversions"
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM affiliate_links
            WHERE affiliate_links.id = conversions.affiliate_link_id
            AND affiliate_links.user_id = auth.uid()
        )
    );

CREATE POLICY "conversions_update_own" ON "conversions"
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM affiliate_links
            WHERE affiliate_links.id = conversions.affiliate_link_id
            AND affiliate_links.user_id = auth.uid()
        )
    );

-- SNS Integrations: Users can manage their own SNS integrations
CREATE POLICY "sns_integrations_select_own" ON "sns_integrations"
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "sns_integrations_insert_own" ON "sns_integrations"
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sns_integrations_update_own" ON "sns_integrations"
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "sns_integrations_delete_own" ON "sns_integrations"
    FOR DELETE
    USING (auth.uid() = user_id);

-- AI Settings: Users can manage their own AI settings
CREATE POLICY "ai_settings_select_own" ON "ai_settings"
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "ai_settings_insert_own" ON "ai_settings"
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ai_settings_update_own" ON "ai_settings"
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "ai_settings_delete_own" ON "ai_settings"
    FOR DELETE
    USING (auth.uid() = user_id);

-- Import Logs: Users can manage their own import logs
CREATE POLICY "import_logs_select_own" ON "import_logs"
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "import_logs_insert_own" ON "import_logs"
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "import_logs_update_own" ON "import_logs"
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Product Import Mappings: Users can manage their own mappings
CREATE POLICY "product_import_mappings_select_own" ON "product_import_mappings"
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "product_import_mappings_insert_own" ON "product_import_mappings"
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "product_import_mappings_update_own" ON "product_import_mappings"
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "product_import_mappings_delete_own" ON "product_import_mappings"
    FOR DELETE
    USING (auth.uid() = user_id);

-- X API Usage: Users can manage their own API usage records
CREATE POLICY "x_api_usage_select_own" ON "x_api_usage"
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "x_api_usage_insert_own" ON "x_api_usage"
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "x_api_usage_update_own" ON "x_api_usage"
    FOR UPDATE
    USING (auth.uid() = user_id);

-- X API Alerts: Users can view their own API alerts
CREATE POLICY "x_api_alerts_select_own" ON "x_api_alerts"
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "x_api_alerts_insert_own" ON "x_api_alerts"
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "x_api_alerts_update_own" ON "x_api_alerts"
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Post Templates: Users can manage their own post templates
CREATE POLICY "post_templates_select_own" ON "post_templates"
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "post_templates_insert_own" ON "post_templates"
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "post_templates_update_own" ON "post_templates"
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "post_templates_delete_own" ON "post_templates"
    FOR DELETE
    USING (auth.uid() = user_id);

-- Post Analytics: Users can view analytics for their own posts
CREATE POLICY "post_analytics_select_own" ON "post_analytics"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM posts
            WHERE posts.id = post_analytics.post_id
            AND posts.user_id = auth.uid()
        )
    );

CREATE POLICY "post_analytics_insert_own" ON "post_analytics"
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM posts
            WHERE posts.id = post_analytics.post_id
            AND posts.user_id = auth.uid()
        )
    );

CREATE POLICY "post_analytics_update_own" ON "post_analytics"
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM posts
            WHERE posts.id = post_analytics.post_id
            AND posts.user_id = auth.uid()
        )
    );

-- Tag Groups: Users can manage their own tag groups
CREATE POLICY "tag_groups_select_own" ON "tag_groups"
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "tag_groups_insert_own" ON "tag_groups"
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tag_groups_update_own" ON "tag_groups"
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "tag_groups_delete_own" ON "tag_groups"
    FOR DELETE
    USING (auth.uid() = user_id);

-- Product Tags: Users can manage tags for their own products
CREATE POLICY "product_tags_select_own" ON "product_tags"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM products
            WHERE products.id = product_tags.product_id
            AND products.user_id = auth.uid()
        )
    );

CREATE POLICY "product_tags_insert_own" ON "product_tags"
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM products
            WHERE products.id = product_tags.product_id
            AND products.user_id = auth.uid()
        )
    );

CREATE POLICY "product_tags_delete_own" ON "product_tags"
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM products
            WHERE products.id = product_tags.product_id
            AND products.user_id = auth.uid()
        )
    );
