import { Link, useParams } from 'react-router-dom';
import { Page } from '../../components/page';
import { ErrorMessage } from '../../components/ui/error-message';
import { errorMessage, isNotFound } from '../../shared/api-error';
import { useProject } from './project-queries';
import { ProjectWorkspace } from './project-workspace';

export function ProjectPage() {
  const { projectId = '' } = useParams();
  const project = useProject(projectId);

  return (
    <Page width="full">
      <Link to="/projects" className="text-sm text-zinc-600 hover:underline">
        ← Projects
      </Link>
      {project.isPending ? (
        <p className="mt-6 text-sm text-zinc-500">Loading project…</p>
      ) : project.isError ? (
        <div className="mt-6">
          <ErrorMessage>
            {isNotFound(project.error)
              ? 'Project not found.'
              : errorMessage(project.error)}
          </ErrorMessage>
        </div>
      ) : (
        <ProjectWorkspace project={project.data} />
      )}
    </Page>
  );
}
