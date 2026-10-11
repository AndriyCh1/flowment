import {
  addComponent,
  deleteComponent,
  deleteComponentWithReferences,
  findComponentUsages,
  replaceComponent,
} from './component-editing.js';
import type { SequenceScenario } from './scenario.js';
import { SystemDesignSchema, type SystemDesign } from './system-design.js';

const upload: SequenceScenario = {
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
    {
      id: 'validate',
      type: 'interaction',
      from: 'api',
      to: 'api',
      text: 'Validate',
    },
    { id: 'store', type: 'interaction', from: 'api', to: 'db', text: 'Insert' },
    { id: 'api-note', type: 'note', text: 'Holds a lock', componentId: 'api' },
    { id: 'shared-note', type: 'note', text: 'Happy path' },
  ],
};

const lookup: SequenceScenario = {
  id: 'lookup',
  title: 'Status lookup',
  steps: [
    { id: 'read', type: 'interaction', from: 'client', to: 'db', text: 'Read' },
  ],
};

const design: SystemDesign = {
  components: [
    { id: 'client', name: 'Client', kind: 'client' },
    { id: 'api', name: 'API', responsibility: 'Accepts uploads' },
    { id: 'db', name: 'DB' },
    { id: 'queue', name: 'Queue' },
  ],
  scenarios: [upload, lookup],
  assumptions: [
    { id: 'a1', statement: 'Uploads are small', status: 'assumed' },
  ],
};

const componentIds = (value: SystemDesign) =>
  value.components.map((component) => component.id);

const stepIds = (scenario: SequenceScenario) =>
  scenario.steps.map((step) => step.id);

describe('addComponent', () => {
  it('appends the component after the existing ones', () => {
    const result = addComponent(design, { id: 'worker', name: 'Worker' });
    expect(componentIds(result)).toEqual([
      'client',
      'api',
      'db',
      'queue',
      'worker',
    ]);
  });

  it('accepts a component without responsibility or kind', () => {
    const result = addComponent(design, { id: 'worker', name: 'Worker' });
    expect(result.components[4]).toEqual({ id: 'worker', name: 'Worker' });
    expect(SystemDesignSchema.safeParse(result).success).toBe(true);
  });

  it('does not change the original design', () => {
    addComponent(design, { id: 'worker', name: 'Worker' });
    expect(componentIds(design)).toEqual(['client', 'api', 'db', 'queue']);
  });
});

describe('replaceComponent', () => {
  it('replaces the component with the same id in place', () => {
    const edited = {
      id: 'api',
      name: 'Upload API',
      responsibility: 'Validates and stores uploads',
      kind: 'service',
    } as const;
    const result = replaceComponent(design, edited);
    expect(result.components[1]).toEqual(edited);
    expect(componentIds(result)).toEqual(['client', 'api', 'db', 'queue']);
  });

  it('can clear responsibility and kind', () => {
    const result = replaceComponent(design, { id: 'client', name: 'Browser' });
    expect(result.components[0]).toEqual({ id: 'client', name: 'Browser' });
  });

  it('leaves scenarios untouched', () => {
    const result = replaceComponent(design, { id: 'api', name: 'Upload API' });
    expect(result.scenarios).toBe(design.scenarios);
  });

  it('rejects an unknown component', () => {
    expect(() =>
      replaceComponent(design, { id: 'missing', name: 'X' }),
    ).toThrow('Unknown component "missing"');
  });
});

describe('findComponentUsages', () => {
  it('finds sender, receiver, self-interaction and note references', () => {
    expect(findComponentUsages(design, 'api')).toEqual([
      {
        scenario: upload,
        steps: [
          { step: upload.steps[0], index: 0 },
          { step: upload.steps[1], index: 1 },
          { step: upload.steps[2], index: 2 },
          { step: upload.steps[3], index: 3 },
        ],
      },
    ]);
  });

  it('reports every scenario that references the component', () => {
    const usages = findComponentUsages(design, 'client');
    expect(usages.map(({ scenario }) => scenario.id)).toEqual([
      'upload',
      'lookup',
    ]);
    expect(usages[1]).toEqual({
      scenario: lookup,
      steps: [{ step: lookup.steps[0], index: 0 }],
    });
  });

  it('returns nothing for an unreferenced component', () => {
    expect(findComponentUsages(design, 'queue')).toEqual([]);
  });
});

describe('deleteComponent', () => {
  it('removes an unreferenced component', () => {
    const result = deleteComponent(design, 'queue');
    expect(componentIds(result)).toEqual(['client', 'api', 'db']);
    expect(result.scenarios).toBe(design.scenarios);
    expect(SystemDesignSchema.safeParse(result).success).toBe(true);
  });

  it('refuses to remove a component that scenarios still reference', () => {
    expect(() => deleteComponent(design, 'db')).toThrow(
      'Component "db" is still referenced',
    );
  });

  it('rejects an unknown component', () => {
    expect(() => deleteComponent(design, 'missing')).toThrow(
      'Unknown component "missing"',
    );
  });
});

describe('deleteComponentWithReferences', () => {
  it('removes the component and the steps that use it', () => {
    const result = deleteComponentWithReferences(design, 'api');
    expect(componentIds(result)).toEqual(['client', 'db', 'queue']);
    expect(stepIds(result.scenarios[0])).toEqual(['shared-note']);
  });

  it('keeps steps that do not reference the component', () => {
    const result = deleteComponentWithReferences(design, 'api');
    expect(result.scenarios[1]).toEqual(lookup);
    expect(result.assumptions).toBe(design.assumptions);
  });

  it('cleans every scenario and leaves a valid design', () => {
    const result = deleteComponentWithReferences(design, 'client');
    expect(stepIds(result.scenarios[0])).toEqual([
      'validate',
      'store',
      'api-note',
      'shared-note',
    ]);
    expect(stepIds(result.scenarios[1])).toEqual([]);
    expect(SystemDesignSchema.safeParse(result).success).toBe(true);
    expect(findComponentUsages(result, 'client')).toEqual([]);
  });

  it('does not change the original design', () => {
    deleteComponentWithReferences(design, 'api');
    expect(componentIds(design)).toEqual(['client', 'api', 'db', 'queue']);
    expect(stepIds(design.scenarios[0])).toHaveLength(5);
  });

  it('rejects an unknown component', () => {
    expect(() => deleteComponentWithReferences(design, 'missing')).toThrow(
      'Unknown component "missing"',
    );
  });
});
