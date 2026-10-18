import { z } from 'zod';
import { IdSchema } from './id.js';
import type { NoteStep } from './scenario.js';
import type { SystemDesign } from './system-design.js';

export const MissingStepSchema = z.object({
  scenarioId: IdSchema,
  stepId: IdSchema,
});

export type MissingStep = z.infer<typeof MissingStepSchema>;

export type MissingStepMarker = {
  scenarioId: string;
  step: NoteStep;
  number: number;
};

export function findMissingStepMarker(
  design: SystemDesign,
  { scenarioId, stepId }: MissingStep,
): MissingStepMarker | null {
  const scenario = design.scenarios.find(({ id }) => id === scenarioId);
  const index = scenario?.steps.findIndex(({ id }) => id === stepId) ?? -1;
  const step = index === -1 ? undefined : scenario?.steps[index];

  return step?.type === 'note' ? { scenarioId, step, number: index + 1 } : null;
}
