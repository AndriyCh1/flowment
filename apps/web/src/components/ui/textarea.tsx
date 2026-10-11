import type { ComponentProps } from 'react';

type TextareaProps = ComponentProps<'textarea'> & {
  label: string;
};

export function Textarea({ label, className = '', ...props }: TextareaProps) {
  return (
    <textarea
      aria-label={label}
      className={`w-full rounded-md border border-zinc-300 bg-white p-3 text-sm focus:border-zinc-500 focus:outline-none ${className}`}
      {...props}
    />
  );
}
