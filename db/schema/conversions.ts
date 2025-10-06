import { pgTable, uuid, text, timestamp, decimal, integer, jsonb, pgEnum, unique } from 'drizzle-orm/pg-core'
import { affiliateLinks } from './affiliate-links'
import { linkClicks } from './affiliate-links'
import { users } from './users'

// Enums
export const conversionStatusEnum = pgEnum('conversion_status', ['pending', 'approved', 'rejected', 'cancelled'])
export const importSourceEnum = pgEnum('import_source', ['csv_manual', 'api_amazon', 'api_rakuten', 'api_a8'])
export const importLogStatusEnum = pgEnum('import_log_status', ['processing', 'completed', 'failed'])

export const conversions = pgTable('conversions', {
  id: uuid('id').primaryKey().defaultRandom(),
  affiliateLinkId: uuid('affiliate_link_id').notNull().references(() => affiliateLinks.id, { onDelete: 'cascade' }),
  clickId: uuid('click_id').references(() => linkClicks.id, { onDelete: 'set null' }),
  provider: text('provider').notNull(), // "amazon", "rakuten", "a8"
  orderId: text('order_id').notNull(), // ASP order ID
  amount: decimal('amount', { precision: 10, scale: 2 }), // Purchase amount
  commission: decimal('commission', { precision: 10, scale: 2 }), // Commission amount
  status: conversionStatusEnum('status').notNull().default('pending'),
  convertedAt: timestamp('converted_at').notNull(),
  approvedAt: timestamp('approved_at'),
  rejectedAt: timestamp('rejected_at'),
  rejectionReason: text('rejection_reason'),
  importSource: importSourceEnum('import_source').notNull(),
  importedAt: timestamp('imported_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Unique constraint on provider + orderId to prevent duplicates
  uniqueProviderOrder: unique().on(table.provider, table.orderId),
}))

export const conversionImportLogs = pgTable('conversion_import_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(),
  importSource: importSourceEnum('import_source').notNull(),
  fileName: text('file_name'),
  recordsTotal: integer('records_total').notNull(),
  recordsImported: integer('records_imported').notNull(),
  recordsSkipped: integer('records_skipped').notNull(),
  recordsFailed: integer('records_failed').notNull(),
  errorMessages: jsonb('error_messages'), // JSON array of error messages
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  status: importLogStatusEnum('status').notNull().default('processing'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ASP API Settings (Phase 2)
export const aspApiSettings = pgTable('asp_api_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(), // "amazon", "rakuten", "a8"
  apiKey: text('api_key'), // encrypted
  apiSecret: text('api_secret'), // encrypted
  accessToken: text('access_token'), // encrypted, for OAuth
  refreshToken: text('refresh_token'), // encrypted
  expiresAt: timestamp('expires_at'),
  autoSyncEnabled: text('auto_sync_enabled').notNull().default('false'), // Using text instead of boolean
  syncFrequency: text('sync_frequency'), // "hourly", "daily", "weekly"
  lastSyncedAt: timestamp('last_synced_at'),
  verifiedAt: timestamp('verified_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Unique constraint on userId + provider
  uniqueUserProvider: unique().on(table.userId, table.provider),
}))
