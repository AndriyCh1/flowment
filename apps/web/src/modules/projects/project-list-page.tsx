import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Page } from '../../components/page';
import { Button } from '../../components/ui/button';
import { ErrorMessage } from '../../components/ui/error-message';
import { IconButton } from '../../components/ui/icon-button';
import { Input } from '../../components/ui/input';
import { errorMessage } from '../../shared/api-error';
import { formatTimestamp } from '../../shared/format-timestamp';
import { ProjectNameFormSchema } from './project-form-schemas';
import { useCreateProject, useProjectList } from './project-queries';

const PAGE_SIZE = 20;

export function ProjectListPage() {
  return (
    <Page>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <Link
          to="/exercises"
          className="text-sm font-medium text-zinc-700 hover:underline"
        >
          Practise with an exercise →
        </Link>
      </div>
      <CreateProjectForm />
      <ProjectList />
    </Page>
  );
}

function CreateProjectForm() {
  const navigate = useNavigate();
  const createProject = useCreateProject();
  const {
    register,
    handleSubmit,
    formState: { isValid },
  } = useForm({
    resolver: zodResolver(ProjectNameFormSchema),
    defaultValues: { name: '' },
    mode: 'onChange',
  });

  const submit = handleSubmit((values) =>
    createProject.mutate(values, {
      onSuccess: (project) => navigate(`/projects/${project.id}`),
    }),
  );

  return (
    <form onSubmit={submit} className="mt-6 space-y-2">
      <div className="flex gap-2">
        <Input
          label="Project name"
          placeholder="New project name"
          {...register('name')}
        />
        <Button
          type="submit"
          icon={Plus}
          disabled={!isValid || createProject.isPending}
        >
          Create project
        </Button>
      </div>
      {createProject.isError && (
        <ErrorMessage>{errorMessage(createProject.error)}</ErrorMessage>
      )}
    </form>
  );
}

function ProjectList() {
  const [offset, setOffset] = useState(0);
  const projects = useProjectList({ limit: PAGE_SIZE, offset });

  if (projects.isPending) {
    return <p className="mt-8 text-sm text-zinc-500">Loading projects…</p>;
  }

  if (projects.isError) {
    return (
      <div className="mt-8">
        <ErrorMessage>{errorMessage(projects.error)}</ErrorMessage>
      </div>
    );
  }

  const { items, total } = projects.data;
  if (total === 0) {
    return (
      <p className="mt-8 text-sm text-zinc-500">
        No projects yet. Create one to get started.
      </p>
    );
  }

  return (
    <section aria-label="Project list" className="mt-8">
      <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
        {items.map((project) => (
          <li key={project.id}>
            <Link
              to={`/projects/${project.id}`}
              className="flex items-baseline justify-between gap-4 px-4 py-3 hover:bg-zinc-50"
            >
              <span className="font-medium">{project.name}</span>
              <span className="shrink-0 text-sm text-zinc-500">
                Updated {formatTimestamp(project.updatedAt)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {total > PAGE_SIZE && (
        <nav
          aria-label="Pagination"
          className="mt-4 flex items-center justify-between text-sm text-zinc-600"
        >
          <span>
            {offset + 1}–{offset + items.length} of {total}
          </span>
          <div className="flex gap-2">
            <IconButton
              label="Previous page"
              icon={ChevronLeft}
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
            />
            <IconButton
              label="Next page"
              icon={ChevronRight}
              disabled={offset + PAGE_SIZE >= total}
              onClick={() => setOffset(offset + PAGE_SIZE)}
            />
          </div>
        </nav>
      )}
    </section>
  );
}
