import type { ReactNode } from 'react';
import type { ReviewDto } from '../../api';
import { formatTimestamp } from '../../shared/format-timestamp';

type ReviewCardProps = {
  review: ReviewDto;
  current: boolean;
};

function ReviewPart({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-0.5">
      <h3 className="text-xs font-medium text-indigo-700">{title}</h3>
      {children}
    </div>
  );
}

export function ReviewCard({ review, current }: ReviewCardProps) {
  const { createdAt, strongestReasoning, missedIssue, alternative, nextSkill } =
    review;

  return (
    <article className="space-y-3 rounded-md border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-950">
      <div className="space-y-0.5">
        <p className="text-xs text-indigo-700">
          Reviewed {formatTimestamp(createdAt)}
        </p>
        {!current && (
          <p className="text-xs text-amber-800">
            For an earlier version of your design.
          </p>
        )}
      </div>
      <ReviewPart title="Strongest reasoning">
        <p className="wrap-anywhere whitespace-pre-wrap">
          {strongestReasoning}
        </p>
      </ReviewPart>
      <ReviewPart title="Most important missed issue">
        {missedIssue ? (
          <>
            <p className="wrap-anywhere whitespace-pre-wrap">
              {missedIssue.issue}
            </p>
            <p className="pt-1 text-xs font-medium text-indigo-700">
              Why it matters
            </p>
            <p className="wrap-anywhere whitespace-pre-wrap">
              {missedIssue.whyItMatters}
            </p>
          </>
        ) : (
          <p>Nothing important was missed.</p>
        )}
      </ReviewPart>
      {alternative && (
        <ReviewPart title="An alternative">
          <p className="wrap-anywhere whitespace-pre-wrap">{alternative}</p>
        </ReviewPart>
      )}
      <ReviewPart title="Next skill to practise">
        <p className="wrap-anywhere whitespace-pre-wrap">{nextSkill}</p>
      </ReviewPart>
    </article>
  );
}
