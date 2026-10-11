import { factsMatch } from './fact.js';
import type { InitialFact, SequenceScenario } from './scenario.js';
import type { SystemDesign } from './system-design.js';

function scenarioIndex(design: SystemDesign, scenarioId: string): number {
  const index = design.scenarios.findIndex(({ id }) => id === scenarioId);
  if (index === -1) {
    throw new Error(`Unknown scenario "${scenarioId}"`);
  }
  return index;
}

export function addScenario(
  design: SystemDesign,
  scenario: SequenceScenario,
): SystemDesign {
  return { ...design, scenarios: [...design.scenarios, scenario] };
}

export function replaceScenario(
  design: SystemDesign,
  scenario: SequenceScenario,
): SystemDesign {
  const index = scenarioIndex(design, scenario.id);
  return {
    ...design,
    scenarios: design.scenarios.map((current, currentIndex) =>
      currentIndex === index ? scenario : current,
    ),
  };
}

export function duplicateScenario(
  design: SystemDesign,
  scenarioId: string,
  copyId: string,
  createStepId: () => string,
): SystemDesign {
  const index = scenarioIndex(design, scenarioId);
  const original = design.scenarios[index];
  const copy: SequenceScenario = {
    ...original,
    id: copyId,
    title: original.title.trim() ? `${original.title} (copy)` : original.title,
    initialFacts: original.initialFacts.map((initialFact) => ({
      ...initialFact,
    })),
    steps: original.steps.map((step) => ({ ...step, id: createStepId() })),
  };
  const scenarios = [...design.scenarios];
  scenarios.splice(index + 1, 0, copy);
  return { ...design, scenarios };
}

export function deleteScenario(
  design: SystemDesign,
  scenarioId: string,
): SystemDesign {
  const index = scenarioIndex(design, scenarioId);
  return {
    ...design,
    scenarios: design.scenarios.filter(
      (_scenario, currentIndex) => currentIndex !== index,
    ),
  };
}

export function hasInitialFact(
  scenario: SequenceScenario,
  { componentId, fact }: InitialFact,
): boolean {
  return scenario.initialFacts.some(
    (current) =>
      current.componentId === componentId && factsMatch(current.fact, fact),
  );
}

export function addInitialFact(
  scenario: SequenceScenario,
  initialFact: InitialFact,
): SequenceScenario {
  return {
    ...scenario,
    initialFacts: [...scenario.initialFacts, initialFact],
  };
}

export function removeInitialFact(
  scenario: SequenceScenario,
  index: number,
): SequenceScenario {
  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= scenario.initialFacts.length
  ) {
    throw new RangeError(
      `Initial fact position ${index} is outside 0..${scenario.initialFacts.length - 1}`,
    );
  }
  return {
    ...scenario,
    initialFacts: scenario.initialFacts.filter(
      (_initialFact, currentIndex) => currentIndex !== index,
    ),
  };
}
