import type { SequenceScenario } from './scenario.js';
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
