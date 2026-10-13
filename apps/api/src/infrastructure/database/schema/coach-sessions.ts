import type {
  CoachMode,
  CoachStage,
  CoachTurn,
  ExerciseObjective,
} from '@flowment/domain';
import { integer, jsonb, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { projects } from './projects';

export const coachSessions = pgTable('coach_sessions', {
  projectId: uuid()
    .primaryKey()
    .references(() => projects.id, { onDelete: 'cascade' }),
  mode: text().$type<CoachMode>().notNull().default('open-project'),
  modelingIntent: text(),
  stage: text().$type<CoachStage>().notNull(),
  objectives: jsonb().$type<ExerciseObjective[]>().notNull().default([]),
  turns: jsonb().$type<CoachTurn[]>().notNull().default([]),
  activeQuestionId: text(),
  designRevision: text(),
  version: integer().notNull().default(0),
});
