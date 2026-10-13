import {
  designRevision,
  type CoachTurn,
  type SystemDesign,
} from '@flowment/domain';
import {
  MAX_CONTEXT_TURNS,
  buildCoachContext,
  type CoachContextSource,
} from './coach-context';

const emptyDesign: SystemDesign = {
  components: [],
  scenarios: [],
  assumptions: [],
};

const design: SystemDesign = {
  components: [
    {
      id: 'c1',
      name: 'Worker',
      kind: 'service',
      responsibility: 'Processes jobs',
    },
    { id: 'c2', name: 'Job DB' },
    { id: 'c3', name: '   ' },
  ],
  scenarios: [
    {
      id: 'processing',
      title: 'Background processing',
      description: 'A job is picked up and processed',
      steps: [
        {
          id: 's1',
          type: 'interaction',
          from: 'c1',
          to: 'c2',
          text: 'Load job using jobId',
        },
        { id: 's2', type: 'note', text: 'Parse the file', componentId: 'c1' },
        { id: 's3', type: 'note', text: 'Some time passes' },
        {
          id: 's4',
          type: 'interaction',
          from: 'c3',
          to: 'c3',
          text: 'Retry',
        },
      ],
    },
    { id: 'failure', title: 'Processing failure', steps: [] },
  ],
  assumptions: [
    { id: 'a1', statement: 'Jobs are delivered once', status: 'assumed' },
    {
      id: 'a2',
      statement: 'Files are under 10 MB',
      status: 'guaranteed',
      evidence: 'Upload limit',
    },
  ],
};

function source(
  overrides: Partial<CoachContextSource> = {},
): CoachContextSource {
  return {
    projectId: 'project-1',
    mode: 'open-project',
    modelingIntent: null,
    turns: [],
    design: emptyDesign,
    selectedScenarioId: null,
    ...overrides,
  };
}

function learnerTurn(index: number): CoachTurn {
  return {
    id: `t${index}`,
    role: 'learner',
    createdAt: '2026-10-11T10:00:00.000Z',
    kind: 'answer',
    text: `answer ${index}`,
    relatedQuestionId: 'q1',
  };
}

describe('buildCoachContext', () => {
  it('serializes an empty project with no description', () => {
    expect(buildCoachContext(source())).toEqual({
      projectId: 'project-1',
      mode: 'open-project',
      designRevision: designRevision(emptyDesign),
      modelingIntent: null,
      components: [],
      scenarios: [],
      assumptions: [],
      conversation: [],
    });
  });

  it('carries the learner description and treats a blank one as missing', () => {
    expect(
      buildCoachContext(source({ modelingIntent: ' A URL shortener ' }))
        .modelingIntent,
    ).toBe('A URL shortener');
    expect(
      buildCoachContext(source({ modelingIntent: '   ' })).modelingIntent,
    ).toBeNull();
  });

  it('lists components without ids and with a fallback name', () => {
    expect(buildCoachContext(source({ design })).components).toEqual([
      { name: 'Worker', kind: 'service', responsibility: 'Processes jobs' },
      { name: 'Job DB' },
      { name: 'Unnamed component' },
    ]);
  });

  it('numbers steps and names their participants', () => {
    const [scenario] = buildCoachContext(source({ design })).scenarios;

    expect(scenario).toEqual({
      id: 'processing',
      title: 'Background processing',
      description: 'A job is picked up and processed',
      selected: false,
      steps: [
        {
          id: 's1',
          number: 1,
          type: 'interaction',
          from: 'Worker',
          to: 'Job DB',
          text: 'Load job using jobId',
        },
        {
          id: 's2',
          number: 2,
          type: 'note',
          component: 'Worker',
          text: 'Parse the file',
        },
        { id: 's3', number: 3, type: 'note', text: 'Some time passes' },
        {
          id: 's4',
          number: 4,
          type: 'interaction',
          from: 'Unnamed component',
          to: 'Unnamed component',
          text: 'Retry',
        },
      ],
    });
  });

  it('marks the selected scenario', () => {
    const { scenarios } = buildCoachContext(
      source({ design, selectedScenarioId: 'failure' }),
    );

    expect(scenarios.map(({ id, selected }) => [id, selected])).toEqual([
      ['processing', false],
      ['failure', true],
    ]);
  });

  it('selects nothing for a scenario that is not in the design', () => {
    const { scenarios } = buildCoachContext(
      source({ design, selectedScenarioId: 'gone' }),
    );

    expect(scenarios.every(({ selected }) => !selected)).toBe(true);
  });

  it('lists assumptions with their status', () => {
    expect(buildCoachContext(source({ design })).assumptions).toEqual([
      { statement: 'Jobs are delivered once', status: 'assumed' },
      {
        statement: 'Files are under 10 MB',
        status: 'guaranteed',
        evidence: 'Upload limit',
      },
    ]);
  });

  it('serializes each kind of turn', () => {
    const turns: CoachTurn[] = [
      {
        id: 't1',
        role: 'coach',
        createdAt: '2026-10-11T10:00:00.000Z',
        output: {
          type: 'question',
          questionId: 'q1',
          purpose: 'clarify',
          text: 'Sending or receiving?',
          relatedStepIds: ['s1'],
        },
      },
      {
        id: 't2',
        role: 'learner',
        createdAt: '2026-10-11T10:01:00.000Z',
        kind: 'unknown',
        text: 'Not sure',
        relatedQuestionId: 'q1',
      },
      {
        id: 't3',
        role: 'coach',
        createdAt: '2026-10-11T10:02:00.000Z',
        output: {
          type: 'next-action',
          action: 'record-assumption',
          text: 'Record an assumption.',
        },
      },
      {
        id: 't4',
        role: 'coach',
        createdAt: '2026-10-11T10:03:00.000Z',
        output: {
          type: 'objective-satisfied',
          evidence: ['step 1'],
          summary: 'Objective reached.',
        },
      },
    ];

    expect(buildCoachContext(source({ turns })).conversation).toEqual([
      {
        role: 'coach',
        kind: 'question',
        purpose: 'clarify',
        text: 'Sending or receiving?',
      },
      { role: 'learner', kind: 'unknown', text: 'Not sure' },
      {
        role: 'coach',
        kind: 'next-action',
        action: 'record-assumption',
        text: 'Record an assumption.',
      },
      {
        role: 'coach',
        kind: 'objective-satisfied',
        text: 'Objective reached.',
      },
    ]);
  });

  it('keeps only the most recent turns', () => {
    const turns = Array.from({ length: MAX_CONTEXT_TURNS + 5 }, (_, index) =>
      learnerTurn(index),
    );

    const { conversation } = buildCoachContext(source({ turns }));

    expect(conversation).toHaveLength(MAX_CONTEXT_TURNS);
    expect(conversation[0]).toMatchObject({ text: 'answer 5' });
    expect(conversation.at(-1)).toMatchObject({
      text: `answer ${MAX_CONTEXT_TURNS + 4}`,
    });
  });

  it('reports the revision of the design it serialized', () => {
    expect(buildCoachContext(source({ design })).designRevision).toBe(
      designRevision(design),
    );
  });
});
