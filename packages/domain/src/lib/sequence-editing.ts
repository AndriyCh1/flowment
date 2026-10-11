import type { SequenceScenario, SequenceStep } from './scenario.js';
import type { SystemDesign } from './system-design.js';

function stepIndex(scenario: SequenceScenario, stepId: string): number {
  const index = scenario.steps.findIndex((step) => step.id === stepId);
  if (index === -1) {
    throw new Error(`Unknown step "${stepId}"`);
  }
  return index;
}

function assertPosition(index: number, max: number): void {
  if (!Number.isInteger(index) || index < 0 || index > max) {
    throw new RangeError(`Step position ${index} is outside 0..${max}`);
  }
}

function withSteps(scenario: SequenceScenario, steps: SequenceStep[]): SequenceScenario {
  return { ...scenario, steps };
}

export function insertStep(
  scenario: SequenceScenario,
  step: SequenceStep,
  index: number,
): SequenceScenario {
  assertPosition(index, scenario.steps.length);
  const steps = [...scenario.steps];
  steps.splice(index, 0, step);
  return withSteps(scenario, steps);
}

export function replaceStep(scenario: SequenceScenario, step: SequenceStep): SequenceScenario {
  const index = stepIndex(scenario, step.id);
  return withSteps(
    scenario,
    scenario.steps.map((current, currentIndex) => (currentIndex === index ? step : current)),
  );
}

export function moveStep(
  scenario: SequenceScenario,
  stepId: string,
  toIndex: number,
): SequenceScenario {
  const fromIndex = stepIndex(scenario, stepId);
  assertPosition(toIndex, scenario.steps.length - 1);
  const steps = [...scenario.steps];
  const [step] = steps.splice(fromIndex, 1);
  steps.splice(toIndex, 0, step);
  return withSteps(scenario, steps);
}

export function duplicateStep(
  scenario: SequenceScenario,
  stepId: string,
  copyId: string,
): SequenceScenario {
  const index = stepIndex(scenario, stepId);
  return insertStep(scenario, { ...scenario.steps[index], id: copyId }, index + 1);
}

export function deleteStep(scenario: SequenceScenario, stepId: string): SequenceScenario {
  const index = stepIndex(scenario, stepId);
  return withSteps(
    scenario,
    scenario.steps.filter((_step, currentIndex) => currentIndex !== index),
  );
}

export function replaceScenario(design: SystemDesign, scenario: SequenceScenario): SystemDesign {
  const index = design.scenarios.findIndex(({ id }) => id === scenario.id);
  if (index === -1) {
    throw new Error(`Unknown scenario "${scenario.id}"`);
  }
  return {
    ...design,
    scenarios: design.scenarios.map((current, currentIndex) =>
      currentIndex === index ? scenario : current,
    ),
  };
}
