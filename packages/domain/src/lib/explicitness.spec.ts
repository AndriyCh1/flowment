import { findUnlabeledInteractions } from './explicitness.js';
import type { SystemDesign } from './system-design.js';

const design: SystemDesign = {
  components: [
    { id: 'api', name: 'API' },
    { id: 'worker', name: 'Worker' },
  ],
  scenarios: [
    {
      id: 'upload',
      title: 'Upload',
      steps: [
        {
          id: 's1',
          type: 'interaction',
          from: 'api',
          to: 'worker',
          text: 'Process job 42',
        },
        { id: 's2', type: 'note', text: '' },
        { id: 's3', type: 'interaction', from: 'worker', to: 'api', text: '' },
      ],
    },
    {
      id: 'retry',
      title: 'Retry',
      steps: [
        {
          id: 'r1',
          type: 'interaction',
          from: 'worker',
          to: 'worker',
          text: '   ',
        },
      ],
    },
  ],
  assumptions: [],
};

describe('findUnlabeledInteractions', () => {
  it('finds interactions with blank text in design order, numbered by position', () => {
    expect(findUnlabeledInteractions(design)).toEqual([
      {
        scenarioId: 'upload',
        step: design.scenarios[0].steps[2],
        number: 3,
      },
      {
        scenarioId: 'retry',
        step: design.scenarios[1].steps[0],
        number: 1,
      },
    ]);
  });

  it('ignores notes and labeled interactions', () => {
    const labeled: SystemDesign = {
      ...design,
      scenarios: [design.scenarios[0]].map((scenario) => ({
        ...scenario,
        steps: scenario.steps.slice(0, 2),
      })),
    };

    expect(findUnlabeledInteractions(labeled)).toEqual([]);
  });

  it('finds nothing in a design without scenarios', () => {
    expect(
      findUnlabeledInteractions({ ...design, scenarios: [] }),
    ).toEqual([]);
  });
});
