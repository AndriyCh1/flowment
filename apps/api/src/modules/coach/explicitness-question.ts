import type { SystemDesign, UnlabeledInteraction } from '@flowment/domain';
import { componentName } from './coach-context';

export function unlabeledInteractionQuestion(
  design: SystemDesign,
  { step, number }: UnlabeledInteraction,
): string {
  const nameOf = (id: string) => {
    const component = design.components.find(
      (candidate) => candidate.id === id,
    );
    return component ? componentName(component) : id;
  };
  const from = nameOf(step.from);
  const to = nameOf(step.to);

  return step.from === step.to
    ? `Step ${number} doesn't say what ${from} does. What does ${from} do there?`
    : `Step ${number}, ${from} → ${to}, doesn't say what is sent. What does ${from} send to ${to} there?`;
}
