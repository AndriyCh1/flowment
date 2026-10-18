import { SystemDesignSchema, type SystemDesign } from '@flowment/domain';
import { useState } from 'react';
import type { ProjectDto } from '../../api';
import { ErrorMessage } from '../../components/ui/error-message';
import { errorMessage } from '../../shared/api-error';
import { formatTimestamp } from '../../shared/format-timestamp';
import { ArchitectureView } from '../architecture';
import { CoachPanel } from '../coach';
import { ComponentPanel } from '../design-components';
import { ExerciseBrief } from '../exercises';
import { ReviewPanel } from '../reviews';
import { ScenarioWorkspace } from '../scenarios';
import { ProjectNameForm } from './project-name-form';
import { useSaveSystemDesign } from './project-queries';
import { SystemDesignEditor } from './system-design-editor';
import { formatSystemDesign } from './system-design-json';

type ProjectWorkspaceProps = { project: ProjectDto };

export function ProjectWorkspace({ project }: ProjectWorkspaceProps) {
  const saveDesign = useSaveSystemDesign(project.id);
  const design = project.systemDesign;
  const [rejectedChange, setRejectedChange] = useState(false);
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const activeScenario =
    design.scenarios.find(({ id }) => id === scenarioId) ?? design.scenarios[0];

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
      {project.exerciseId && (
        <div className="mt-4">
          <ExerciseBrief exerciseId={project.exerciseId} />
        </div>
      )}
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
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[20rem_minmax(0,1fr)] xl:grid-cols-[18rem_minmax(0,1fr)_22rem]">
        <aside className="lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
          <ComponentPanel design={design} onDesignChange={changeDesign} />
        </aside>
        <div className="min-w-0 space-y-8">
          <ScenarioWorkspace
            design={design}
            activeScenarioId={activeScenario?.id}
            onActiveScenarioChange={setScenarioId}
            onDesignChange={changeDesign}
          />
          <ArchitectureView design={design} onSelectScenario={setScenarioId} />
        </div>
        <aside className="space-y-8 lg:col-span-2 xl:sticky xl:top-4 xl:col-span-1 xl:max-h-[calc(100vh-2rem)] xl:overflow-y-auto">
          <CoachPanel
            projectId={project.id}
            design={design}
            scenarioId={activeScenario?.id}
            designSaving={saveDesign.isPending}
          />
          <ReviewPanel
            projectId={project.id}
            design={design}
            designSaving={saveDesign.isPending}
          />
        </aside>
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
