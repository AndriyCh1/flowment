import type { ComponentProps } from 'react';

type InputProps = ComponentProps<'input'> & {
  label: string;
};

export function Input({ label, className = '', ...props }: InputProps) {
  return (
    <input
      type="text"
      aria-label={label}
      className={`min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none ${className}`}
      {...props}
    />
  );
}
