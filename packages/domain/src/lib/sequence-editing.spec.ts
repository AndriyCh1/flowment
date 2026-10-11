import type { InteractionStep, SequenceScenario } from './scenario.js';
import {
  deleteStep,
  duplicateStep,
  insertStep,
  moveStep,
  replaceScenario,
  replaceStep,
} from './sequence-editing.js';
import { SystemDesignSchema, type SystemDesign } from './system-design.js';

const request: InteractionStep = {
  id: 'request',
  type: 'interaction',
  from: 'client',
  to: 'api',
  text: 'POST /uploads',
  semantics: { uses: ['selectedFile'], operationKind: 'request' },
};

const note = { id: 'note', type: 'note', text: 'Wait for lock', componentId: 'api' } as const;

const response = {
  id: 'response',
  type: 'interaction',
  from: 'api',
  to: 'client',
  text: '202 Accepted',
} as const;

const scenario: SequenceScenario = {
  id: 'upload',
  title: 'Upload',
  initialFacts: [],
  steps: [request, note, response],
};

const stepIds = (value: SequenceScenario) => value.steps.map((step) => step.id);

describe('insertStep', () => {
  const added = { id: 'added', type: 'interaction', from: 'api', to: 'api', text: '' } as const;

  it('inserts at the start, between steps and at the end', () => {
    expect(stepIds(insertStep(scenario, added, 0))).toEqual(['added', 'request', 'note', 'response']);
    expect(stepIds(insertStep(scenario, added, 2))).toEqual(['request', 'note', 'added', 'response']);
    expect(stepIds(insertStep(scenario, added, 3))).toEqual(['request', 'note', 'response', 'added']);
  });

  it('inserts an interaction without semantics', () => {
    expect(insertStep(scenario, added, 3).steps[3]).toEqual(added);
  });

  it('does not change the original scenario', () => {
    insertStep(scenario, added, 0);
    expect(stepIds(scenario)).toEqual(['request', 'note', 'response']);
  });

  it('rejects a position outside the sequence', () => {
    expect(() => insertStep(scenario, added, -1)).toThrow(RangeError);
    expect(() => insertStep(scenario, added, 4)).toThrow(RangeError);
    expect(() => insertStep(scenario, added, 1.5)).toThrow(RangeError);
  });
});

describe('replaceStep', () => {
  it('replaces the step with the same id in place', () => {
    const edited = { ...request, from: 'user', text: 'Upload' };
    const result = replaceStep(scenario, edited);
    expect(result.steps).toEqual([edited, note, response]);
  });

  it('can change a note component and text', () => {
    const edited = { id: 'note', type: 'note', text: 'Shared note' } as const;
    expect(replaceStep(scenario, edited).steps[1]).toEqual(edited);
  });

  it('rejects an unknown step', () => {
    expect(() => replaceStep(scenario, { ...note, id: 'missing' })).toThrow(
      'Unknown step "missing"',
    );
  });
});

describe('moveStep', () => {
  it('moves a step up and down', () => {
    expect(stepIds(moveStep(scenario, 'response', 1))).toEqual(['request', 'response', 'note']);
    expect(stepIds(moveStep(scenario, 'request', 1))).toEqual(['note', 'request', 'response']);
  });

  it('moves a step to the start and the end', () => {
    expect(stepIds(moveStep(scenario, 'response', 0))).toEqual(['response', 'request', 'note']);
    expect(stepIds(moveStep(scenario, 'request', 2))).toEqual(['note', 'response', 'request']);
  });

  it('keeps the order when a step moves to its own position', () => {
    expect(stepIds(moveStep(scenario, 'note', 1))).toEqual(['request', 'note', 'response']);
  });

  it('rejects an unknown step or a position outside the sequence', () => {
    expect(() => moveStep(scenario, 'missing', 0)).toThrow('Unknown step "missing"');
    expect(() => moveStep(scenario, 'note', 3)).toThrow(RangeError);
    expect(() => moveStep(scenario, 'note', -1)).toThrow(RangeError);
  });
});

describe('duplicateStep', () => {
  it('inserts a copy with the new id right after the original', () => {
    const result = duplicateStep(scenario, 'request', 'copy');
    expect(stepIds(result)).toEqual(['request', 'copy', 'note', 'response']);
    expect(result.steps[1]).toEqual({ ...request, id: 'copy' });
  });

  it('duplicates the last step and notes', () => {
    expect(stepIds(duplicateStep(scenario, 'response', 'copy'))).toEqual([
      'request',
      'note',
      'response',
      'copy',
    ]);
    expect(duplicateStep(scenario, 'note', 'copy').steps[2]).toEqual({ ...note, id: 'copy' });
  });

  it('rejects an unknown step', () => {
    expect(() => duplicateStep(scenario, 'missing', 'copy')).toThrow('Unknown step "missing"');
  });
});

describe('deleteStep', () => {
  it('removes only the given step', () => {
    expect(stepIds(deleteStep(scenario, 'note'))).toEqual(['request', 'response']);
  });

  it('rejects an unknown step', () => {
    expect(() => deleteStep(scenario, 'missing')).toThrow('Unknown step "missing"');
  });
});

describe('replaceScenario', () => {
  const design: SystemDesign = {
    components: [
      { id: 'client', name: 'Client' },
      { id: 'api', name: 'API' },
    ],
    scenarios: [scenario, { id: 'other', title: 'Other', initialFacts: [], steps: [] }],
    assumptions: [],
  };

  it('replaces the scenario with the same id and keeps the design valid', () => {
    const edited = duplicateStep(moveStep(scenario, 'response', 0), 'note', 'copy');
    const result = replaceScenario(design, edited);
    expect(result.scenarios).toEqual([edited, design.scenarios[1]]);
    expect(SystemDesignSchema.safeParse(result).success).toBe(true);
  });

  it('rejects an unknown scenario', () => {
    expect(() => replaceScenario(design, { ...scenario, id: 'missing' })).toThrow(
      'Unknown scenario "missing"',
    );
  });
});
