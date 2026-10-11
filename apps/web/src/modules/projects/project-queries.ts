import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  createProject,
  getProject,
  listProjects,
  updateProject,
  type CreateProjectDto,
  type ProjectDto,
  type UpdateProjectDto,
} from '../../api';

type Page = { limit: number; offset: number };

const projectKeys = {
  lists: () => ['projects', 'list'] as const,
  list: (page: Page) => ['projects', 'list', page] as const,
  detail: (id: string) => ['projects', 'detail', id] as const,
};

export function useProjectList(page: Page) {
  return useQuery({
    queryKey: projectKeys.list(page),
    queryFn: async ({ signal }) => {
      const { data } = await listProjects({
        query: page,
        signal,
        throwOnError: true,
      });
      return data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: async ({ signal }) => {
      const { data } = await getProject({
        path: { id },
        signal,
        throwOnError: true,
      });
      return data;
    },
  });
}

function useStoreSavedProject() {
  const queryClient = useQueryClient();
  return (project: ProjectDto) => {
    queryClient.setQueryData(projectKeys.detail(project.id), project);
    void queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
  };
}

export function useCreateProject() {
  const storeSavedProject = useStoreSavedProject();
  return useMutation({
    mutationFn: async (body: CreateProjectDto) => {
      const { data } = await createProject({ body, throwOnError: true });
      return data;
    },
    onSuccess: storeSavedProject,
  });
}

export function useUpdateProject(id: string) {
  const storeSavedProject = useStoreSavedProject();
  return useMutation({
    mutationFn: async (body: UpdateProjectDto) => {
      const { data } = await updateProject({
        path: { id },
        body,
        throwOnError: true,
      });
      return data;
    },
    onSuccess: storeSavedProject,
  });
}
