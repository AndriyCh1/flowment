import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getCoachSession,
  replyToCoach,
  requestCoachHint,
  requestCoachResponse,
  resetCoachSession,
  updateModelingIntent,
  type CoachHintRequestDto,
  type CoachNextDto,
  type CoachReplyDto,
  type CoachSessionDto,
} from '../../api';

const coachKeys = {
  session: (projectId: string) => ['coach', 'session', projectId] as const,
};

export function useCoachSession(projectId: string) {
  return useQuery({
    queryKey: coachKeys.session(projectId),
    queryFn: async ({ signal }) => {
      const { data } = await getCoachSession({
        path: { projectId },
        signal,
        throwOnError: true,
      });
      return data;
    },
  });
}

function useCoachMutation<Variables>(
  projectId: string,
  request: (variables: Variables) => Promise<CoachSessionDto>,
) {
  const queryClient = useQueryClient();
  const queryKey = coachKeys.session(projectId);

  return useMutation({
    scope: { id: `projects/${projectId}/coach` },
    mutationFn: request,
    onSuccess: (session) => {
      queryClient.setQueryData(queryKey, session);
    },
    onError: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useSaveModelingIntent(projectId: string) {
  return useCoachMutation(projectId, async (modelingIntent: string) => {
    const { data } = await updateModelingIntent({
      path: { projectId },
      body: { modelingIntent },
      throwOnError: true,
    });
    return data;
  });
}

export function useRequestCoachResponse(projectId: string) {
  return useCoachMutation(projectId, async (body: CoachNextDto) => {
    const { data } = await requestCoachResponse({
      path: { projectId },
      body,
      throwOnError: true,
    });
    return data;
  });
}

export function useRequestCoachHint(projectId: string) {
  return useCoachMutation(projectId, async (body: CoachHintRequestDto) => {
    const { data } = await requestCoachHint({
      path: { projectId },
      body,
      throwOnError: true,
    });
    return data;
  });
}

export function useReplyToCoach(projectId: string) {
  return useCoachMutation(projectId, async (body: CoachReplyDto) => {
    const { data } = await replyToCoach({
      path: { projectId },
      body,
      throwOnError: true,
    });
    return data;
  });
}

export function useResetCoach(projectId: string) {
  return useCoachMutation(projectId, async () => {
    const { data } = await resetCoachSession({
      path: { projectId },
      throwOnError: true,
    });
    return data;
  });
}
