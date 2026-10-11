import type { SystemDesign } from '@flowment/domain';
import { Link, useParams } from 'react-router-dom';
import { Page } from '../../components/page';
import { ErrorMessage } from '../../components/ui/error-message';
import { errorMessage, isNotFound } from '../../shared/api-error';
import { formatTimestamp } from './format-timestamp';
import { ProjectNameForm } from './project-name-form';
import { useProject } from './project-queries';
import { formatSystemDesign } from './system-design-json';
import { SystemDesignEditor } from './system-design-editor';

export function ProjectPage() {
  const { projectId = '' } = useParams();
  const project = useProject(projectId);

  return (
    <Page>
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
        <>
          <ProjectNameForm
            key={project.data.name}
            projectId={project.data.id}
            name={project.data.name}
          />
          <p className="mt-1 text-sm text-zinc-500">
            Created {formatTimestamp(project.data.createdAt)} · Updated{' '}
            {formatTimestamp(project.data.updatedAt)}
          </p>
          <DesignSummary design={project.data.systemDesign} />
          <SystemDesignEditor
            key={formatSystemDesign(project.data.systemDesign)}
            projectId={project.data.id}
            design={project.data.systemDesign}
          />
        </>
      )}
    </Page>
  );
}

function DesignSummary({ design }: { design: SystemDesign }) {
  const counts = [
    plural(design.components.length, 'component'),
    plural(design.scenarios.length, 'scenario'),
    plural(design.assumptions.length, 'assumption'),
  ];
  return <p className="mt-6 text-sm text-zinc-700">{counts.join(' · ')}</p>;
}

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}
