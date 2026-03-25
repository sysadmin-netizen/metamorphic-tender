import type { ReactNode } from 'react';

type BadgeVariant =
  | 'invited'
  | 'opened'
  | 'submitted'
  | 'expired'
  | 'trial'
  | 'preferred'
  | 'strategic';

interface BadgeProps {
  variant: BadgeVariant;
  children: ReactNode;
}

const variantClasses: Record<BadgeVariant, string> = {
  // Status badges
  invited: 'bg-blue-50 text-blue-700 border-blue-200',
  opened: 'bg-sky-50 text-sky-700 border-sky-200',
  submitted: 'bg-green-50 text-green-700 border-green-200',
  expired: 'bg-red-50 text-red-700 border-red-200',
  // Tier badges
  trial: 'bg-stone-50 text-stone-700 border-stone-200',
  preferred: 'bg-amber-50 text-amber-700 border-amber-200',
  strategic: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export function Badge({ variant, children }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full border px-2.5 py-0.5',
        'text-xs font-medium leading-tight',
        variantClasses[variant],
      ].join(' ')}
    >
      {children}
    </span>
  );
}
