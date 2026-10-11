import type { SequenceScenario } from './scenario.js';
import {
  addScenario,
  deleteScenario,
  duplicateScenario,
  replaceScenario,
} from './scenario-editing.js';
import { SystemDesignSchema, type SystemDesign } from './system-design.js';

const upload: SequenceScenario = {
  id: 'upload',
  title: 'Upload',
  description: 'Happy path',
  steps: [
    {
      id: 'request',
      type: 'interaction',
      from: 'client',
      to: 'api',
      text: 'POST /uploads',
      semantics: { operationKind: 'request' },
    },
    { id: 'note', type: 'note', text: 'Wait for lock', componentId: 'api' },
  ],
};

const lookup: SequenceScenario = {
  id: 'lookup',
  title: 'Status lookup',
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

  it('copies description and steps with new step ids', () => {
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

  it('does not change the original scenario', () => {
    const result = duplicateScenario(design, 'upload', 'copy', counter('step'));
    expect(result.scenarios[0]).toBe(upload);
    expect(upload.steps.map((step) => step.id)).toEqual(['request', 'note']);
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
