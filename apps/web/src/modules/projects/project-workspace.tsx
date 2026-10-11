import { SystemDesignSchema, type SystemDesign } from '@flowment/domain';
import { useState } from 'react';
import type { ProjectDto } from '../../api';
import { ErrorMessage } from '../../components/ui/error-message';
import { errorMessage } from '../../shared/api-error';
import { ComponentPanel } from '../design-components';
import { ScenarioWorkspace } from '../scenarios';
import { formatTimestamp } from './format-timestamp';
import { ProjectNameForm } from './project-name-form';
import { useSaveSystemDesign } from './project-queries';
import { SystemDesignEditor } from './system-design-editor';
import { formatSystemDesign } from './system-design-json';

type ProjectWorkspaceProps = { project: ProjectDto };

export function ProjectWorkspace({ project }: ProjectWorkspaceProps) {
  const saveDesign = useSaveSystemDesign(project.id);
  const design = project.systemDesign;
  const [rejectedChange, setRejectedChange] = useState(false);

  const changeDesign = (next: SystemDesign) => {
    const valid = SystemDesignSchema.safeParse(next).success;
    setRejectedChange(!valid);
    if (valid) {
      saveDesign.mutate(next);
    }
  };

  return (
    <>
      <ProjectNameForm
        key={project.name}
        projectId={project.id}
        name={project.name}
      />
      <div className="mt-1 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm text-zinc-500">
        <p>
          Created {formatTimestamp(project.createdAt)} · Updated{' '}
          {formatTimestamp(project.updatedAt)}
        </p>
        <p aria-live="polite">{saveDesign.isPending ? 'Saving…' : ''}</p>
      </div>
      {rejectedChange && (
        <div className="mt-3">
          <ErrorMessage>
            That change would leave the design invalid, so it wasn't applied.
          </ErrorMessage>
        </div>
      )}
      {saveDesign.isError && (
        <div className="mt-3">
          <ErrorMessage>
            Your last change wasn't saved: {errorMessage(saveDesign.error)}
          </ErrorMessage>
        </div>
      )}
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
          <ComponentPanel design={design} onDesignChange={changeDesign} />
        </aside>
        <ScenarioWorkspace design={design} onDesignChange={changeDesign} />
      </div>
      <details className="mt-8">
        <summary className="cursor-pointer text-sm font-medium text-zinc-700">
          System design JSON
        </summary>
        <SystemDesignEditor
          key={formatSystemDesign(design)}
          projectId={project.id}
          design={design}
        />
      </details>
    </>
  );
}
