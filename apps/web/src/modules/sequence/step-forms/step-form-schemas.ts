import type { InteractionStep, NoteStep } from '@flowment/domain';
import { z } from 'zod';

export const InteractionFormSchema = z.object({
  from: z.string().min(1, 'Choose a sender'),
  to: z.string().min(1, 'Choose a receiver'),
  text: z.string(),
});

export type InteractionFormValues = z.infer<typeof InteractionFormSchema>;

export const NoteFormSchema = z.object({
  componentId: z.string(),
  text: z.string(),
});

export type NoteFormValues = z.infer<typeof NoteFormSchema>;

export function applyInteractionForm(
  step: InteractionStep,
  { from, to, text }: InteractionFormValues,
): InteractionStep {
  return { ...step, from, to, text };
}

export function applyNoteForm(
  { componentId: _previous, ...step }: NoteStep,
  { componentId, text }: NoteFormValues,
): NoteStep {
  return componentId ? { ...step, text, componentId } : { ...step, text };
}
