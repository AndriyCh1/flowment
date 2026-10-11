import type { SystemDesign } from '@flowment/domain';
import { useState } from 'react';
import { SequenceDiagram } from '../sequence';

export function ScenarioSection({ design }: { design: SystemDesign }) {
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const scenario =
    design.scenarios.find(({ id }) => id === scenarioId) ??
    design.scenarios[0];

  const selectScenario = (id: string) => {
    setScenarioId(id);
    setSelectedStepId(null);
  };

  return (
    <section aria-labelledby="scenarios-heading" className="mt-6 space-y-3">
      <h2 id="scenarios-heading" className="text-lg font-semibold">
        Scenarios
      </h2>
      {scenario ? (
        <>
          <fieldset className="flex flex-wrap gap-1 border-b border-zinc-200">
            <legend className="sr-only">Scenario</legend>
            {design.scenarios.map(({ id, title }) => (
              <button
                key={id}
                type="button"
                aria-pressed={id === scenario.id}
                onClick={() => selectScenario(id)}
                className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${id === scenario.id ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-800'}`}
              >
                {title.trim() || 'Untitled scenario'}
              </button>
            ))}
          </fieldset>
          {scenario.description && (
            <p className="text-sm text-zinc-600">{scenario.description}</p>
          )}
          <SequenceDiagram
            components={design.components}
            scenario={scenario}
            selectedStepId={selectedStepId}
            onSelectStep={setSelectedStepId}
          />
        </>
      ) : (
        <p className="text-sm text-zinc-500">No scenarios yet.</p>
      )}
    </section>
  );
}
