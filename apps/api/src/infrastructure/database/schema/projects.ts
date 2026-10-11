import type { SystemDesign } from '@flowment/domain';
import { sql } from 'drizzle-orm';
import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const projects = pgTable('projects', {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  systemDesign: jsonb().$type<SystemDesign>().notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => sql`now()`),
});
