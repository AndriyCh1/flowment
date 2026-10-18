import {
  addComponent,
  deleteComponent,
  deleteComponentWithReferences,
  findComponentUsages,
  moveComponent,
  replaceComponent,
  type SystemDesign,
} from '@flowment/domain';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { ComponentEditor } from './component-editor';
import { ComponentForm } from './component-form';
import {
  componentFormValues,
  componentFromForm,
  type ComponentFormValues,
} from './component-form-schemas';
import { ComponentList } from './component-list';

type ComponentPanelProps = {
  design: SystemDesign;
  onDesignChange: (design: SystemDesign) => void;
};

export function ComponentPanel({
  design,
  onDesignChange,
}: ComponentPanelProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const { components } = design;
  const selected = components.find(({ id }) => id === selectedId);
  const usages = selected ? findComponentUsages(design, selected.id) : [];

  const select = (componentId: string | null) => {
    setAdding(false);
    setSelectedId(componentId);
  };

  const startAdding = () => {
    setSelectedId(null);
    setAdding(true);
  };

  const create = (values: ComponentFormValues) => {
    onDesignChange(
      addComponent(design, componentFromForm(crypto.randomUUID(), values)),
    );
    setAdding(false);
  };

  const remove = (componentId: string) => {
    onDesignChange(
      usages.length === 0
        ? deleteComponent(design, componentId)
        : deleteComponentWithReferences(design, componentId),
    );
    setSelectedId(null);
  };

  return (
    <div className="space-y-3">
      <Button
        variant="secondary"
        icon={Plus}
        disabled={adding}
        onClick={startAdding}
      >
        Add component
      </Button>
      {components.length === 0 ? (
        <p className="text-sm text-zinc-500">No components yet.</p>
      ) : (
        <ComponentList
          components={components}
          selectedId={selected?.id ?? null}
          onSelect={select}
        />
      )}
      {adding && (
        <div className="space-y-3 border-t border-zinc-200 pt-3">
          <h3 className="text-sm font-semibold">New component</h3>
          <ComponentForm
            mode="create"
            defaultValues={componentFormValues()}
            onSubmit={create}
            onCancel={() => setAdding(false)}
          />
        </div>
      )}
      {selected && (
        <ComponentEditor
          key={selected.id}
          component={selected}
          components={components}
          usages={usages}
          onSave={(component) =>
            onDesignChange(replaceComponent(design, component))
          }
          onMove={(toIndex) =>
            onDesignChange(moveComponent(design, selected.id, toIndex))
          }
          onDelete={() => remove(selected.id)}
        />
      )}
    </div>
  );
}
