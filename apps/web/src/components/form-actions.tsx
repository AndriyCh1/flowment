import { Button } from './ui/button';

export type FormMode = 'create' | 'edit';

type FormActionsProps = {
  mode: FormMode;
  noun: string;
  isDirty: boolean;
  onRevert: () => void;
  onCancel?: () => void;
};

export function FormActions({
  mode,
  noun,
  isDirty,
  onRevert,
  onCancel,
}: FormActionsProps) {
  if (mode === 'create') {
    return (
      <div className="flex flex-wrap gap-2">
        <Button type="submit">Add {noun}</Button>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="submit" disabled={!isDirty}>
        Save {noun}
      </Button>
      <Button variant="secondary" disabled={!isDirty} onClick={onRevert}>
        Revert
      </Button>
    </div>
  );
}
