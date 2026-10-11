import type { Component } from './component.js';
import type { SequenceScenario, SequenceStep } from './scenario.js';
import type { SystemDesign } from './system-design.js';

export type ComponentUsage = {
  scenario: SequenceScenario;
  steps: { step: SequenceStep; index: number }[];
};

function assertComponentExists(
  design: SystemDesign,
  componentId: string,
): void {
  if (!design.components.some(({ id }) => id === componentId)) {
    throw new Error(`Unknown component "${componentId}"`);
  }
}

function stepUsesComponent(step: SequenceStep, componentId: string): boolean {
  return step.type === 'interaction'
    ? step.from === componentId || step.to === componentId
    : step.componentId === componentId;
}

function withoutComponent(
  design: SystemDesign,
  componentId: string,
): Component[] {
  return design.components.filter(({ id }) => id !== componentId);
}

export function addComponent(
  design: SystemDesign,
  component: Component,
): SystemDesign {
  return { ...design, components: [...design.components, component] };
}

export function replaceComponent(
  design: SystemDesign,
  component: Component,
): SystemDesign {
  assertComponentExists(design, component.id);
  return {
    ...design,
    components: design.components.map((current) =>
      current.id === component.id ? component : current,
    ),
  };
}

export function findComponentUsages(
  design: SystemDesign,
  componentId: string,
): ComponentUsage[] {
  return design.scenarios.flatMap((scenario) => {
    const steps = scenario.steps.flatMap((step, index) =>
      stepUsesComponent(step, componentId) ? [{ step, index }] : [],
    );
    return steps.length > 0 ? [{ scenario, steps }] : [];
  });
}

export function deleteComponent(
  design: SystemDesign,
  componentId: string,
): SystemDesign {
  assertComponentExists(design, componentId);
  if (findComponentUsages(design, componentId).length > 0) {
    throw new Error(`Component "${componentId}" is still referenced`);
  }
  return { ...design, components: withoutComponent(design, componentId) };
}

export function deleteComponentWithReferences(
  design: SystemDesign,
  componentId: string,
): SystemDesign {
  assertComponentExists(design, componentId);
  return {
    ...design,
    components: withoutComponent(design, componentId),
    scenarios: design.scenarios.map((scenario) => ({
      ...scenario,
      steps: scenario.steps.filter(
        (step) => !stepUsesComponent(step, componentId),
      ),
    })),
  };
}
