import {
  CoachOutputSchema,
  CoachTurnSchema,
  ModelingIntentSchema,
  MODELING_INTENT_MAX_LENGTH,
  ObjectiveEvaluationSchema,
  coachOutputText,
  coachStageAfter,
  designStepIds,
  findCoachQuestion,
  initialCoachStage,
  knownStepIds,
  type CoachOutput,
  type CoachTurn,
} from './coach.js';
import type { SystemDesign } from './system-design.js';

const design: SystemDesign = {
  components: [
    { id: 'client', name: 'Client' },
    { id: 'api', name: 'API' },
  ],
  scenarios: [
    {
      id: 'upload',
      title: 'Upload',
      steps: [
        {
          id: 'request',
          type: 'interaction',
          from: 'client',
          to: 'api',
          text: 'POST /uploads',
        },
        { id: 'note', type: 'note', text: 'Wait for lock' },
      ],
    },
    {
      id: 'lookup',
      title: 'Status lookup',
      steps: [
        {
          id: 'status',
          type: 'interaction',
          from: 'client',
          to: 'api',
          text: 'GET /status',
        },
      ],
    },
  ],
  assumptions: [],
};

const emptyDesign: SystemDesign = {
  components: [],
  scenarios: [],
  assumptions: [],
};

const question: CoachOutput = {
  type: 'question',
  questionId: 'q1',
  purpose: 'clarify',
  text: 'Which flow first?',
};

describe('CoachOutputSchema', () => {
  it('accepts each output type', () => {
    const outputs: CoachOutput[] = [
      { ...question, relatedStepIds: ['request'] },
      {
        type: 'next-action',
        action: 'create-component',
        text: 'Add the component that receives the request.',
      },
      {
        type: 'objective-satisfied',
        evidence: ['Step 2 loads the job'],
        summary: 'The worker obtains the file location.',
      },
    ];

    for (const output of outputs) {
      expect(CoachOutputSchema.parse(output)).toEqual(output);
    }
  });

  it('rejects a question without an id', () => {
    const { questionId: _omitted, ...withoutId } = question;

    expect(CoachOutputSchema.safeParse(withoutId).success).toBe(false);
  });

  it('rejects an unknown purpose or action', () => {
    expect(
      CoachOutputSchema.safeParse({ ...question, purpose: 'criticise' })
        .success,
    ).toBe(false);
    expect(
      CoachOutputSchema.safeParse({
        type: 'next-action',
        action: 'redesign-system',
        text: 'x',
      }).success,
    ).toBe(false);
  });

  it('rejects empty question text', () => {
    expect(CoachOutputSchema.safeParse({ ...question, text: '' }).success).toBe(
      false,
    );
  });
});

describe('ObjectiveEvaluationSchema', () => {
  it('accepts each status', () => {
    const evaluations = [
      { status: 'satisfied', evidence: ['step 2'], summary: 'Done' },
      { status: 'unsatisfied', evidence: [], gap: 'No lookup step' },
      { status: 'indeterminate', reason: 'No steps yet' },
    ];

    for (const evaluation of evaluations) {
      expect(ObjectiveEvaluationSchema.parse(evaluation)).toEqual(evaluation);
    }
  });

  it('rejects an unsatisfied evaluation without a gap', () => {
    expect(
      ObjectiveEvaluationSchema.safeParse({
        status: 'unsatisfied',
        evidence: [],
      }).success,
    ).toBe(false);
  });
});

describe('CoachTurnSchema', () => {
  it('accepts learner and coach turns', () => {
    const turns: CoachTurn[] = [
      {
        id: 't1',
        role: 'coach',
        createdAt: '2026-10-11T10:00:00.000Z',
        output: question,
      },
      {
        id: 't2',
        role: 'learner',
        createdAt: '2026-10-11T10:01:00.000Z',
        kind: 'answer',
        text: 'Sending a notification',
        relatedQuestionId: 'q1',
      },
    ];

    for (const turn of turns) {
      expect(CoachTurnSchema.parse(turn)).toEqual(turn);
    }
  });

  it('rejects a learner turn that names no question', () => {
    expect(
      CoachTurnSchema.safeParse({
        id: 't2',
        role: 'learner',
        createdAt: '2026-10-11T10:01:00.000Z',
        kind: 'answer',
        text: 'x',
      }).success,
    ).toBe(false);
  });
});

