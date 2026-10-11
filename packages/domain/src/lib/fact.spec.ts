import { FactSchema, factsMatch, normalizeFact } from './fact.js';

describe('normalizeFact', () => {
  it('trims whitespace and lowercases', () => {
    expect(normalizeFact('  JobId\t')).toBe('jobid');
  });
});

describe('factsMatch', () => {
  it.each([
    ['jobId', 'jobId'],
    ['jobId', 'JobId'],
    ['jobId', ' jobId'],
    [' JOBID ', 'jobid'],
  ])('matches %j and %j', (a, b) => {
    expect(factsMatch(a, b)).toBe(true);
  });

  it('does not match different facts', () => {
    expect(factsMatch('jobId', 'job Id')).toBe(false);
    expect(factsMatch('jobId', 'sourceFileKey')).toBe(false);
  });
});

describe('FactSchema', () => {
  it('keeps the original spelling', () => {
    expect(FactSchema.parse(' JobId ')).toBe(' JobId ');
  });

  it.each(['', '   '])('rejects blank fact %j', (fact) => {
    expect(FactSchema.safeParse(fact).success).toBe(false);
  });
});
