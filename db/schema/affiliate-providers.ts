import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users'

export const affiliateProviders = pgTable('affiliate_providers', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(), // "Amazon Associates", "楽天" etc.
  apiKey: text('api_key'), // encrypted
  apiSecret: text('api_secret'), // encrypted
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
