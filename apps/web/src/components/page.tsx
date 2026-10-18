import type { ReactNode } from 'react';

type PageProps = {
  children: ReactNode;
};

export function Page({ children }: PageProps) {
  return <main className="mx-auto max-w-4xl px-4 py-10">{children}</main>;
}
