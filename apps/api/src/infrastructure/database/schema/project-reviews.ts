import type { ReviewFeedback } from '@flowment/domain';
import {
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { projects } from './projects';

export const projectReviews = pgTable(
  'project_reviews',
  {
    id: uuid().primaryKey().defaultRandom(),
    projectId: uuid()
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    designRevision: text().notNull(),
    feedback: jsonb().$type<ReviewFeedback>().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('project_reviews_project_id_design_revision_unique').on(
      table.projectId,
      table.designRevision,
    ),
  ],
);
