import { designRevision } from './design-revision.js';
import { insertStep } from './sequence-editing.js';
import type { SystemDesign } from './system-design.js';

const design: SystemDesign = {
  components: [
    { id: 'client', name: 'Client', kind: 'client' },
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
      ],
    },
  ],
  assumptions: [
    { id: 'a1', statement: 'Clients retry on timeout', status: 'assumed' },
  ],
};

const emptyDesign: SystemDesign = {
  components: [],
  scenarios: [],
  assumptions: [],
};

describe('designRevision', () => {
  it('is the same for equal designs', () => {
    expect(designRevision(design)).toBe(
      designRevision(structuredClone(design)),
    );
  });

  it('ignores key order', () => {
    const reordered = {
      assumptions: [
        { status: 'assumed', statement: 'Clients retry on timeout', id: 'a1' },
      ],
      scenarios: [
        {
          steps: [
            {
              text: 'POST /uploads',
              to: 'api',
              from: 'client',
              type: 'interaction',
              id: 'request',
            },
          ],
          title: 'Upload',
          id: 'upload',
        },
      ],
      components: [
        { kind: 'client', name: 'Client', id: 'client' },
        { name: 'API', id: 'api' },
      ],
    } as SystemDesign;

    expect(designRevision(reordered)).toBe(designRevision(design));
  });

  it('ignores keys the schema does not know', () => {
    const withLeftovers = {
      ...design,
      scenarios: design.scenarios.map((scenario) => ({
        ...scenario,
        initialFacts: [],
      })),
    };

    expect(designRevision(withLeftovers)).toBe(designRevision(design));
  });

  it('treats an absent optional field like an undefined one', () => {
    const withUndefined: SystemDesign = {
      ...design,
      components: [
        { id: 'client', name: 'Client', kind: 'client' },
        { id: 'api', name: 'API', responsibility: undefined },
      ],
    };

    expect(designRevision(withUndefined)).toBe(designRevision(design));
  });

  it('changes when a step is added', () => {
    const [scenario] = design.scenarios;
    const edited: SystemDesign = {
      ...design,
      scenarios: [
        insertStep(scenario, { id: 'note', type: 'note', text: 'Wait' }, 1),
      ],
    };

    expect(designRevision(edited)).not.toBe(designRevision(design));
  });

  it('changes when step text changes', () => {
    const edited = structuredClone(design);
    edited.scenarios[0].steps[0].text = 'PUT /uploads';

    expect(designRevision(edited)).not.toBe(designRevision(design));
  });

  it('changes when components are reordered', () => {
    const edited: SystemDesign = {
      ...design,
      components: [...design.components].reverse(),
    };

    expect(designRevision(edited)).not.toBe(designRevision(design));
  });

  it('gives an empty design a revision', () => {
    expect(designRevision(emptyDesign)).toMatch(/^[0-9a-f]{8}$/);
  });

  it('throws for an invalid design', () => {
    const broken: SystemDesign = {
      ...design,
      scenarios: [
        {
          id: 'upload',
          title: 'Upload',
          steps: [
            {
              id: 'request',
              type: 'interaction',
              from: 'client',
              to: 'ghost',
              text: 'POST /uploads',
            },
          ],
        },
      ],
    };

    expect(() => designRevision(broken)).toThrow();
  });
});
