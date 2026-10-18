import { z } from 'zod';

const ReviewTextSchema = z.string().trim().min(1);

export const MissedIssueSchema = z.object({
  issue: ReviewTextSchema,
  whyItMatters: ReviewTextSchema,
});

export type MissedIssue = z.infer<typeof MissedIssueSchema>;

export const ReviewFeedbackSchema = z.object({
  strongestReasoning: ReviewTextSchema,
  missedIssue: MissedIssueSchema.nullable(),
  alternative: ReviewTextSchema.nullable(),
  nextSkill: ReviewTextSchema,
});

export type ReviewFeedback = z.infer<typeof ReviewFeedbackSchema>;
