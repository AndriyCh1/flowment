import { useMutation, useQuery } from '@tanstack/react-query';
import { getExercise, listExercises, startExercise } from '../../api';

const exerciseKeys = {
  list: () => ['exercises', 'list'] as const,
  detail: (id: string) => ['exercises', 'detail', id] as const,
};

export function useExerciseList() {
  return useQuery({
    queryKey: exerciseKeys.list(),
    queryFn: async ({ signal }) => {
      const { data } = await listExercises({ signal, throwOnError: true });
      return data;
    },
    staleTime: Infinity,
  });
}

export function useExercise(id: string) {
  return useQuery({
    queryKey: exerciseKeys.detail(id),
    queryFn: async ({ signal }) => {
      const { data } = await getExercise({
        path: { exerciseId: id },
        signal,
        throwOnError: true,
      });
      return data;
    },
    staleTime: Infinity,
  });
}

export function useStartExercise() {
  return useMutation({
    mutationFn: async (exerciseId: string) => {
      const { data } = await startExercise({
        path: { exerciseId },
        throwOnError: true,
      });
      return data;
    },
  });
}
