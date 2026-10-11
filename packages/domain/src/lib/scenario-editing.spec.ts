import type { SequenceScenario } from './scenario.js';
import {
  addInitialFact,
  addScenario,
  deleteScenario,
  duplicateScenario,
  hasInitialFact,
  removeInitialFact,
  replaceScenario,
} from './scenario-editing.js';
import { SystemDesignSchema, type SystemDesign } from './system-design.js';

const upload: SequenceScenario = {
  id: 'upload',
  title: 'Upload',
  description: 'Happy path',
  initialFacts: [
    { componentId: 'client', fact: 'selectedFile' },
    { componentId: 'api', fact: 'signingKey' },
  ],
  steps: [
    {
      id: 'request',
      type: 'interaction',
      from: 'client',
      to: 'api',
      text: 'POST /uploads',
      semantics: { uses: ['selectedFile'], operationKind: 'request' },
    },
    { id: 'note', type: 'note', text: 'Wait for lock', componentId: 'api' },
  ],
};

const lookup: SequenceScenario = {
  id: 'lookup',
  title: 'Status lookup',
  initialFacts: [],
  steps: [],
};

const design: SystemDesign = {
  components: [
    { id: 'client', name: 'Client' },
    { id: 'api', name: 'API' },
  ],
  scenarios: [upload, lookup],
  assumptions: [],
};

const scenarioIds = (value: SystemDesign) =>
  value.scenarios.map((scenario) => scenario.id);

function counter(prefix: string): () => string {
  let next = 0;
  return () => `${prefix}-${++next}`;
}

describe('addScenario', () => {
  const retry: SequenceScenario = {
    id: 'retry',
    title: 'Retry',
    initialFacts: [],
    steps: [],
  };

  it('appends the scenario and shares the existing components', () => {
    const result = addScenario(design, retry);
    expect(scenarioIds(result)).toEqual(['upload', 'lookup', 'retry']);
    expect(result.components).toBe(design.components);
    expect(SystemDesignSchema.safeParse(result).success).toBe(true);
  });

  it('does not change the original design', () => {
    addScenario(design, retry);
    expect(scenarioIds(design)).toEqual(['upload', 'lookup']);
  });
});

describe('replaceScenario', () => {
  it('replaces the scenario with the same id and keeps the design valid', () => {
    const edited = {
      ...upload,
      title: 'Upload a file',
      description: undefined,
    };
    const result = replaceScenario(design, edited);
    expect(result.scenarios).toEqual([edited, lookup]);
    expect(SystemDesignSchema.safeParse(result).success).toBe(true);
  });

  it('rejects an unknown scenario', () => {
    expect(() => replaceScenario(design, { ...upload, id: 'missing' })).toThrow(
      'Unknown scenario "missing"',
    );
  });
});

describe('duplicateScenario', () => {
  it('inserts the copy right after the original', () => {
    const result = duplicateScenario(design, 'upload', 'copy', counter('step'));
    expect(scenarioIds(result)).toEqual(['upload', 'copy', 'lookup']);
  });

  it('copies description, initial facts and steps with new step ids', () => {
    const result = duplicateScenario(design, 'upload', 'copy', counter('step'));
    expect(result.scenarios[1]).toEqual({
      ...upload,
      id: 'copy',
      title: 'Upload (copy)',
      steps: [
        { ...upload.steps[0], id: 'step-1' },
        { ...upload.steps[1], id: 'step-2' },
      ],
    });
    expect(SystemDesignSchema.safeParse(result).success).toBe(true);
  });

  it('keeps a blank title blank', () => {
    const untitled = replaceScenario(design, { ...lookup, title: ' ' });
    const result = duplicateScenario(
      untitled,
      'lookup',
      'copy',
      counter('step'),
    );
    expect(result.scenarios[2].title).toBe(' ');
  });

  it('does not share the initial facts with the original', () => {
    const result = duplicateScenario(design, 'upload', 'copy', counter('step'));
    expect(result.scenarios[1].initialFacts).not.toBe(upload.initialFacts);
    expect(result.scenarios[1].initialFacts[0]).not.toBe(
      upload.initialFacts[0],
    );
    expect(result.scenarios[0]).toBe(upload);
  });

  it('rejects an unknown scenario', () => {
    expect(() =>
      duplicateScenario(design, 'missing', 'copy', counter('step')),
    ).toThrow('Unknown scenario "missing"');
  });
});

describe('deleteScenario', () => {
  it('removes only the given scenario and keeps the components', () => {
    const result = deleteScenario(design, 'upload');
    expect(scenarioIds(result)).toEqual(['lookup']);
    expect(result.components).toBe(design.components);
  });

  it('can remove the last scenario', () => {
    const result = deleteScenario(deleteScenario(design, 'upload'), 'lookup');
    expect(result.scenarios).toEqual([]);
    expect(SystemDesignSchema.safeParse(result).success).toBe(true);
  });

  it('rejects an unknown scenario', () => {
    expect(() => deleteScenario(design, 'missing')).toThrow(
      'Unknown scenario "missing"',
    );
  });
});

describe('hasInitialFact', () => {
  it('matches the same component and fact, ignoring case and outer spaces', () => {
    expect(
      hasInitialFact(upload, { componentId: 'client', fact: 'selectedFile' }),
    ).toBe(true);
    expect(
      hasInitialFact(upload, { componentId: 'client', fact: ' SELECTEDFILE ' }),
    ).toBe(true);
  });

  it('does not match the fact on another component or a different fact', () => {
    expect(
      hasInitialFact(upload, { componentId: 'api', fact: 'selectedFile' }),
    ).toBe(false);
    expect(
      hasInitialFact(upload, { componentId: 'client', fact: 'selected' }),
    ).toBe(false);
  });
});

describe('addInitialFact', () => {
  it('appends the fact with its original spelling', () => {
    const result = addInitialFact(upload, {
      componentId: 'client',
      fact: 'authenticatedUser',
    });
    expect(result.initialFacts).toEqual([
      ...upload.initialFacts,
      { componentId: 'client', fact: 'authenticatedUser' },
    ]);
    expect(result.steps).toBe(upload.steps);
  });

  it('does not change the original scenario', () => {
    addInitialFact(upload, {
      componentId: 'client',
      fact: 'authenticatedUser',
    });
    expect(upload.initialFacts).toHaveLength(2);
  });
});

describe('removeInitialFact', () => {
  it('removes only the fact at the given position', () => {
    expect(removeInitialFact(upload, 0).initialFacts).toEqual([
      { componentId: 'api', fact: 'signingKey' },
    ]);
    expect(removeInitialFact(upload, 1).initialFacts).toEqual([
      { componentId: 'client', fact: 'selectedFile' },
    ]);
  });

  it('rejects a position outside the list', () => {
    expect(() => removeInitialFact(upload, 2)).toThrow(RangeError);
    expect(() => removeInitialFact(upload, -1)).toThrow(RangeError);
    expect(() => removeInitialFact(upload, 0.5)).toThrow(RangeError);
  });
});
