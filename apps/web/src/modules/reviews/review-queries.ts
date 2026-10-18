import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listReviews, submitForReview, type ReviewListDto } from '../../api';

const reviewKeys = {
  list: (projectId: string) => ['reviews', projectId] as const,
};

export function useReviews(projectId: string) {
  return useQuery({
    queryKey: reviewKeys.list(projectId),
    queryFn: async ({ signal }) => {
      const { data } = await listReviews({
        path: { projectId },
        signal,
        throwOnError: true,
      });
      return data;
    },
  });
}

export function useSubmitForReview(projectId: string) {
  const queryClient = useQueryClient();
  const queryKey = reviewKeys.list(projectId);

  return useMutation({
    mutationFn: async () => {
      const { data } = await submitForReview({
        path: { projectId },
        throwOnError: true,
      });
      return data;
    },
    onSuccess: (review) => {
      queryClient.setQueryData<ReviewListDto>(queryKey, (list) =>
        list && !list.items.some(({ id }) => id === review.id)
          ? { items: [review, ...list.items] }
          : list,
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });
}
