import { pgTable, uuid, timestamp, integer, decimal } from 'drizzle-orm/pg-core'
import { posts, snsPlatformEnum } from './posts'

export const postAnalytics = pgTable('post_analytics', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  platform: snsPlatformEnum('platform').notNull(),
  impressions: integer('impressions').notNull().default(0),
  likes: integer('likes').notNull().default(0),
  retweets: integer('retweets').notNull().default(0),
  comments: integer('comments').notNull().default(0),
  engagementRate: decimal('engagement_rate', { precision: 5, scale: 2 }), // e.g., 12.34%
  fetchedAt: timestamp('fetched_at').defaultNow().notNull(),
})
