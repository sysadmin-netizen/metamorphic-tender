interface LoadingProps {
  lines?: number;
  className?: string;
}

export function Loading({ lines = 3, className = '' }: LoadingProps) {
  return (
    <div className={`flex flex-col gap-3 ${className}`} aria-busy="true" aria-label="Loading">
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className={[
            'h-4 animate-pulse rounded bg-stone-200',
            // Vary widths for visual realism
            i === lines - 1 ? 'w-3/5' : i % 2 === 0 ? 'w-full' : 'w-4/5',
          ].join(' ')}
        />
      ))}
    </div>
  );
}
