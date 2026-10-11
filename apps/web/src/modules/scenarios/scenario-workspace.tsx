import {
  addScenario,
  deleteScenario,
  duplicateScenario,
  replaceScenario,
  type SequenceScenario,
  type SystemDesign,
} from '@flowment/domain';
import { useState } from 'react';
import { SequenceEditor } from '../sequence';
import { InitialFacts } from './initial-facts';
import { ScenarioDetails } from './scenario-details';
import { ScenarioForm } from './scenario-form';
import {
  applyScenarioForm,
  type ScenarioFormValues,
} from './scenario-form-schemas';
import { ScenarioTabs } from './scenario-tabs';

type ScenarioWorkspaceProps = {
  design: SystemDesign;
  onDesignChange: (design: SystemDesign) => void;
};

export function ScenarioWorkspace({
  design,
  onDesignChange,
}: ScenarioWorkspaceProps) {
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const { components, scenarios } = design;
  const scenario =
    scenarios.find(({ id }) => id === scenarioId) ?? scenarios[0];

  const selectScenario = (id: string) => {
    setAdding(false);
    setScenarioId(id);
  };

  const saveScenario = (next: SequenceScenario) =>
    onDesignChange(replaceScenario(design, next));

  const createScenario = (values: ScenarioFormValues) => {
    const created = applyScenarioForm(
      { id: crypto.randomUUID(), title: '', initialFacts: [], steps: [] },
      values,
    );
    onDesignChange(addScenario(design, created));
    selectScenario(created.id);
  };

  const copyScenario = (original: SequenceScenario) => {
    const copyId = crypto.randomUUID();
    onDesignChange(
      duplicateScenario(design, original.id, copyId, () => crypto.randomUUID()),
    );
    selectScenario(copyId);
  };

  const removeScenario = (removed: SequenceScenario) => {
    const index = scenarios.indexOf(removed);
    onDesignChange(deleteScenario(design, removed.id));
    setScenarioId((scenarios[index + 1] ?? scenarios[index - 1])?.id ?? null);
  };

  return (
    <section aria-labelledby="scenarios-heading" className="min-w-0 space-y-3">
      <h2 id="scenarios-heading" className="text-lg font-semibold">
        Scenarios
      </h2>
      <ScenarioTabs
        scenarios={scenarios}
        activeId={scenario?.id}
        adding={adding}
        onSelect={selectScenario}
        onAdd={() => setAdding(true)}
      />
      {adding && (
        <div className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4">
          <h3 className="text-sm font-semibold">New scenario</h3>
          <ScenarioForm
            mode="create"
            defaultValues={{ title: '', description: '' }}
            onSubmit={createScenario}
            onCancel={() => setAdding(false)}
          />
        </div>
      )}
      {scenario ? (
        <div key={scenario.id} className="space-y-3">
          <div className="grid items-start gap-3 xl:grid-cols-2">
            <ScenarioDetails
              scenario={scenario}
              onSave={saveScenario}
              onDuplicate={() => copyScenario(scenario)}
              onDelete={() => removeScenario(scenario)}
            />
            <InitialFacts
              components={components}
              scenario={scenario}
              onScenarioChange={saveScenario}
            />
          </div>
          <SequenceEditor
            components={components}
            scenario={scenario}
            onScenarioChange={saveScenario}
          />
        </div>
      ) : (
        !adding && <p className="text-sm text-zinc-500">No scenarios yet.</p>
      )}
    </section>
  );
}
