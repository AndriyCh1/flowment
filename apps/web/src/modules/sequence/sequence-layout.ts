import type {
  Component,
  InteractionStep,
  NoteStep,
  SequenceScenario,
} from '@flowment/domain';

export type SequenceRow =
  | {
      type: 'interaction';
      number: number;
      step: InteractionStep;
      from: number;
      to: number;
    }
  | {
      type: 'self-interaction';
      number: number;
      step: InteractionStep;
      column: number;
    }
  | { type: 'note'; number: number; step: NoteStep; column: number | null };

export function layoutSequence(
  components: Component[],
  scenario: SequenceScenario,
): SequenceRow[] {
  const columns = new Map(
    components.map((component, index) => [component.id, index]),
  );

  const columnOf = (componentId: string) => {
    const column = columns.get(componentId);
    if (column === undefined) {
      throw new Error(`Unknown component "${componentId}"`);
    }
    return column;
  };

  return scenario.steps.map((step, index): SequenceRow => {
    const number = index + 1;

    if (step.type === 'note') {
      return {
        type: 'note',
        number,
        step,
        column:
          step.componentId === undefined ? null : columnOf(step.componentId),
      };
    }

    const from = columnOf(step.from);
    const to = columnOf(step.to);

    return from === to
      ? { type: 'self-interaction', number, step, column: from }
      : { type: 'interaction', number, step, from, to };
  });
}
