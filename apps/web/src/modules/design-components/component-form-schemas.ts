import { ComponentKindSchema, type Component } from '@flowment/domain';
import { z } from 'zod';

export const ComponentFormSchema = z.object({
  name: z.string().trim().min(1, 'Enter a component name'),
  kind: z.union([ComponentKindSchema, z.literal('')]),
  responsibility: z.string().trim(),
});

export type ComponentFormValues = z.infer<typeof ComponentFormSchema>;

export function componentFormValues(
  component?: Component,
): ComponentFormValues {
  return {
    name: component?.name ?? '',
    kind: component?.kind ?? '',
    responsibility: component?.responsibility ?? '',
  };
}

export function componentFromForm(
  id: string,
  { name, kind, responsibility }: ComponentFormValues,
): Component {
  const component: Component = { id, name };
  if (responsibility) {
    component.responsibility = responsibility;
  }
  if (kind) {
    component.kind = kind;
  }
  return component;
}
