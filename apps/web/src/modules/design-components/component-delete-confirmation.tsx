import type { Component, ComponentUsage, SequenceStep } from '@flowment/domain';
import { InlineConfirmation } from '../../components/inline-confirmation';
import { participantName, scenarioTitle } from '../../shared/design-labels';

type ComponentDeleteConfirmationProps = {
  component: Component;
  components: Component[];
  usages: ComponentUsage[];
  onConfirm: () => void;
  onCancel: () => void;
};

export function ComponentDeleteConfirmation({
  component,
  components,
  usages,
  onConfirm,
  onCancel,
}: ComponentDeleteConfirmationProps) {
  const stepCount = usages.reduce(
    (count, usage) => count + usage.steps.length,
    0,
  );

  return (
    <InlineConfirmation
      confirmLabel={`Delete component and ${stepCount} ${stepCount === 1 ? 'step' : 'steps'}`}
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      <p>
        {participantName(component)} is still in use. Deleting it also removes
        these steps:
      </p>
      <ul className="space-y-2">
        {usages.map(({ scenario, steps }) => (
          <li key={scenario.id}>
            <p className="font-medium wrap-anywhere">
              {scenarioTitle(scenario)}
            </p>
            <ul className="list-disc space-y-0.5 pl-5 wrap-anywhere">
              {steps.map(({ step, index }) => (
                <li key={step.id}>
                  Step {index + 1}: {describeStep(step, components)}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </InlineConfirmation>
  );
}

function describeStep(step: SequenceStep, components: Component[]): string {
  const text = step.text ? `: ${step.text}` : '';

  if (step.type === 'note') {
    return `Note${text}`;
  }

  const nameOf = (componentId: string) => {
    const component = components.find(({ id }) => id === componentId);
    return component ? participantName(component) : 'Unknown component';
  };

  return `${nameOf(step.from)} → ${nameOf(step.to)}${text}`;
}
