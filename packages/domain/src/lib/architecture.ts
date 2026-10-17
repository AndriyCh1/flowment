import type { SystemDesign } from './system-design.js';

export type RelationshipDirection = {
  from: string;
  to: string;
  interactionCount: number;
};

export type RelationshipUsage = {
  scenarioId: string;
  steps: { id: string; number: number }[];
};

export type ArchitectureRelationship = {
  id: string;
  componentIds: [string, string];
  interactionCount: number;
  directions: RelationshipDirection[];
  scenarios: RelationshipUsage[];
};

export type DerivedArchitecture = {
  relationships: ArchitectureRelationship[];
  unconnectedComponentIds: string[];
};

function componentPairKey(first: string, second: string): string {
  return JSON.stringify([first, second].sort());
}

function countDirection(
  relationship: ArchitectureRelationship,
  from: string,
  to: string,
): void {
  const direction = relationship.directions.find(
    (candidate) => candidate.from === from && candidate.to === to,
  );
  if (direction) {
    direction.interactionCount += 1;
  } else {
    relationship.directions.push({ from, to, interactionCount: 1 });
  }
}

function recordUsage(
  relationship: ArchitectureRelationship,
  scenarioId: string,
  step: { id: string; number: number },
): void {
  const usage = relationship.scenarios.at(-1);
  if (usage?.scenarioId === scenarioId) {
    usage.steps.push(step);
  } else {
    relationship.scenarios.push({ scenarioId, steps: [step] });
  }
}

export function deriveArchitecture(design: SystemDesign): DerivedArchitecture {
  const relationships = new Map<string, ArchitectureRelationship>();

  for (const scenario of design.scenarios) {
    scenario.steps.forEach((step, index) => {
      if (step.type !== 'interaction' || step.from === step.to) {
        return;
      }

      const key = componentPairKey(step.from, step.to);
      const relationship = relationships.get(key) ?? {
        id: JSON.stringify([step.from, step.to]),
        componentIds: [step.from, step.to],
        interactionCount: 0,
        directions: [],
        scenarios: [],
      };
      relationships.set(key, relationship);

      relationship.interactionCount += 1;
      countDirection(relationship, step.from, step.to);
      recordUsage(relationship, scenario.id, {
        id: step.id,
        number: index + 1,
      });
    });
  }

  const connected = new Set(
    [...relationships.values()].flatMap(({ componentIds }) => componentIds),
  );

  return {
    relationships: [...relationships.values()],
    unconnectedComponentIds: design.components
      .map(({ id }) => id)
      .filter((id) => !connected.has(id)),
  };
}
