import type { SequenceScenario } from '@flowment/domain';
import { Copy, Pencil, Trash2 } from 'lucide-react';
import { useId, useState } from 'react';
import { InlineConfirmation } from '../../components/inline-confirmation';
import { IconButton } from '../../components/ui/icon-button';
import { scenarioTitle } from '../../shared/design-labels';
import { ScenarioForm } from './scenario-form';
import { applyScenarioForm } from './scenario-form-schemas';

type ScenarioDetailsProps = {
  scenario: SequenceScenario;
  onSave: (scenario: SequenceScenario) => void;
  onDuplicate: () => void;
  onDelete: () => void;
};

export function ScenarioDetails({
  scenario,
  onSave,
  onDuplicate,
  onDelete,
}: ScenarioDetailsProps) {
  const [mode, setMode] = useState<'view' | 'edit' | 'delete'>('view');
  const headingId = useId();
  const stepCount = scenario.steps.length;

  return (
    <section
      aria-labelledby={headingId}
      className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <h3 id={headingId} className="text-sm font-semibold wrap-anywhere">
            {scenarioTitle(scenario)}
          </h3>
          {scenario.description && (
            <p className="text-sm whitespace-pre-wrap text-zinc-600 wrap-anywhere">
              {scenario.description}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <IconButton
            label="Edit scenario details"
            icon={Pencil}
            aria-expanded={mode === 'edit'}
            onClick={() => setMode(mode === 'edit' ? 'view' : 'edit')}
          />
          <IconButton
            label="Duplicate scenario"
            icon={Copy}
            onClick={onDuplicate}
          />
          <IconButton
            label="Delete scenario"
            icon={Trash2}
            variant="danger"
            disabled={mode === 'delete'}
            onClick={() => (stepCount === 0 ? onDelete() : setMode('delete'))}
          />
        </div>
      </div>
      {mode === 'edit' && (
        <ScenarioForm
          mode="edit"
          defaultValues={{
            title: scenario.title,
            description: scenario.description ?? '',
          }}
          onSubmit={(values) => {
            onSave(applyScenarioForm(scenario, values));
            setMode('view');
          }}
        />
      )}
      {mode === 'delete' && (
        <InlineConfirmation
          confirmLabel="Delete scenario"
          onConfirm={onDelete}
          onCancel={() => setMode('view')}
        >
          <p>
            Deleting {scenarioTitle(scenario)} also removes its {stepCount}{' '}
            {stepCount === 1 ? 'step' : 'steps'}. Components are kept.
          </p>
        </InlineConfirmation>
      )}
    </section>
  );
}
