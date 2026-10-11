import {
  addInitialFact,
  removeInitialFact,
  type Component,
  type SequenceScenario,
} from '@flowment/domain';
import { useId } from 'react';
import { participantName } from '../../shared/design-labels';
import { InitialFactForm } from './initial-fact-form';

type InitialFactsProps = {
  components: Component[];
  scenario: SequenceScenario;
  onScenarioChange: (scenario: SequenceScenario) => void;
};

export function InitialFacts({
  components,
  scenario,
  onScenarioChange,
}: InitialFactsProps) {
  const headingId = useId();
  const groups = components
    .map((component) => ({
      component,
      facts: scenario.initialFacts.flatMap(({ componentId, fact }, index) =>
        componentId === component.id ? [{ fact, index }] : [],
      ),
    }))
    .filter(({ facts }) => facts.length > 0);

  return (
    <section
      aria-labelledby={headingId}
      className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4"
    >
      <div className="space-y-1">
        <h3 id={headingId} className="text-sm font-semibold">
          Initial facts
        </h3>
        <p className="text-xs text-zinc-500">
          What each component already knows before step 1.
        </p>
      </div>
      {groups.length > 0 && (
        <ul className="space-y-2">
          {groups.map(({ component, facts }) => (
            <li key={component.id} className="space-y-1">
              <p className="text-xs font-medium text-zinc-600 wrap-anywhere">
                {participantName(component)}
              </p>
              <ul className="flex flex-wrap gap-1">
                {facts.map(({ fact, index }) => (
                  <li
                    key={index}
                    className="flex items-center gap-1 rounded-full border border-zinc-300 bg-zinc-50 py-0.5 pr-1 pl-2.5 text-sm wrap-anywhere"
                  >
                    {fact}
                    <button
                      type="button"
                      aria-label={`Remove ${fact} from ${participantName(component)}`}
                      onClick={() =>
                        onScenarioChange(removeInitialFact(scenario, index))
                      }
                      className="rounded-full px-1.5 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
      {components.length === 0 ? (
        <p className="text-sm text-zinc-500">
          Add a component before adding initial facts.
        </p>
      ) : (
        <InitialFactForm
          components={components}
          scenario={scenario}
          onAdd={(initialFact) =>
            onScenarioChange(addInitialFact(scenario, initialFact))
          }
        />
      )}
    </section>
  );
}
