import { designRevision, type SystemDesign } from '@flowment/domain';
import { ClipboardCheck } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { ErrorMessage } from '../../components/ui/error-message';
import { errorMessage } from '../../shared/api-error';
import { useReviews, useSubmitForReview } from './review-queries';
import { ReviewCard } from './review-card';

type ReviewPanelProps = {
  projectId: string;
  design: SystemDesign;
  designSaving: boolean;
};

export function ReviewPanel({
  projectId,
  design,
  designSaving,
}: ReviewPanelProps) {
  const reviews = useReviews(projectId);
  const submit = useSubmitForReview(projectId);
  const currentRevision = designRevision(design);
  const emptyDesign =
    design.components.length === 0 && design.scenarios.length === 0;

  const items = reviews.data?.items ?? [];
  const [latest, ...earlier] = items;
  const reviewedAsIs = items.some(
    (review) => review.designRevision === currentRevision,
  );

  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-500">
        Submit at any point for direct feedback on your work. You can keep
        working and submit again.
      </p>
      {reviews.isPending ? (
        <p className="text-sm text-zinc-500">Loading reviews…</p>
      ) : reviews.isError ? (
        <ErrorMessage>{errorMessage(reviews.error)}</ErrorMessage>
      ) : (
        <>
          {emptyDesign ? (
            <p className="text-sm text-zinc-500">
              Add a component or a scenario to submit your design for review.
            </p>
          ) : reviewedAsIs ? (
            <p className="text-sm text-zinc-500">
              Your current design has been reviewed. Change it to submit again.
            </p>
          ) : (
            <Button
              icon={ClipboardCheck}
              disabled={submit.isPending || designSaving}
              onClick={() => submit.mutate()}
            >
              Submit for review
            </Button>
          )}
          {submit.isPending && (
            <p aria-live="polite" className="text-sm text-zinc-500">
              Reviewing your work…
            </p>
          )}
          {submit.isError && (
            <ErrorMessage>{errorMessage(submit.error)}</ErrorMessage>
          )}
          {latest && (
            <ReviewCard
              review={latest}
              current={latest.designRevision === currentRevision}
            />
          )}
          {earlier.length > 0 && (
            <details className="space-y-2">
              <summary className="cursor-pointer text-sm font-medium text-zinc-700">
                Earlier reviews ({earlier.length})
              </summary>
              <div className="mt-2 space-y-2">
                {earlier.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    current={review.designRevision === currentRevision}
                  />
                ))}
              </div>
            </details>
          )}
        </>
      )}
    </div>
  );
}
