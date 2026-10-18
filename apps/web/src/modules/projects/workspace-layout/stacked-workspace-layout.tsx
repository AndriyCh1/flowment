import { WorkspacePanel } from '../../../components/workspace-panel';
import type { WorkspaceSections } from './workspace-sections';

export function StackedWorkspaceLayout({
  exercise,
  components,
  design,
  coach,
  review,
}: WorkspaceSections) {
  return (
    <div className="space-y-2">
      {exercise !== null && (
        <WorkspacePanel title="Exercise">{exercise}</WorkspacePanel>
      )}
      <WorkspacePanel title="Components">{components}</WorkspacePanel>
      {design}
      <WorkspacePanel title="Coach">{coach}</WorkspacePanel>
      <WorkspacePanel title="Review">{review}</WorkspacePanel>
    </div>
  );
}
