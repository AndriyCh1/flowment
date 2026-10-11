import type { ReactNode } from 'react';

export function ErrorMessage({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="text-sm text-red-700">
      {children}
    </div>
  );
}
