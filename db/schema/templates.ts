import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users'

export const templates = pgTable('templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  contentTemplate: text('content_template').notNull(),
  hashtagTemplate: text('hashtag_template').array(), // Array of hashtag templates
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
