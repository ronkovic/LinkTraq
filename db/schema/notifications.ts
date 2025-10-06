import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core'
import { users } from './users'

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // "post_failure", "post_success", "api_limit", "system"
  title: text('title').notNull(),
  message: text('message').notNull(),
  data: jsonb('data'), // Additional information (postScheduleId, errorType, etc.)
  read: text('read').notNull().default('false'), // Using text instead of boolean
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const notificationSettings = pgTable('notification_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  emailEnabled: text('email_enabled').notNull().default('true'), // Email notifications
  appEnabled: text('app_enabled').notNull().default('true'), // In-app notifications
  pushEnabled: text('push_enabled').notNull().default('false'), // Push notifications (Phase 2)
  notifyOnFailure: text('notify_on_failure').notNull().default('true'), // Notify on post failure
  notifyOnSuccess: text('notify_on_success').notNull().default('false'), // Notify on post success
  notifyOnRetry: text('notify_on_retry').notNull().default('false'), // Notify on retry
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
