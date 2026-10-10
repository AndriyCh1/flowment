import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// Column names are snake_cased by the client's `casing` option.
export const notes = pgTable('notes', {
  id: uuid().primaryKey().defaultRandom(),
  title: text().notNull(),
  body: text().notNull().default(''),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
