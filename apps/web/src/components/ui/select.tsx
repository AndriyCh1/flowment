import type { ComponentProps } from 'react';

type SelectProps = ComponentProps<'select'> & {
  label: string;
};

export function Select({ label, className = '', ...props }: SelectProps) {
  return (
    <select
      aria-label={label}
      className={`w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none ${className}`}
      {...props}
    />
  );
}
