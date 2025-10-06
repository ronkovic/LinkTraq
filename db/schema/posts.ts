import { pgTable, uuid, text, timestamp, pgEnum, integer } from 'drizzle-orm/pg-core'
import { users } from './users'
import { products } from './products'

// Enums
export const postStatusEnum = pgEnum('post_status', ['draft', 'scheduled', 'published'])
export const snsPlatformEnum = pgEnum('sns_platform', ['x', 'instagram', 'facebook'])
export const scheduleStatusEnum = pgEnum('schedule_status', ['pending', 'processing', 'published', 'failed'])

export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
  content: text('content').notNull(),
  imageUrls: text('image_urls').array(), // Array of image URLs
  hashtags: text('hashtags').array(), // Array of hashtags
  status: postStatusEnum('status').notNull().default('draft'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const postSchedules = pgTable('post_schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  scheduledAt: timestamp('scheduled_at').notNull(),
  snsPlatform: snsPlatformEnum('sns_platform').notNull(),
  publishedAt: timestamp('published_at'),
  status: scheduleStatusEnum('status').notNull().default('pending'),
  retryCount: integer('retry_count').notNull().default(0),
  lastError: text('last_error'),
  lastRetryAt: timestamp('last_retry_at'),
  nextRetryAt: timestamp('next_retry_at'),
})

export const postFailures = pgTable('post_failures', {
  id: uuid('id').primaryKey().defaultRandom(),
  postScheduleId: uuid('post_schedule_id').notNull().references(() => postSchedules.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  errorType: text('error_type').notNull(), // "api_error", "network_error", "auth_error", "validation_error"
  errorCode: text('error_code'), // HTTP status code
  errorMessage: text('error_message').notNull(),
  retryCount: integer('retry_count').notNull(),
  isFinalFailure: text('is_final_failure').notNull().default('false'), // Using text instead of boolean for PostgreSQL compatibility
  snsPlatform: text('sns_platform').notNull(),
  occurredAt: timestamp('occurred_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
