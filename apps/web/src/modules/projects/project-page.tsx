import { Link, useParams } from 'react-router-dom';
import { ErrorMessage } from '../../components/ui/error-message';
import { errorMessage, isNotFound } from '../../shared/api-error';
import { useProject } from './project-queries';
import { ProjectWorkspace } from './project-workspace';

export function ProjectPage() {
  const { projectId = '' } = useParams();
  const project = useProject(projectId);

  return (
    <main className="flex min-h-full flex-col p-2 lg:h-full">
      {project.isSuccess ? (
        <ProjectWorkspace project={project.data} />
      ) : (
        <div className="space-y-6 p-2">
          <Link
            to="/projects"
            className="text-sm text-zinc-600 hover:underline"
          >
            ← Projects
          </Link>
          {project.isPending ? (
            <p className="text-sm text-zinc-500">Loading project…</p>
          ) : (
            <ErrorMessage>
              {isNotFound(project.error)
                ? 'Project not found.'
                : errorMessage(project.error)}
            </ErrorMessage>
          )}
        </div>
      )}
    </main>
  );
}
