import { useMemo, useState } from 'react';
import { Group, Panel, useDefaultLayout } from 'react-resizable-panels';
import { ResizeSeparator } from '../../../components/resize-separator';
import { TabbedPanel } from '../../../components/tabbed-panel';
import { WorkspacePanel } from '../../../components/workspace-panel';
import { layoutStorage } from '../../../shared/layout-storage';
import { StepEditorHostContext } from '../../../shared/step-editor-host';
import { StepEditorSlot } from './step-editor-slot';
import type { WorkspaceSections } from './workspace-sections';

type ModelTab = 'components' | 'interactions';

export function ResizableWorkspaceLayout({
  exercise,
  components,
  design,
  coach,
  review,
}: WorkspaceSections) {
  const [modelTab, setModelTab] = useState<ModelTab>('components');
  const [stepEditorTarget, setStepEditorTarget] = useState<HTMLElement | null>(
    null,
  );
  const stepEditorHost = useMemo(
    () =>
      stepEditorTarget && {
        target: stepEditorTarget,
        showStepEditor: () => setModelTab('interactions'),
      },
    [stepEditorTarget],
  );
  const hasExercise = exercise !== null;
  const leftPanelIds = useMemo(
    () => (hasExercise ? ['exercise', 'model'] : ['model']),
    [hasExercise],
  );
  const columns = useDefaultLayout({
    id: 'project-workspace-columns',
    storage: layoutStorage,
  });
  const left = useDefaultLayout({
    id: 'project-workspace-left',
    panelIds: leftPanelIds,
    storage: layoutStorage,
  });
  const right = useDefaultLayout({
    id: 'project-workspace-right',
    storage: layoutStorage,
  });

  return (
    <StepEditorHostContext value={stepEditorHost}>
      <div className="min-h-0 flex-1">
        <Group
          orientation="horizontal"
          defaultLayout={columns.defaultLayout}
          onLayoutChanged={columns.onLayoutChanged}
        >
          <Panel id="left" defaultSize="22%" minSize="14rem">
            <Group
              orientation="vertical"
              defaultLayout={left.defaultLayout}
              onLayoutChanged={left.onLayoutChanged}
            >
              {hasExercise && (
                <>
                  <Panel id="exercise" defaultSize="30%" minSize="5rem">
                    <WorkspacePanel title="Exercise">{exercise}</WorkspacePanel>
                  </Panel>
                  <ResizeSeparator orientation="vertical" />
                </>
              )}
              <Panel id="model" minSize="8rem">
                <TabbedPanel
                  label="Model"
                  activeTab={modelTab}
                  onTabChange={setModelTab}
                  tabs={[
                    {
                      id: 'components',
                      label: 'Components',
                      content: components,
                    },
                    {
                      id: 'interactions',
                      label: 'Interactions',
                      content: <StepEditorSlot ref={setStepEditorTarget} />,
                    },
                  ]}
                />
              </Panel>
            </Group>
          </Panel>
          <ResizeSeparator orientation="horizontal" />
          <Panel id="design" minSize="24rem">
            {design}
          </Panel>
          <ResizeSeparator orientation="horizontal" />
          <Panel id="assistant" defaultSize="28%" minSize="18rem">
            <Group
              orientation="vertical"
              defaultLayout={right.defaultLayout}
              onLayoutChanged={right.onLayoutChanged}
            >
              <Panel id="coach" defaultSize="65%" minSize="8rem">
                <WorkspacePanel title="Coach">{coach}</WorkspacePanel>
              </Panel>
              <ResizeSeparator orientation="vertical" />
              <Panel id="review" minSize="5rem">
                <WorkspacePanel title="Review">{review}</WorkspacePanel>
              </Panel>
            </Group>
          </Panel>
        </Group>
      </div>
    </StepEditorHostContext>
  );
}
