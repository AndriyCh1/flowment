import type { ReactNode } from 'react';
import { ErrorMessage } from './error-message';

type FieldProps = {
  label: string;
  error?: string;
  children: ReactNode;
};

export function Field({ label, error, children }: FieldProps) {
  return (
    <div className="space-y-1">
      <span aria-hidden className="block text-xs font-medium text-zinc-600">
        {label}
      </span>
      {children}
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </div>
  );
}
