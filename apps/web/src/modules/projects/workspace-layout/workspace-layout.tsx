import { useMediaQuery } from '../../../shared/use-media-query';
import { ResizableWorkspaceLayout } from './resizable-workspace-layout';
import { StackedWorkspaceLayout } from './stacked-workspace-layout';
import type { WorkspaceSections } from './workspace-sections';

export function WorkspaceLayout(sections: WorkspaceSections) {
  const wide = useMediaQuery('(min-width: 1024px)');

  return wide ? (
    <ResizableWorkspaceLayout {...sections} />
  ) : (
    <StackedWorkspaceLayout {...sections} />
  );
}
