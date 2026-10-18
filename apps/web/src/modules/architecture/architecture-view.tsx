import { deriveArchitecture, type SystemDesign } from '@flowment/domain';
import { useState } from 'react';
import { participantName } from '../../shared/design-labels';
import { ArchitectureGraph } from './architecture-graph';
import { RelationshipList } from './relationship-list';

type ArchitectureViewProps = {
  design: SystemDesign;
  onSelectScenario: (scenarioId: string) => void;
};

export function ArchitectureView({
  design,
  onSelectScenario,
}: ArchitectureViewProps) {
  const [selectedRelationshipId, setSelectedRelationshipId] = useState<
    string | null
  >(null);
  const architecture = deriveArchitecture(design);
  const { relationships, unconnectedComponentIds } = architecture;
  const unconnectedNames = design.components
    .filter(({ id }) => unconnectedComponentIds.includes(id))
    .map(participantName);

  return (
    <div className="min-w-0 space-y-3">
      <p className="text-sm text-zinc-500">
        Derived from the interactions in all scenarios. Edit the scenarios to
        change it.
      </p>
      {design.components.length === 0 ? (
        <p className="text-sm text-zinc-500">No components yet.</p>
      ) : (
        <>
          <ArchitectureGraph
            components={design.components}
            architecture={architecture}
            selectedRelationshipId={selectedRelationshipId}
          />
          {relationships.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No interactions between components yet.
            </p>
          ) : (
            <RelationshipList
              design={design}
              relationships={relationships}
              selectedRelationshipId={selectedRelationshipId}
              onSelectRelationship={setSelectedRelationshipId}
              onSelectScenario={onSelectScenario}
            />
          )}
          {unconnectedNames.length > 0 && (
            <p className="text-sm text-zinc-500">
              Not connected to another component: {unconnectedNames.join(', ')}.
            </p>
          )}
        </>
      )}
    </div>
  );
}
