import {
  ExerciseDifficultySchema,
  ExerciseObjectiveSchema,
  TrainingModeSchema,
} from '@flowment/domain';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ExerciseBriefSchema = z.object({
  id: z.string(),
  title: z.string(),
  difficulty: ExerciseDifficultySchema,
  mode: TrainingModeSchema,
  prompt: z.string(),
  learningObjectives: z.array(ExerciseObjectiveSchema),
});

export const ExerciseListSchema = z.object({
  items: z.array(ExerciseBriefSchema),
});

export type ExerciseBrief = z.output<typeof ExerciseBriefSchema>;
export type ExerciseList = z.output<typeof ExerciseListSchema>;

export class ExerciseDto extends createZodDto(ExerciseBriefSchema, {
  codec: true,
}) {}
export class ExerciseListDto extends createZodDto(ExerciseListSchema, {
  codec: true,
}) {}
