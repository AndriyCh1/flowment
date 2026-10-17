import { z } from 'zod';
import { ExerciseObjectiveSchema } from './coach.js';
import { IdSchema } from './id.js';
import { SystemDesignSchema } from './system-design.js';
import { reportDuplicateIds } from './validation.js';

export const TrainingModeSchema = z.enum(['trace', 'complete', 'repair']);

export type TrainingMode = z.infer<typeof TrainingModeSchema>;

export const MIN_EXERCISE_DIFFICULTY = 1;
export const MAX_EXERCISE_DIFFICULTY = 3;

export const ExerciseDifficultySchema = z
  .int()
  .min(MIN_EXERCISE_DIFFICULTY)
  .max(MAX_EXERCISE_DIFFICULTY);

export type ExerciseDifficulty = z.infer<typeof ExerciseDifficultySchema>;

export const ExerciseSchema = z
  .object({
    id: IdSchema,
    title: z.string().trim().min(1),
    difficulty: ExerciseDifficultySchema,
    mode: TrainingModeSchema,
    prompt: z.string().trim().min(1),
    learningObjectives: z.array(ExerciseObjectiveSchema).min(1),
    startingDesign: SystemDesignSchema,
  })
  .superRefine((exercise, ctx) => {
    reportDuplicateIds(
      exercise.learningObjectives,
      ['learningObjectives'],
      'objective',
      ctx,
    );
  });

export type Exercise = z.infer<typeof ExerciseSchema>;
