import type { ArchitectureRelationship, SystemDesign } from '@flowment/domain';
import { participantName, scenarioTitle } from '../../shared/design-labels';

type RelationshipListProps = {
  design: SystemDesign;
  relationships: ArchitectureRelationship[];
  selectedRelationshipId: string | null;
  onSelectRelationship: (relationshipId: string | null) => void;
  onSelectScenario: (scenarioId: string) => void;
};

function countLabel(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

export function RelationshipList({
  design,
  relationships,
  selectedRelationshipId,
  onSelectRelationship,
  onSelectScenario,
}: RelationshipListProps) {
  const componentNames = new Map(
    design.components.map((component) => [
      component.id,
      participantName(component),
    ]),
  );
  const nameOf = (componentId: string) =>
    componentNames.get(componentId) ?? 'Unknown component';
  const scenariosById = new Map(
    design.scenarios.map((scenario) => [scenario.id, scenario]),
  );

  return (
    <ul aria-label="Relationships" className="space-y-2">
      {relationships.map((relationship) => {
        const { id, componentIds, interactionCount, directions, scenarios } =
          relationship;
        const selected = id === selectedRelationshipId;
        const [first, second] = componentIds;

        return (
          <li
            key={id}
            className={`space-y-1 rounded-md border p-2 text-sm ${selected ? 'border-sky-300 bg-sky-50' : 'border-zinc-200 bg-white'}`}
          >
            <button
              type="button"
              aria-pressed={selected}
              onClick={() => onSelectRelationship(selected ? null : id)}
              className="flex w-full flex-wrap items-baseline justify-between gap-x-3 text-left focus-visible:outline-2 focus-visible:outline-sky-600"
            >
              <span className="font-medium wrap-anywhere">
                {nameOf(first)} {directions.length > 1 ? '⇄' : '→'}{' '}
                {nameOf(second)}
              </span>
              <span className="text-xs text-zinc-500 tabular-nums">
                {countLabel(interactionCount, 'interaction')}
              </span>
            </button>
            {directions.length > 1 && (
              <p className="text-xs text-zinc-500">
                {directions
                  .map(
                    ({ from, to, interactionCount: count }) =>
                      `${nameOf(from)} → ${nameOf(to)}: ${count}`,
                  )
                  .join(' · ')}
              </p>
            )}
            <p className="text-xs text-zinc-600">
              Used in{' '}
              {scenarios.map(({ scenarioId, steps }, index) => {
                const scenario = scenariosById.get(scenarioId);
                const numbers = steps.map(({ number }) => number).join(', ');
                return (
                  <span key={scenarioId}>
                    {index > 0 && '; '}
                    <button
                      type="button"
                      onClick={() => onSelectScenario(scenarioId)}
                      className="font-medium text-sky-700 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-sky-600"
                    >
                      {scenario ? scenarioTitle(scenario) : 'Unknown scenario'}
                    </button>{' '}
                    ({steps.length === 1 ? 'step' : 'steps'} {numbers})
                  </span>
                );
              })}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
