-- LinkTraq Initial Schema Migration
-- Complete database schema with all tables and foreign keys

-- ==========================================
-- STEP 1: Create ENUM Types
-- ==========================================

DO $$ BEGIN
    CREATE TYPE "public"."post_status" AS ENUM('draft', 'scheduled', 'published');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "public"."schedule_status" AS ENUM('pending', 'processing', 'published', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "public"."sns_platform" AS ENUM('x', 'instagram', 'facebook');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "public"."conversion_status" AS ENUM('pending', 'approved', 'rejected', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "public"."import_log_status" AS ENUM('processing', 'completed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "public"."import_source" AS ENUM('csv_manual', 'api_amazon', 'api_rakuten', 'api_a8');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "public"."x_api_alert_type" AS ENUM('warning_75', 'warning_90', 'limit_reached');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "public"."x_api_plan" AS ENUM('free', 'basic', 'pro');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==========================================
-- STEP 2: Create Tables (without foreign keys)
-- ==========================================

-- Users table (base table)
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

-- Products table
CREATE TABLE IF NOT EXISTS "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" numeric(10, 2),
	"image_url" text,
	"category" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Posts table
CREATE TABLE IF NOT EXISTS "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"product_id" uuid,
	"content" text NOT NULL,
	"sns_platform" "sns_platform" NOT NULL,
	"status" "post_status" DEFAULT 'draft' NOT NULL,
	"scheduled_at" timestamp,
	"published_at" timestamp,
	"external_post_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Post schedules table
CREATE TABLE IF NOT EXISTS "post_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"scheduled_at" timestamp NOT NULL,
	"sns_platform" "sns_platform" NOT NULL,
	"status" "schedule_status" DEFAULT 'pending' NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Affiliate links table
CREATE TABLE IF NOT EXISTS "affiliate_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"sns_platform" "sns_platform" NOT NULL,
	"original_url" text NOT NULL,
	"short_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Analytics table
CREATE TABLE IF NOT EXISTS "analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"sns_platform" "sns_platform" NOT NULL,
	"impression_count" integer DEFAULT 0 NOT NULL,
	"click_count" integer DEFAULT 0 NOT NULL,
	"like_count" integer DEFAULT 0 NOT NULL,
	"retweet_count" integer DEFAULT 0 NOT NULL,
	"comment_count" integer DEFAULT 0 NOT NULL,
	"synced_at" timestamp DEFAULT now() NOT NULL
);

-- Link clicks table
CREATE TABLE IF NOT EXISTS "link_clicks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"affiliate_link_id" uuid NOT NULL,
	"post_id" uuid,
	"clicked_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text
);

-- Conversions table
CREATE TABLE IF NOT EXISTS "conversions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"affiliate_link_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"commission" numeric(10, 2),
	"status" "conversion_status" DEFAULT 'pending' NOT NULL,
	"converted_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Post failures table
CREATE TABLE IF NOT EXISTS "post_failures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_schedule_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"error_type" text NOT NULL,
	"error_code" text,
	"error_message" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Affiliate providers table
CREATE TABLE IF NOT EXISTS "affiliate_providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"api_key" text,
	"api_secret" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Product analyses table
CREATE TABLE IF NOT EXISTS "product_analyses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"trend_score" text,
	"ai_summary" text,
	"analyzed_at" timestamp DEFAULT now() NOT NULL
);

-- AI settings table
CREATE TABLE IF NOT EXISTS "ai_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"default_model" text DEFAULT 'deepseek/deepseek-v3.1:free' NOT NULL,
	"use_own_api_key" text DEFAULT 'false' NOT NULL,
	"api_key" text,
	"api_key_last_4" text,
	"api_key_verified_at" timestamp,
	"monthly_usage_limit" integer DEFAULT 100000,
	"current_month_usage" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ai_settings_user_id_unique" UNIQUE("user_id")
);

