import type { Component, SequenceStep } from '@flowment/domain';
import { ArrowDown, ArrowUp, Copy, Trash2 } from 'lucide-react';
import { IconButton } from '../../../components/ui/icon-button';
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
          <IconButton
            label="Move step up"
            icon={ArrowUp}
            disabled={index === 0}
            onClick={() => onMove(index - 1)}
          />
          <IconButton
            label="Move step down"
            icon={ArrowDown}
            disabled={index === stepCount - 1}
            onClick={() => onMove(index + 1)}
          />
          <IconButton
            label="Duplicate step"
            icon={Copy}
            onClick={onDuplicate}
          />
          <IconButton
            label="Delete step"
            icon={Trash2}
            variant="danger"
            onClick={onDelete}
          />
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
