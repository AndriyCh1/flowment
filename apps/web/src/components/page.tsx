import type { ReactNode } from 'react';

export function Page({ children }: { children: ReactNode }) {
  return <main className="mx-auto max-w-4xl px-4 py-10">{children}</main>;
}
