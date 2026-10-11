import type { Component, ComponentUsage } from '@flowment/domain';
import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { participantName } from '../../shared/design-labels';
import { ComponentDeleteConfirmation } from './component-delete-confirmation';
import { ComponentForm } from './component-form';
import {
  componentFormValues,
  componentFromForm,
} from './component-form-schemas';

type ComponentEditorProps = {
  component: Component;
  components: Component[];
  usages: ComponentUsage[];
  onSave: (component: Component) => void;
  onDelete: () => void;
};

export function ComponentEditor({
  component,
  components,
  usages,
  onSave,
  onDelete,
}: ComponentEditorProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <div className="space-y-3 border-t border-zinc-200 pt-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold wrap-anywhere">
          Edit {participantName(component)}
        </h3>
        <Button
          variant="danger"
          disabled={confirmingDelete}
          onClick={() =>
            usages.length === 0 ? onDelete() : setConfirmingDelete(true)
          }
        >
          Delete
        </Button>
      </div>
      {confirmingDelete ? (
        <ComponentDeleteConfirmation
          component={component}
          components={components}
          usages={usages}
          onConfirm={onDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      ) : (
        <ComponentForm
          key={JSON.stringify(component)}
          mode="edit"
          defaultValues={componentFormValues(component)}
          onSubmit={(values) => onSave(componentFromForm(component.id, values))}
        />
      )}
    </div>
  );
}
