import { Button } from '../../../components/ui/button';

export type StepFormMode = 'create' | 'edit';

type StepFormActionsProps = {
  mode: StepFormMode;
  isDirty: boolean;
  onRevert: () => void;
  onCancel?: () => void;
};

export function StepFormActions({
  mode,
  isDirty,
  onRevert,
  onCancel,
}: StepFormActionsProps) {
  if (mode === 'create') {
    return (
      <div className="flex gap-2">
        <Button type="submit">Add step</Button>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Button type="submit" disabled={!isDirty}>
        Save step
      </Button>
      <Button variant="secondary" disabled={!isDirty} onClick={onRevert}>
        Revert
      </Button>
    </div>
  );
}
