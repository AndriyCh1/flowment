import {
  InteractionSemanticsSchema,
  SequenceScenarioSchema,
  SequenceStepSchema,
} from './scenario.js';

const interaction = {
  id: 'step-1',
  type: 'interaction',
  from: 'worker',
  to: 'job-db',
  text: 'Load job using jobId',
} as const;

const note = { id: 'step-2', type: 'note', text: 'Wait for lock' } as const;

describe('SequenceStepSchema', () => {
  it('parses an interaction step', () => {
    expect(SequenceStepSchema.parse(interaction)).toEqual(interaction);
  });

  it('parses a note step with and without a component', () => {
    expect(SequenceStepSchema.parse(note)).toEqual(note);
    expect(SequenceStepSchema.parse({ ...note, componentId: 'worker' })).toEqual({
      ...note,
      componentId: 'worker',
    });
  });

  it('rejects an unknown step type', () => {
    expect(SequenceStepSchema.safeParse({ ...note, type: 'loop' }).success).toBe(false);
  });

  it('requires from, to and text on an interaction', () => {
    for (const field of ['from', 'to', 'text'] as const) {
      const { [field]: _omitted, ...step } = interaction;
      expect(SequenceStepSchema.safeParse(step).success).toBe(false);
    }
  });

  it('allows an interaction from a component to itself', () => {
    const step = { ...interaction, from: 'worker', to: 'worker', text: 'Validate parsed file' };
    expect(SequenceStepSchema.safeParse(step).success).toBe(true);
  });
});

describe('InteractionSemanticsSchema', () => {
  it('accepts every field as optional', () => {
    expect(InteractionSemanticsSchema.parse({})).toEqual({});
  });

  it('parses confirmed semantics', () => {
    const semantics = {
      stateEffects: ['job marked processing'],
      operationKind: 'read',
    };
    expect(InteractionSemanticsSchema.parse(semantics)).toEqual(semantics);
  });

  it('rejects an unknown operation kind', () => {
    expect(InteractionSemanticsSchema.safeParse({ operationKind: 'delete' }).success).toBe(false);
  });

  it('rejects suggestion metadata so only confirmed semantics persist', () => {
    const result = InteractionSemanticsSchema.safeParse({
      operationKind: 'read',
      confidence: 0.8,
    });
    expect(result.success).toBe(false);
  });
});

describe('SequenceScenarioSchema', () => {
  const scenario = {
    id: 'upload',
    title: 'Successful upload',
    steps: [interaction, note],
  };

  it('preserves step order as array order', () => {
    const reversed = { ...scenario, steps: [note, interaction] };
    expect(SequenceScenarioSchema.parse(scenario).steps.map((step) => step.id)).toEqual([
      'step-1',
      'step-2',
    ]);
    expect(SequenceScenarioSchema.parse(reversed).steps.map((step) => step.id)).toEqual([
      'step-2',
      'step-1',
    ]);
  });

  it('rejects duplicate step ids', () => {
    const result = SequenceScenarioSchema.safeParse({
      ...scenario,
      steps: [interaction, { ...note, id: 'step-1' }],
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['steps', 1, 'id']);
  });
});
