import { SystemDesignSchema, type SystemDesign } from '@flowment/domain';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { ProjectDto } from '../../api';
import { TabbedPanel } from '../../components/tabbed-panel';
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
// import { SystemDesignEditor } from './system-design-editor';
// import { formatSystemDesign } from './system-design-json';
import { WorkspaceLayout } from './workspace-layout/workspace-layout';

type DesignTab = 'scenarios' | 'architecture';

type ProjectWorkspaceProps = { project: ProjectDto };

export function ProjectWorkspace({ project }: ProjectWorkspaceProps) {
  const saveDesign = useSaveSystemDesign(project.id);
  const design = project.systemDesign;
  const [rejectedChange, setRejectedChange] = useState(false);
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const [designTab, setDesignTab] = useState<DesignTab>('scenarios');
  const activeScenario =
    design.scenarios.find(({ id }) => id === scenarioId) ?? design.scenarios[0];

  const changeDesign = (next: SystemDesign) => {
    const valid = SystemDesignSchema.safeParse(next).success;
    setRejectedChange(!valid);
    if (valid) {
      saveDesign.mutate(next);
    }
  };

  const openScenario = (id: string) => {
    setScenarioId(id);
    setDesignTab('scenarios');
  };

  return (
    <>
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 pb-2">
        <Link to="/projects" className="text-sm text-zinc-600 hover:underline">
          ← Projects
        </Link>
        <div className="w-full max-w-md min-w-48 flex-1">
          <ProjectNameForm
            key={project.name}
            projectId={project.id}
            name={project.name}
          />
        </div>
        <p className="text-xs text-zinc-500">
          Created {formatTimestamp(project.createdAt)} · Updated{' '}
          {formatTimestamp(project.updatedAt)}
        </p>
        <p aria-live="polite" className="text-xs text-zinc-500">
          {saveDesign.isPending ? 'Saving…' : ''}
        </p>
      </header>
      {rejectedChange && (
        <div className="pb-2">
          <ErrorMessage>
            That change would leave the design invalid, so it wasn't applied.
          </ErrorMessage>
        </div>
      )}
      {saveDesign.isError && (
        <div className="pb-2">
          <ErrorMessage>
            Your last change wasn't saved: {errorMessage(saveDesign.error)}
          </ErrorMessage>
        </div>
      )}
      <WorkspaceLayout
        exercise={
          project.exerciseId ? (
            <ExerciseBrief exerciseId={project.exerciseId} />
          ) : null
        }
        components={
          <ComponentPanel design={design} onDesignChange={changeDesign} />
        }
        design={
          <TabbedPanel
            label="System design"
            activeTab={designTab}
            onTabChange={setDesignTab}
            tabs={[
              {
                id: 'scenarios',
                label: 'Scenarios',
                content: (
                  <ScenarioWorkspace
                    design={design}
                    activeScenarioId={activeScenario?.id}
                    onActiveScenarioChange={setScenarioId}
                    onDesignChange={changeDesign}
                  />
                ),
              },
              {
                id: 'architecture',
                label: 'Architecture',
                content: (
                  <ArchitectureView
                    design={design}
                    onSelectScenario={openScenario}
                  />
                ),
              },
            ]}
          />
        }
        coach={
          <CoachPanel
            projectId={project.id}
            design={design}
            scenarioId={activeScenario?.id}
            designSaving={saveDesign.isPending}
          />
        }
        review={
          <ReviewPanel
            projectId={project.id}
            design={design}
            designSaving={saveDesign.isPending}
          />
        }
      />
      {/*
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
      */}
    </>
  );
}
