import { useMemo } from 'react';
import { Group, Panel, useDefaultLayout } from 'react-resizable-panels';
import { ResizeSeparator } from '../../../components/resize-separator';
import { WorkspacePanel } from '../../../components/workspace-panel';
import { layoutStorage } from '../../../shared/layout-storage';
import type { WorkspaceSections } from './workspace-sections';

export function ResizableWorkspaceLayout({
  exercise,
  components,
  design,
  coach,
  review,
}: WorkspaceSections) {
  const hasExercise = exercise !== null;
  const leftPanelIds = useMemo(
    () => (hasExercise ? ['exercise', 'components'] : ['components']),
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
                <Panel id="exercise" defaultSize="35%" minSize="5rem">
                  <WorkspacePanel title="Exercise">{exercise}</WorkspacePanel>
                </Panel>
                <ResizeSeparator orientation="vertical" />
              </>
            )}
            <Panel id="components" minSize="8rem">
              <WorkspacePanel title="Components">{components}</WorkspacePanel>
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
  );
}
