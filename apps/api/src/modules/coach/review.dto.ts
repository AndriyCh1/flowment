import { MissedIssueSchema } from '@flowment/domain';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { isoDate, nullableString } from '../../shared/zod/openapi-helpers';

export const ReviewSchema = z.object({
  id: z.uuid(),
  designRevision: z.string(),
  createdAt: isoDate,
  strongestReasoning: z.string(),
  missedIssue: MissedIssueSchema.nullable(),
  alternative: nullableString(),
  nextSkill: z.string(),
});

export const ReviewListSchema = z.object({
  items: z.array(ReviewSchema),
});

export type Review = z.output<typeof ReviewSchema>;
export type ReviewList = z.output<typeof ReviewListSchema>;

export class ReviewDto extends createZodDto(ReviewSchema, {
  codec: true,
}) {}
export class ReviewListDto extends createZodDto(ReviewListSchema, {
  codec: true,
}) {}
