import { ReviewFeedbackSchema, type ReviewFeedback } from './review.js';

const feedback: ReviewFeedback = {
  strongestReasoning: 'Step 3 sends the reportId the Worker needs later.',
  missedIssue: {
    issue: 'The Worker never learns the month.',
    whyItMatters: 'It cannot know which report to write.',
  },
  alternative: 'Put the month in the queue message.',
  nextSkill: 'Information provenance: check where each value comes from.',
};

describe('ReviewFeedbackSchema', () => {
  it('parses a review with every part', () => {
    expect(ReviewFeedbackSchema.parse(feedback)).toEqual(feedback);
  });

  it('allows no missed issue and no alternative', () => {
    const minimal = { ...feedback, missedIssue: null, alternative: null };

    expect(ReviewFeedbackSchema.parse(minimal)).toEqual(minimal);
  });

  it('trims the text', () => {
    expect(
      ReviewFeedbackSchema.parse({
        ...feedback,
        nextSkill: '  Sequencing  ',
      }).nextSkill,
    ).toBe('Sequencing');
  });

  it.each([
    ['strongest reasoning', { strongestReasoning: ' ' }],
    ['next skill', { nextSkill: '' }],
    ['alternative', { alternative: '' }],
    ['missed issue', { missedIssue: { issue: '', whyItMatters: 'Because' } }],
    ['why it matters', { missedIssue: { issue: 'Gap', whyItMatters: ' ' } }],
  ])('rejects a blank %s', (_, change) => {
    expect(
      ReviewFeedbackSchema.safeParse({ ...feedback, ...change }).success,
    ).toBe(false);
  });

  it('rejects a missed issue without why it matters', () => {
    expect(
      ReviewFeedbackSchema.safeParse({
        ...feedback,
        missedIssue: { issue: 'Gap', whyItMatters: null },
      }).success,
    ).toBe(false);
  });
});
