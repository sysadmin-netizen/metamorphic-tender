import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className = '', hover = false }: CardProps) {
  return (
    <div
      className={[
        'rounded-lg border border-stone-200 bg-white p-6',
        hover
          ? 'transition-all duration-150 hover:border-l-[3px] hover:border-l-amber-700'
          : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}