describe('ModelingIntentSchema', () => {
  it('trims the description', () => {
    expect(ModelingIntentSchema.parse('  A URL shortener \n')).toBe(
      'A URL shortener',
    );
  });

  it('allows an empty description', () => {
    expect(ModelingIntentSchema.parse('   ')).toBe('');
  });

  it('rejects a description over the limit', () => {
    expect(
      ModelingIntentSchema.safeParse('x'.repeat(MODELING_INTENT_MAX_LENGTH + 1))
        .success,
    ).toBe(false);
  });
});

describe('initialCoachStage', () => {
  it('starts an open project in discovery', () => {
    expect(initialCoachStage('open-project')).toBe('discovering');
  });

  it('starts an exercise in guidance', () => {
    expect(initialCoachStage('exercise')).toBe('guiding');
  });
});

describe('coachStageAfter', () => {
  it('maps each question purpose to its stage', () => {
    expect(coachStageAfter({ ...question, purpose: 'discover' })).toBe(
      'discovering',
    );
    expect(coachStageAfter({ ...question, purpose: 'clarify' })).toBe(
      'clarifying',
    );
    expect(coachStageAfter({ ...question, purpose: 'guide' })).toBe('guiding');
    expect(coachStageAfter({ ...question, purpose: 'review' })).toBe(
      'reviewing',
    );
  });

  it('treats a suggested action as guidance', () => {
    expect(
      coachStageAfter({
        type: 'next-action',
        action: 'add-step',
        text: 'Write the first interaction.',
      }),
    ).toBe('guiding');
  });

  it('reaches the objective only on a satisfied objective', () => {
    expect(
      coachStageAfter({
        type: 'objective-satisfied',
        evidence: [],
        summary: 'Done',
      }),
    ).toBe('objective-reached');
  });
});

describe('coachOutputText', () => {
  it('returns the text of a question or action', () => {
    expect(coachOutputText(question)).toBe('Which flow first?');
  });

  it('returns the summary of a satisfied objective', () => {
    expect(
      coachOutputText({
        type: 'objective-satisfied',
        evidence: [],
        summary: 'Done',
      }),
    ).toBe('Done');
  });
});

describe('findCoachQuestion', () => {
  const turns: CoachTurn[] = [
    {
      id: 't1',
      role: 'coach',
      createdAt: '2026-10-11T10:00:00.000Z',
      output: question,
    },
    {
      id: 't2',
      role: 'learner',
      createdAt: '2026-10-11T10:01:00.000Z',
      kind: 'skip',
      text: '',
      relatedQuestionId: 'q1',
    },
    {
      id: 't3',
      role: 'coach',
      createdAt: '2026-10-11T10:02:00.000Z',
      output: { type: 'next-action', action: 'add-step', text: 'Add a step.' },
    },
  ];

  it('finds a question by id', () => {
    expect(findCoachQuestion(turns, 'q1')).toEqual(question);
  });

  it('returns undefined for an unknown id', () => {
    expect(findCoachQuestion(turns, 'q2')).toBeUndefined();
  });
});

describe('designStepIds', () => {
  it('collects step ids across scenarios', () => {
    expect([...designStepIds(design)]).toEqual(['request', 'note', 'status']);
  });

  it('is empty for an empty design', () => {
    expect(designStepIds(emptyDesign).size).toBe(0);
  });
});

describe('knownStepIds', () => {
  it('keeps only ids of steps in the design, in the given order', () => {
    expect(knownStepIds(design, ['status', 'imaginary', 'request'])).toEqual([
      'status',
      'request',
    ]);
  });

  it('drops repeated ids', () => {
    expect(knownStepIds(design, ['request', 'request'])).toEqual(['request']);
  });

  it('keeps nothing for an empty design', () => {
    expect(knownStepIds(emptyDesign, ['request'])).toEqual([]);
  });
});
