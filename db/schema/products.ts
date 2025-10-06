import { pgTable, uuid, text, timestamp, decimal } from 'drizzle-orm/pg-core'
import { users } from './users'

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }),
  imageUrl: text('image_url'), // R2 image URL
  category: text('category'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const productAnalyses = pgTable('product_analyses', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  trendScore: text('trend_score'), // Changed from integer to text for flexibility
  aiSummary: text('ai_summary'),
  analyzedAt: timestamp('analyzed_at').defaultNow().notNull(),
})
