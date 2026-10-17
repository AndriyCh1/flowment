import type { InteractionStep } from './scenario.js';
import type { SystemDesign } from './system-design.js';

export type UnlabeledInteraction = {
  scenarioId: string;
  step: InteractionStep;
  number: number;
};

export function findUnlabeledInteractions(
  design: SystemDesign,
): UnlabeledInteraction[] {
  return design.scenarios.flatMap((scenario) =>
    scenario.steps.flatMap((step, index) =>
      step.type === 'interaction' && step.text.trim() === ''
        ? [{ scenarioId: scenario.id, step, number: index + 1 }]
        : [],
    ),
  );
}
