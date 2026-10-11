import type { SequenceScenario } from '@flowment/domain';
import { z } from 'zod';

export const ScenarioFormSchema = z.object({
  title: z.string().trim().min(1, 'Enter a scenario title'),
  description: z.string().trim(),
});

export type ScenarioFormValues = z.infer<typeof ScenarioFormSchema>;

export function applyScenarioForm(
  { description: _previous, ...scenario }: SequenceScenario,
  { title, description }: ScenarioFormValues,
): SequenceScenario {
  return description
    ? { ...scenario, title, description }
    : { ...scenario, title };
}

export const InitialFactFormSchema = z.object({
  componentId: z.string().min(1, 'Choose a component'),
  fact: z.string().trim().min(1, 'Enter a fact'),
});

export type InitialFactFormValues = z.infer<typeof InitialFactFormSchema>;
