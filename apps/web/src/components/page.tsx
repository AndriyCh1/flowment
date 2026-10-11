import type { ReactNode } from 'react';

const widths = {
  narrow: 'mx-auto max-w-4xl',
  full: '',
};

type PageProps = {
  width?: keyof typeof widths;
  children: ReactNode;
};

export function Page({ width = 'narrow', children }: PageProps) {
  return <main className={`${widths[width]} px-4 py-10`}>{children}</main>;
}
