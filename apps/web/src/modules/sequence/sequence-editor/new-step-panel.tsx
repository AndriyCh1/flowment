import type { Component, SequenceStep } from '@flowment/domain';
import { Field } from '../../../components/ui/field';
import { Select } from '../../../components/ui/select';
import { InteractionForm } from '../step-forms/interaction-form';
import { NoteForm } from '../step-forms/note-form';
import { applyNoteForm } from '../step-forms/step-form-schemas';
import { EditorPanel } from './editor-panel';

export type StepDraft = { type: SequenceStep['type']; index: number };

type NewStepPanelProps = {
  components: Component[];
  steps: SequenceStep[];
  draft: StepDraft;
  onPositionChange: (index: number) => void;
  onCreate: (step: SequenceStep, index: number) => void;
  onCancel: () => void;
};

export function NewStepPanel({
  components,
  steps,
  draft,
  onPositionChange,
  onCreate,
  onCancel,
}: NewStepPanelProps) {
  const index = Math.min(draft.index, steps.length);
  const previous = steps[index - 1];

  return (
    <EditorPanel
      title={draft.type === 'interaction' ? 'New interaction' : 'New note'}
    >
      {steps.length > 0 && (
        <Field label="Position">
          <Select
            label="Position"
            value={index}
            onChange={(event) => onPositionChange(Number(event.target.value))}
          >
            <option value={0}>Before step 1</option>
            {steps.map((step, stepIndex) => (
              <option key={step.id} value={stepIndex + 1}>
                After step {stepIndex + 1}
              </option>
            ))}
          </Select>
        </Field>
      )}
      {draft.type === 'interaction' ? (
        <InteractionForm
          mode="create"
          components={components}
          defaultValues={{
            from: previous?.type === 'interaction' ? previous.to : '',
            to: '',
            text: '',
          }}
          onSubmit={(values) =>
            onCreate(
              { id: crypto.randomUUID(), type: 'interaction', ...values },
              index,
            )
          }
          onCancel={onCancel}
        />
      ) : (
        <NoteForm
          mode="create"
          components={components}
          defaultValues={{ componentId: '', text: '' }}
          onSubmit={(values) =>
            onCreate(
              applyNoteForm(
                { id: crypto.randomUUID(), type: 'note', text: '' },
                values,
              ),
              index,
            )
          }
          onCancel={onCancel}
        />
      )}
    </EditorPanel>
  );
}
