import { pgTable, uuid, text, timestamp, integer, jsonb } from 'drizzle-orm/pg-core'
import { users } from './users'

export const aiSettings = pgTable('ai_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(), // "openrouter"
  defaultModel: text('default_model').notNull(), // "deepseek/deepseek-v3.1:free"
  useOwnApiKey: text('use_own_api_key').notNull().default('false'), // true: user's API key, false: service-provided
  apiKey: text('api_key'), // encrypted - user's own API key (Supabase Vault)
  apiKeyLast4: text('api_key_last_4'), // Display purposes "••••1234"
  apiKeyVerifiedAt: timestamp('api_key_verified_at'), // API key verification timestamp
  taskModelMapping: jsonb('task_model_mapping'), // Task-specific model settings
  monthlyUsageLimit: integer('monthly_usage_limit'), // Monthly usage limit (token count)
  currentMonthUsage: integer('current_month_usage').notNull().default(0), // Current month usage
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
