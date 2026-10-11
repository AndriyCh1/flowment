import type { ReactNode } from 'react';
import { Button } from './ui/button';

type InlineConfirmationProps = {
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  children: ReactNode;
};

export function InlineConfirmation({
  confirmLabel,
  onConfirm,
  onCancel,
  children,
}: InlineConfirmationProps) {
  return (
    <fieldset className="space-y-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-950">
      <legend className="sr-only">{confirmLabel}</legend>
      {children}
      <div className="flex flex-wrap gap-2">
        <Button variant="danger" onClick={onConfirm}>
          {confirmLabel}
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </fieldset>
  );
}
