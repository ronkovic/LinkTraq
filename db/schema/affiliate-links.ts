import { pgTable, uuid, text, timestamp, inet } from 'drizzle-orm/pg-core'
import { affiliateProviders } from './affiliate-providers'
import { products } from './products'
import { posts } from './posts'

export const affiliateLinks = pgTable('affiliate_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  providerId: uuid('provider_id').notNull().references(() => affiliateProviders.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  shortCode: text('short_code').notNull().unique(), // "abc123"
  originalUrl: text('original_url').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const linkClicks = pgTable('link_clicks', {
  id: uuid('id').primaryKey().defaultRandom(),
  affiliateLinkId: uuid('affiliate_link_id').notNull().references(() => affiliateLinks.id, { onDelete: 'cascade' }),
  postId: uuid('post_id').references(() => posts.id, { onDelete: 'set null' }),
  clickedAt: timestamp('clicked_at').defaultNow().notNull(),
  referrer: text('referrer'), // Which SNS
  userAgent: text('user_agent'),
  ipAddress: inet('ip_address'),
  country: text('country'),
  deviceType: text('device_type'),
})
