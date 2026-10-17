import type { CoachQuestionPurpose, HintOutcome } from '@flowment/domain';
import {
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { projects } from './projects';

export const coachHintRequests = pgTable('coach_hint_requests', {
  id: uuid().primaryKey().defaultRandom(),
  projectId: uuid()
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  questionId: text().notNull(),
  questionPurpose: text().$type<CoachQuestionPurpose>().notNull(),
  level: integer().notNull(),
  outcome: text().$type<HintOutcome>().notNull(),
  designRevision: text().notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
