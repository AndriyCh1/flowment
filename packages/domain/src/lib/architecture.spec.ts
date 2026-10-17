import { deriveArchitecture } from './architecture.js';
import type { SequenceStep } from './scenario.js';
import type { SystemDesign } from './system-design.js';

const components: SystemDesign['components'] = [
  { id: 'api', name: 'API' },
  { id: 'queue', name: 'Queue' },
  { id: 'worker', name: 'Worker' },
  { id: 'db', name: 'Job DB' },
  { id: 'storage', name: 'Storage' },
];

function interaction(id: string, from: string, to: string): SequenceStep {
  return { id, type: 'interaction', from, to, text: id };
}

function design(
  scenarios: SystemDesign['scenarios'],
  designComponents = components,
): SystemDesign {
  return { components: designComponents, scenarios, assumptions: [] };
}

describe('deriveArchitecture', () => {
  it('has no relationships for a design without interactions', () => {
    expect(deriveArchitecture(design([]))).toEqual({
      relationships: [],
      unconnectedComponentIds: ['api', 'queue', 'worker', 'db', 'storage'],
    });
  });

  it('turns an interaction into a relationship', () => {
    const { relationships } = deriveArchitecture(
      design([
        {
          id: 'upload',
          title: 'Upload',
          steps: [interaction('s1', 'api', 'queue')],
        },
      ]),
    );

    expect(relationships).toEqual([
      {
        id: JSON.stringify(['api', 'queue']),
        componentIds: ['api', 'queue'],
        interactionCount: 1,
        directions: [{ from: 'api', to: 'queue', interactionCount: 1 }],
        scenarios: [{ scenarioId: 'upload', steps: [{ id: 's1', number: 1 }] }],
      },
    ]);
  });

  it('merges repeated interactions across scenarios and counts them', () => {
    const { relationships } = deriveArchitecture(
      design([
        {
          id: 'upload',
          title: 'Upload',
          steps: [
            interaction('s1', 'worker', 'db'),
            interaction('s2', 'worker', 'storage'),
            interaction('s3', 'worker', 'db'),
          ],
        },
        { id: 'empty', title: 'Empty', steps: [] },
        {
          id: 'retry',
          title: 'Retry',
          steps: [interaction('r1', 'worker', 'db')],
        },
      ]),
    );

    expect(relationships[0]).toMatchObject({
      componentIds: ['worker', 'db'],
      interactionCount: 3,
      directions: [{ from: 'worker', to: 'db', interactionCount: 3 }],
      scenarios: [
        {
          scenarioId: 'upload',
          steps: [
            { id: 's1', number: 1 },
            { id: 's3', number: 3 },
          ],
        },
        { scenarioId: 'retry', steps: [{ id: 'r1', number: 1 }] },
      ],
    });
    expect(relationships).toHaveLength(2);
  });

  it('treats both directions between two components as one relationship', () => {
    const { relationships } = deriveArchitecture(
      design([
        {
          id: 'upload',
          title: 'Upload',
          steps: [
            interaction('s1', 'worker', 'db'),
            interaction('s2', 'db', 'worker'),
            interaction('s3', 'worker', 'db'),
          ],
        },
      ]),
    );

    expect(relationships).toEqual([
      expect.objectContaining({
        componentIds: ['worker', 'db'],
        interactionCount: 3,
        directions: [
          { from: 'worker', to: 'db', interactionCount: 2 },
          { from: 'db', to: 'worker', interactionCount: 1 },
        ],
      }),
    ]);
  });

  it('ignores notes and self-interactions', () => {
    const architecture = deriveArchitecture(
      design([
        {
          id: 'upload',
          title: 'Upload',
          steps: [
            { id: 'n1', type: 'note', text: 'Time passes', componentId: 'api' },
            interaction('s1', 'worker', 'worker'),
            interaction('s2', 'api', 'queue'),
          ],
        },
      ]),
    );

    expect(
      architecture.relationships.map(({ componentIds }) => componentIds),
    ).toEqual([['api', 'queue']]);
    expect(architecture.unconnectedComponentIds).toEqual([
      'worker',
      'db',
      'storage',
    ]);
  });

  it('lists relationships in the order they first appear', () => {
    const { relationships } = deriveArchitecture(
      design([
        {
          id: 'status',
          title: 'Status',
          steps: [interaction('s1', 'api', 'db')],
        },
        {
          id: 'upload',
          title: 'Upload',
          steps: [
            interaction('u1', 'api', 'queue'),
            interaction('u2', 'db', 'api'),
            interaction('u3', 'queue', 'worker'),
          ],
        },
      ]),
    );

    expect(relationships.map(({ componentIds }) => componentIds)).toEqual([
      ['api', 'db'],
      ['api', 'queue'],
      ['queue', 'worker'],
    ]);
  });

  it('keeps the steps numbered by their position in the scenario', () => {
    const { relationships } = deriveArchitecture(
      design([
        {
          id: 'upload',
          title: 'Upload',
          steps: [
            { id: 'n1', type: 'note', text: 'Start' },
            interaction('s1', 'api', 'queue'),
          ],
        },
      ]),
    );

    expect(relationships[0].scenarios).toEqual([
      { scenarioId: 'upload', steps: [{ id: 's1', number: 2 }] },
    ]);
  });

  it('does not change the design', () => {
    const original = design([
      {
        id: 'upload',
        title: 'Upload',
        steps: [interaction('s1', 'api', 'queue')],
      },
    ]);
    const copy = structuredClone(original);

    deriveArchitecture(original);

    expect(original).toEqual(copy);
  });
});