-- SNS integrations table
CREATE TABLE IF NOT EXISTS "sns_integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"sns_platform" "sns_platform" NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"token_expires_at" timestamp,
	"api_key" text,
	"api_secret" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sns_integrations_user_id_sns_platform_unique" UNIQUE("user_id","sns_platform")
);

-- Import logs table
CREATE TABLE IF NOT EXISTS "import_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"source" "import_source" NOT NULL,
	"status" "import_log_status" DEFAULT 'processing' NOT NULL,
	"total_products" integer DEFAULT 0 NOT NULL,
	"imported_count" integer DEFAULT 0 NOT NULL,
	"failed_count" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);

-- ASP API settings table
CREATE TABLE IF NOT EXISTS "asp_api_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider_name" text NOT NULL,
	"api_key" text,
	"api_secret" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "asp_api_settings_user_id_provider_name_unique" UNIQUE("user_id","provider_name")
);

-- Conversion import logs table
CREATE TABLE IF NOT EXISTS "conversion_import_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"source" text NOT NULL,
	"status" "import_log_status" DEFAULT 'processing' NOT NULL,
	"total_conversions" integer DEFAULT 0 NOT NULL,
	"imported_count" integer DEFAULT 0 NOT NULL,
	"failed_count" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);

-- X API usage table
CREATE TABLE IF NOT EXISTS "x_api_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"api_plan" "x_api_plan" DEFAULT 'free' NOT NULL,
	"month_year" text NOT NULL,
	"post_count" integer DEFAULT 0 NOT NULL,
	"post_limit" integer DEFAULT 1500 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "x_api_usage_user_id_month_year_unique" UNIQUE("user_id","month_year")
);

-- X API alerts table
CREATE TABLE IF NOT EXISTS "x_api_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"alert_type" "x_api_alert_type" NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- ==========================================
-- STEP 3: Add Foreign Key Constraints
-- ==========================================

-- Products → Users
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'products_user_id_users_id_fk'
    ) THEN
        ALTER TABLE "products"
        ADD CONSTRAINT "products_user_id_users_id_fk"
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
        ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;

-- Posts → Users
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'posts_user_id_users_id_fk'
    ) THEN
        ALTER TABLE "posts"
        ADD CONSTRAINT "posts_user_id_users_id_fk"
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
        ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;

-- Posts → Products (nullable)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'posts_product_id_products_id_fk'
    ) THEN
        ALTER TABLE "posts"
        ADD CONSTRAINT "posts_product_id_products_id_fk"
        FOREIGN KEY ("product_id") REFERENCES "public"."products"("id")
        ON DELETE set null ON UPDATE no action;
    END IF;
END $$;

-- Post schedules → Posts
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'post_schedules_post_id_posts_id_fk'
    ) THEN
        ALTER TABLE "post_schedules"
        ADD CONSTRAINT "post_schedules_post_id_posts_id_fk"
        FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id")
        ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;

-- Affiliate links → Users
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'affiliate_links_user_id_users_id_fk'
    ) THEN
        ALTER TABLE "affiliate_links"
        ADD CONSTRAINT "affiliate_links_user_id_users_id_fk"
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
        ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;

-- Affiliate links → Products
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'affiliate_links_product_id_products_id_fk'
    ) THEN
        ALTER TABLE "affiliate_links"
        ADD CONSTRAINT "affiliate_links_product_id_products_id_fk"
        FOREIGN KEY ("product_id") REFERENCES "public"."products"("id")
        ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;

-- Analytics → Posts
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'analytics_post_id_posts_id_fk'
    ) THEN
        ALTER TABLE "analytics"
        ADD CONSTRAINT "analytics_post_id_posts_id_fk"
        FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id")
        ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;

-- Link clicks → Affiliate links
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'link_clicks_affiliate_link_id_affiliate_links_id_fk'
    ) THEN
        ALTER TABLE "link_clicks"
        ADD CONSTRAINT "link_clicks_affiliate_link_id_affiliate_links_id_fk"
        FOREIGN KEY ("affiliate_link_id") REFERENCES "public"."affiliate_links"("id")
        ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;

