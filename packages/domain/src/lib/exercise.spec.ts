import {
  ExerciseSchema,
  TRACE_EXPLICITNESS_OBJECTIVE,
  exerciseObjectives,
  type Exercise,
} from './exercise.js';

const exercise: Exercise = {
  id: 'trace-upload',
  title: 'Trace a file upload',
  difficulty: 1,
  mode: 'trace',
  prompt: 'Write the sequence for a successful upload.',
  learningObjectives: [
    { id: 'o1', description: 'The Worker obtains the file location' },
  ],
  startingDesign: {
    components: [
      { id: 'api', name: 'API' },
      { id: 'worker', name: 'Worker' },
    ],
    scenarios: [{ id: 'upload', title: 'Successful upload', steps: [] }],
    assumptions: [],
  },
};

describe('ExerciseSchema', () => {
  it('parses an exercise', () => {
    expect(ExerciseSchema.parse(exercise)).toEqual(exercise);
  });

  it.each(['trace', 'complete', 'repair'])('accepts the %s mode', (mode) => {
    expect(ExerciseSchema.safeParse({ ...exercise, mode }).success).toBe(true);
  });

  it.each(['observe', 'decompose', 'design', 'ambiguous-design'])(
    'rejects the %s mode',
    (mode) => {
      expect(ExerciseSchema.safeParse({ ...exercise, mode }).success).toBe(
        false,
      );
    },
  );

  it.each([0, 4, 1.5])('rejects difficulty %s', (difficulty) => {
    expect(ExerciseSchema.safeParse({ ...exercise, difficulty }).success).toBe(
      false,
    );
  });

  it('requires at least one learning objective', () => {
    expect(
      ExerciseSchema.safeParse({ ...exercise, learningObjectives: [] }).success,
    ).toBe(false);
  });

  it('rejects duplicate objective ids', () => {
    const result = ExerciseSchema.safeParse({
      ...exercise,
      learningObjectives: [
        { id: 'o1', description: 'First' },
        { id: 'o1', description: 'Second' },
      ],
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      expect.objectContaining({
        path: ['learningObjectives', 1, 'id'],
        message: 'Duplicate objective id "o1"',
      }),
    ]);
  });

  it('rejects a starting design with an unknown component', () => {
    const result = ExerciseSchema.safeParse({
      ...exercise,
      startingDesign: {
        ...exercise.startingDesign,
        scenarios: [
          {
            id: 'upload',
            title: 'Successful upload',
            steps: [
              {
                id: 's1',
                type: 'interaction',
                from: 'api',
                to: 'queue',
                text: 'Enqueue job',
              },
            ],
          },
        ],
      },
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual([
      'startingDesign',
      'scenarios',
      0,
      'steps',
      0,
      'to',
    ]);
  });

  it('rejects a blank title or prompt', () => {
    expect(ExerciseSchema.safeParse({ ...exercise, title: '  ' }).success).toBe(
      false,
    );
    expect(ExerciseSchema.safeParse({ ...exercise, prompt: '' }).success).toBe(
      false,
    );
  });
});

describe('trace explicitness objective', () => {
  it('rejects a trace objective that uses the reserved id', () => {
    const result = ExerciseSchema.safeParse({
      ...exercise,
      learningObjectives: [
        { id: TRACE_EXPLICITNESS_OBJECTIVE.id, description: 'Mine' },
      ],
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      expect.objectContaining({ path: ['learningObjectives', 0, 'id'] }),
    ]);
  });

  it('allows the id outside trace exercises', () => {
    expect(
      ExerciseSchema.safeParse({
        ...exercise,
        mode: 'repair',
        learningObjectives: [
          { id: TRACE_EXPLICITNESS_OBJECTIVE.id, description: 'Mine' },
        ],
      }).success,
    ).toBe(true);
  });
});

describe('exerciseObjectives', () => {
  it('puts the explicitness objective first in a trace exercise', () => {
    expect(exerciseObjectives(exercise)).toEqual([
      TRACE_EXPLICITNESS_OBJECTIVE,
      ...exercise.learningObjectives,
    ]);
  });

  it.each(['complete', 'repair'] as const)(
    'uses only the learning objectives in a %s exercise',
    (mode) => {
      expect(exerciseObjectives({ ...exercise, mode })).toEqual(
        exercise.learningObjectives,
      );
    },
  );
});
