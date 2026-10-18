import { findMissingStepMarker } from './missing-step.js';
import type { SystemDesign } from './system-design.js';

const marker = {
  id: 'gap',
  type: 'note' as const,
  componentId: 'worker',
  text: '[MISSING STEP]',
};

const design: SystemDesign = {
  components: [
    { id: 'queue', name: 'Queue' },
    { id: 'worker', name: 'Worker' },
  ],
  scenarios: [
    { id: 'other', title: 'Other', steps: [{ ...marker, text: 'Elsewhere' }] },
    {
      id: 'report',
      title: 'Report',
      steps: [
        {
          id: 's1',
          type: 'interaction',
          from: 'queue',
          to: 'worker',
          text: 'Deliver reportId',
        },
        marker,
      ],
    },
  ],
  assumptions: [],
};

const missingStep = { scenarioId: 'report', stepId: 'gap' };

describe('findMissingStepMarker', () => {
  it('finds the marker in its scenario with its step number', () => {
    expect(findMissingStepMarker(design, missingStep)).toEqual({
      scenarioId: 'report',
      step: marker,
      number: 2,
    });
  });

  it('returns null once the marker is removed', () => {
    const withoutMarker: SystemDesign = {
      ...design,
      scenarios: design.scenarios.map((scenario) => ({
        ...scenario,
        steps: scenario.steps.filter(
          (step) => scenario.id !== 'report' || step.id !== 'gap',
        ),
      })),
    };

    expect(findMissingStepMarker(withoutMarker, missingStep)).toBeNull();
  });

  it('returns null once its scenario is removed', () => {
    expect(
      findMissingStepMarker(
        { ...design, scenarios: [design.scenarios[0]] },
        missingStep,
      ),
    ).toBeNull();
  });

  it('returns null when the step is not a note', () => {
    expect(
      findMissingStepMarker(design, { scenarioId: 'report', stepId: 's1' }),
    ).toBeNull();
  });
});
