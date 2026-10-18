import type { LucideIcon } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';
import { buttonVariants } from './button';

type IconButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'aria-label'
> & {
  label: string;
  icon: LucideIcon;
  variant?: keyof typeof buttonVariants;
};

export function IconButton({
  label,
  icon: Icon,
  variant = 'secondary',
  type = 'button',
  className = '',
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`inline-flex shrink-0 items-center justify-center rounded-md p-2 disabled:cursor-not-allowed disabled:opacity-40 ${buttonVariants[variant]} ${className}`}
      {...props}
    >
      <Icon aria-hidden className="size-4" />
    </button>
  );
}
