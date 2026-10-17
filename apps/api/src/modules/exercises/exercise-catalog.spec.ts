import { ExerciseSchema, TrainingModeSchema } from '@flowment/domain';
import { EXERCISE_CATALOG } from './exercise-catalog';

describe('EXERCISE_CATALOG', () => {
  it.each(EXERCISE_CATALOG.map((exercise) => [exercise.id, exercise]))(
    'has a valid exercise %s',
    (_id, exercise) => {
      expect(ExerciseSchema.parse(exercise)).toEqual(exercise);
    },
  );

  it('has unique exercise ids', () => {
    const ids = EXERCISE_CATALOG.map(({ id }) => id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has an exercise for every training mode', () => {
    expect(new Set(EXERCISE_CATALOG.map(({ mode }) => mode))).toEqual(
      new Set(TrainingModeSchema.options),
    );
  });
});
