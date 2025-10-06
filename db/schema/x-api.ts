import { pgTable, uuid, text, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core'
import { users } from './users'

// Enums
export const xApiPlanEnum = pgEnum('x_api_plan', ['free', 'basic', 'pro'])
export const xApiAlertTypeEnum = pgEnum('x_api_alert_type', ['warning_75', 'warning_90', 'limit_reached'])

export const xApiSettings = pgTable('x_api_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  apiKey: text('api_key'), // encrypted - Supabase Vault
  apiSecret: text('api_secret'), // encrypted
  bearerToken: text('bearer_token'), // encrypted
  apiKeyLast4: text('api_key_last_4'), // Display purposes "••••1234"
  planType: xApiPlanEnum('plan_type').notNull().default('free'),
  verifiedAt: timestamp('verified_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const xApiUsage = pgTable('x_api_usage', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  month: text('month').notNull(), // "2025-01"
  postsCount: integer('posts_count').notNull().default(0),
  planLimit: integer('plan_limit').notNull(), // 1500 (Free), 3000 (Basic), -1 (Pro unlimited)
  lastResetAt: timestamp('last_reset_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const xApiAlerts = pgTable('x_api_alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  alertType: xApiAlertTypeEnum('alert_type').notNull(),
  message: text('message').notNull(),
  sentAt: timestamp('sent_at').defaultNow().notNull(),
  acknowledged: text('acknowledged').notNull().default('false'), // Using text instead of boolean
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// SNS Accounts (future: Instagram/Facebook)
export const snsAccounts = pgTable('sns_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  platform: text('platform').notNull(), // "instagram", "facebook" (X is managed via x_api_settings)
  accessToken: text('access_token'), // encrypted
  refreshToken: text('refresh_token'), // encrypted
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
