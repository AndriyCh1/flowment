import { z } from 'zod';
import { ExerciseObjectiveSchema, type ExerciseObjective } from './coach.js';
import { IdSchema } from './id.js';
import { MissingStepSchema, findMissingStepMarker } from './missing-step.js';
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

export const TRACE_EXPLICITNESS_OBJECTIVE: ExerciseObjective = {
  id: 'explicit-sequence',
  description:
    'The sequence is explicit: each interaction says what is sent or asked for, and each component acts only on information it already holds or received in an earlier step.',
};

export const ExerciseSchema = z
  .object({
    id: IdSchema,
    title: z.string().trim().min(1),
    difficulty: ExerciseDifficultySchema,
    mode: TrainingModeSchema,
    prompt: z.string().trim().min(1),
    learningObjectives: z.array(ExerciseObjectiveSchema).min(1),
    startingDesign: SystemDesignSchema,
    missingStep: MissingStepSchema.optional(),
  })
  .superRefine((exercise, ctx) => {
    reportDuplicateIds(
      exercise.learningObjectives,
      ['learningObjectives'],
      'objective',
      ctx,
    );

    if (exercise.mode === 'complete' && !exercise.missingStep) {
      ctx.addIssue({
        code: 'custom',
        message: 'A complete exercise needs a missing step',
        path: ['missingStep'],
      });
    }

    if (exercise.mode !== 'complete' && exercise.missingStep) {
      ctx.addIssue({
        code: 'custom',
        message: 'Only complete exercises have a missing step',
        path: ['missingStep'],
      });
    }

    if (
      exercise.missingStep &&
      !findMissingStepMarker(exercise.startingDesign, exercise.missingStep)
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'The missing step must be a note in the starting design',
        path: ['missingStep'],
      });
    }

    if (exercise.mode === 'trace') {
      exercise.learningObjectives.forEach(({ id }, index) => {
        if (id === TRACE_EXPLICITNESS_OBJECTIVE.id) {
          ctx.addIssue({
            code: 'custom',
            message: `Objective id "${id}" is reserved in trace exercises`,
            path: ['learningObjectives', index, 'id'],
          });
        }
      });
    }
  });

export type Exercise = z.infer<typeof ExerciseSchema>;

export function exerciseObjectives(
  exercise: Pick<Exercise, 'mode' | 'learningObjectives'>,
): ExerciseObjective[] {
  return exercise.mode === 'trace'
    ? [TRACE_EXPLICITNESS_OBJECTIVE, ...exercise.learningObjectives]
    : [...exercise.learningObjectives];
}