-- Link clicks → Posts (nullable)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'link_clicks_post_id_posts_id_fk'
    ) THEN
        ALTER TABLE "link_clicks"
        ADD CONSTRAINT "link_clicks_post_id_posts_id_fk"
        FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id")
        ON DELETE set null ON UPDATE no action;
    END IF;
END $$;

-- Conversions → Affiliate links
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'conversions_affiliate_link_id_affiliate_links_id_fk'
    ) THEN
        ALTER TABLE "conversions"
        ADD CONSTRAINT "conversions_affiliate_link_id_affiliate_links_id_fk"
        FOREIGN KEY ("affiliate_link_id") REFERENCES "public"."affiliate_links"("id")
        ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;

-- Conversions → Users
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'conversions_user_id_users_id_fk'
    ) THEN
        ALTER TABLE "conversions"
        ADD CONSTRAINT "conversions_user_id_users_id_fk"
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
        ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;

-- Post failures → Post schedules
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'post_failures_post_schedule_id_post_schedules_id_fk'
    ) THEN
        ALTER TABLE "post_failures"
        ADD CONSTRAINT "post_failures_post_schedule_id_post_schedules_id_fk"
        FOREIGN KEY ("post_schedule_id") REFERENCES "public"."post_schedules"("id")
        ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;

-- Post failures → Users
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'post_failures_user_id_users_id_fk'
    ) THEN
        ALTER TABLE "post_failures"
        ADD CONSTRAINT "post_failures_user_id_users_id_fk"
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
        ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;

-- Affiliate providers → Users
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'affiliate_providers_user_id_users_id_fk'
    ) THEN
        ALTER TABLE "affiliate_providers"
        ADD CONSTRAINT "affiliate_providers_user_id_users_id_fk"
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
        ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;

-- Product analyses → Products
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'product_analyses_product_id_products_id_fk'
    ) THEN
        ALTER TABLE "product_analyses"
        ADD CONSTRAINT "product_analyses_product_id_products_id_fk"
        FOREIGN KEY ("product_id") REFERENCES "public"."products"("id")
        ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;

-- AI settings → Users
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ai_settings_user_id_users_id_fk'
    ) THEN
        ALTER TABLE "ai_settings"
        ADD CONSTRAINT "ai_settings_user_id_users_id_fk"
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
        ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;

-- SNS integrations → Users
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'sns_integrations_user_id_users_id_fk'
    ) THEN
        ALTER TABLE "sns_integrations"
        ADD CONSTRAINT "sns_integrations_user_id_users_id_fk"
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
        ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;

-- Import logs → Users
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'import_logs_user_id_users_id_fk'
    ) THEN
        ALTER TABLE "import_logs"
        ADD CONSTRAINT "import_logs_user_id_users_id_fk"
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
        ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;

-- ASP API settings → Users
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'asp_api_settings_user_id_users_id_fk'
    ) THEN
        ALTER TABLE "asp_api_settings"
        ADD CONSTRAINT "asp_api_settings_user_id_users_id_fk"
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
        ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;

-- Conversion import logs → Users
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'conversion_import_logs_user_id_users_id_fk'
    ) THEN
        ALTER TABLE "conversion_import_logs"
        ADD CONSTRAINT "conversion_import_logs_user_id_users_id_fk"
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
        ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;

-- X API usage → Users
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'x_api_usage_user_id_users_id_fk'
    ) THEN
        ALTER TABLE "x_api_usage"
        ADD CONSTRAINT "x_api_usage_user_id_users_id_fk"
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
        ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;

-- X API alerts → Users
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'x_api_alerts_user_id_users_id_fk'
    ) THEN
        ALTER TABLE "x_api_alerts"
        ADD CONSTRAINT "x_api_alerts_user_id_users_id_fk"
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
        ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;
