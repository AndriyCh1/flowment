import { replaceScenario, type SystemDesign } from '@flowment/domain';
import { useState } from 'react';
import { ErrorMessage } from '../../components/ui/error-message';
import { errorMessage } from '../../shared/api-error';
import { SequenceEditor } from '../sequence';
import { useSaveSystemDesign } from './project-queries';

type ScenarioSectionProps = { projectId: string; design: SystemDesign };

export function ScenarioSection({ projectId, design }: ScenarioSectionProps) {
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const saveDesign = useSaveSystemDesign(projectId);
  const scenario =
    design.scenarios.find(({ id }) => id === scenarioId) ??
    design.scenarios[0];

  return (
    <section aria-labelledby="scenarios-heading" className="mt-6 space-y-3">
      <div className="flex items-center justify-between gap-4">
        <h2 id="scenarios-heading" className="text-lg font-semibold">
          Scenarios
        </h2>
        <p aria-live="polite" className="text-sm text-zinc-500">
          {saveDesign.isPending ? 'Saving…' : ''}
        </p>
      </div>
      {saveDesign.isError && (
        <ErrorMessage>
          Your last change wasn't saved: {errorMessage(saveDesign.error)}
        </ErrorMessage>
      )}
      {scenario ? (
        <>
          <fieldset className="flex flex-wrap gap-1 border-b border-zinc-200">
            <legend className="sr-only">Scenario</legend>
            {design.scenarios.map(({ id, title }) => (
              <button
                key={id}
                type="button"
                aria-pressed={id === scenario.id}
                onClick={() => setScenarioId(id)}
                className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${id === scenario.id ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-800'}`}
              >
                {title.trim() || 'Untitled scenario'}
              </button>
            ))}
          </fieldset>
          {scenario.description && (
            <p className="text-sm text-zinc-600">{scenario.description}</p>
          )}
          <SequenceEditor
            key={scenario.id}
            components={design.components}
            scenario={scenario}
            onScenarioChange={(next) =>
              saveDesign.mutate(replaceScenario(design, next))
            }
          />
        </>
      ) : (
        <p className="text-sm text-zinc-500">No scenarios yet.</p>
      )}
    </section>
  );
}
