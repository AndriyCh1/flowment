import type { SequenceStep } from './scenario.js';
import { SystemDesignSchema } from './system-design.js';

function design({ steps = [] }: { steps?: SequenceStep[] } = {}) {
  return {
    components: [
      { id: 'client', name: 'Client', kind: 'client' },
      { id: 'api', name: 'API' },
      { id: 'worker', name: 'Worker', responsibility: 'Processes jobs' },
    ],
    scenarios: [{ id: 'upload', title: 'Successful upload', steps }],
    assumptions: [{ id: 'a1', statement: 'Queue delivers at least once', status: 'assumed' }],
  };
}

function issuePaths(input: unknown) {
  const result = SystemDesignSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.path);
}

describe('SystemDesignSchema', () => {
  it('accepts a valid design', () => {
    const input = design({
      steps: [
        { id: 's1', type: 'interaction', from: 'client', to: 'api', text: 'Upload CSV' },
        { id: 's2', type: 'note', text: 'Parse file', componentId: 'api' },
        { id: 's3', type: 'note', text: 'Some time passes' },
      ],
    });
    expect(SystemDesignSchema.parse(input)).toEqual(input);
  });

  it('accepts a self-interaction', () => {
    const input = design({
      steps: [{ id: 's1', type: 'interaction', from: 'worker', to: 'worker', text: 'Validate' }],
    });
    expect(issuePaths(input)).toEqual([]);
  });

  it('rejects an interaction from an unknown component', () => {
    const input = design({
      steps: [{ id: 's1', type: 'interaction', from: 'ghost', to: 'api', text: 'Call' }],
    });
    expect(issuePaths(input)).toEqual([['scenarios', 0, 'steps', 0, 'from']]);
  });

  it('rejects an interaction to an unknown component', () => {
    const input = design({
      steps: [{ id: 's1', type: 'interaction', from: 'client', to: 'ghost', text: 'Call' }],
    });
    expect(issuePaths(input)).toEqual([['scenarios', 0, 'steps', 0, 'to']]);
  });

  it('rejects a note attached to an unknown component', () => {
    const input = design({
      steps: [{ id: 's1', type: 'note', text: 'Retry later', componentId: 'ghost' }],
    });
    expect(issuePaths(input)).toEqual([['scenarios', 0, 'steps', 0, 'componentId']]);
  });

  it('reports every broken reference', () => {
    const input = design({
      steps: [
        { id: 's1', type: 'interaction', from: 'client', to: 'api', text: 'Upload' },
        { id: 's2', type: 'interaction', from: 'ghost', to: 'phantom', text: 'Call' },
        { id: 's3', type: 'note', text: 'Lost', componentId: 'nobody' },
      ],
    });
    expect(issuePaths(input)).toEqual([
      ['scenarios', 0, 'steps', 1, 'from'],
      ['scenarios', 0, 'steps', 1, 'to'],
      ['scenarios', 0, 'steps', 2, 'componentId'],
    ]);
  });

  it('names the unknown component in the message', () => {
    const result = SystemDesignSchema.safeParse(
      design({ steps: [{ id: 's1', type: 'interaction', from: 'ghost', to: 'api', text: 'x' }] }),
    );
    expect(result.error?.issues[0]?.message).toBe('Unknown component "ghost"');
  });

  it.each([
    ['components', { id: 'api', name: 'Second API' }],
    ['scenarios', { id: 'upload', title: 'Copy', steps: [] }],
    ['assumptions', { id: 'a1', statement: 'Copy', status: 'unknown' }],
  ] as const)('rejects duplicate %s ids', (collection, duplicate) => {
    const input = design();
    const items: unknown[] = input[collection];
    items.push(duplicate);
    expect(issuePaths(input)).toEqual([[collection, items.length - 1, 'id']]);
  });

  it('rejects an unknown component kind', () => {
    const input = design();
    input.components[0] = { id: 'client', name: 'Client', kind: 'browser' };
    expect(issuePaths(input)).toEqual([['components', 0, 'kind']]);
  });

  it('rejects an unknown assumption status', () => {
    const input = design();
    input.assumptions[0] = { id: 'a1', statement: 'x', status: 'maybe' };
    expect(issuePaths(input)).toEqual([['assumptions', 0, 'status']]);
  });
});
