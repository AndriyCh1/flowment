import type { Component, SequenceStep } from '@flowment/domain';
import { Button } from '../../../components/ui/button';
import { InteractionForm } from '../step-forms/interaction-form';
import { NoteForm } from '../step-forms/note-form';
import {
  applyInteractionForm,
  applyNoteForm,
} from '../step-forms/step-form-schemas';
import { EditorPanel } from './editor-panel';

type SelectedStepPanelProps = {
  components: Component[];
  step: SequenceStep;
  index: number;
  stepCount: number;
  onSave: (step: SequenceStep) => void;
  onMove: (toIndex: number) => void;
  onDuplicate: () => void;
  onDelete: () => void;
};

export function SelectedStepPanel({
  components,
  step,
  index,
  stepCount,
  onSave,
  onMove,
  onDuplicate,
  onDelete,
}: SelectedStepPanelProps) {
  const title = `Step ${index + 1} · ${step.type === 'interaction' ? 'Interaction' : 'Note'}`;

  return (
    <EditorPanel
      title={title}
      actions={
        <>
          <Button
            variant="secondary"
            disabled={index === 0}
            onClick={() => onMove(index - 1)}
          >
            Move up
          </Button>
          <Button
            variant="secondary"
            disabled={index === stepCount - 1}
            onClick={() => onMove(index + 1)}
          >
            Move down
          </Button>
          <Button variant="secondary" onClick={onDuplicate}>
            Duplicate
          </Button>
          <Button variant="danger" onClick={onDelete}>
            Delete
          </Button>
        </>
      }
    >
      {step.type === 'interaction' ? (
        <InteractionForm
          key={JSON.stringify(step)}
          mode="edit"
          components={components}
          defaultValues={{ from: step.from, to: step.to, text: step.text }}
          onSubmit={(values) => onSave(applyInteractionForm(step, values))}
        />
      ) : (
        <NoteForm
          key={JSON.stringify(step)}
          mode="edit"
          components={components}
          defaultValues={{
            componentId: step.componentId ?? '',
            text: step.text,
          }}
          onSubmit={(values) => onSave(applyNoteForm(step, values))}
        />
      )}
    </EditorPanel>
  );
}
