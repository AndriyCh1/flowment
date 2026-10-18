import {
  deleteStep,
  duplicateStep,
  insertStep,
  moveStep,
  replaceStep,
  type Component,
  type SequenceScenario,
  type SequenceStep,
} from '@flowment/domain';
import { MoveRight, StickyNote } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { SequenceDiagram } from '../sequence-diagram';
import { NewStepPanel, type StepDraft } from './new-step-panel';
import { SelectedStepPanel } from './selected-step-panel';

type SequenceEditorProps = {
  components: Component[];
  scenario: SequenceScenario;
  onScenarioChange: (scenario: SequenceScenario) => void;
};

export function SequenceEditor({
  components,
  scenario,
  onScenarioChange,
}: SequenceEditorProps) {
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [draft, setDraft] = useState<StepDraft | null>(null);
  const { steps } = scenario;
  const selectedIndex = steps.findIndex(({ id }) => id === selectedStepId);
  const selectedStep = selectedIndex === -1 ? undefined : steps[selectedIndex];

  const selectStep = (stepId: string | null) => {
    setDraft(null);
    setSelectedStepId(stepId);
  };

  const startDraft = (type: StepDraft['type']) => {
    setDraft({
      type,
      index: selectedStep ? selectedIndex + 1 : steps.length,
    });
    setSelectedStepId(null);
  };

  const createStep = (step: SequenceStep, index: number) => {
    onScenarioChange(insertStep(scenario, step, index));
    selectStep(step.id);
  };

  const removeStep = (step: SequenceStep, index: number) => {
    onScenarioChange(deleteStep(scenario, step.id));
    selectStep((steps[index + 1] ?? steps[index - 1])?.id ?? null);
  };

  const copyStep = (step: SequenceStep) => {
    const copyId = crypto.randomUUID();
    onScenarioChange(duplicateStep(scenario, step.id, copyId));
    selectStep(copyId);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          icon={MoveRight}
          disabled={components.length === 0}
          onClick={() => startDraft('interaction')}
        >
          Add interaction
        </Button>
        <Button
          variant="secondary"
          icon={StickyNote}
          disabled={components.length === 0}
          onClick={() => startDraft('note')}
        >
          Add note
        </Button>
        {steps.length > 0 && !selectedStep && !draft && (
          <p className="text-sm text-zinc-500">Select a step to edit it.</p>
        )}
      </div>
      <SequenceDiagram
        components={components}
        scenario={scenario}
        selectedStepId={selectedStep?.id ?? null}
        onSelectStep={selectStep}
      />
      {draft ? (
        <NewStepPanel
          key={draft.type}
          components={components}
          steps={steps}
          draft={draft}
          onPositionChange={(index) => setDraft({ ...draft, index })}
          onCreate={createStep}
          onCancel={() => setDraft(null)}
        />
      ) : (
        selectedStep && (
          <SelectedStepPanel
            components={components}
            step={selectedStep}
            index={selectedIndex}
            stepCount={steps.length}
            onSave={(step) => onScenarioChange(replaceStep(scenario, step))}
            onMove={(toIndex) =>
              onScenarioChange(moveStep(scenario, selectedStep.id, toIndex))
            }
            onDuplicate={() => copyStep(selectedStep)}
            onDelete={() => removeStep(selectedStep, selectedIndex)}
          />
        )
      )}
    </div>
  );
}
