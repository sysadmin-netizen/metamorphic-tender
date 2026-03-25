import type { StatItem } from '@/types';

/* ---------------------------------------------------------------
   Types
   --------------------------------------------------------------- */

interface StatsBarProps {
  stats: StatItem[];
}

/* ---------------------------------------------------------------
   Component
   --------------------------------------------------------------- */

export function StatsBar({ stats }: StatsBarProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-lg border border-stone-700 bg-stone-800 px-5 py-4"
        >
          <p className="text-xs font-medium uppercase tracking-wider text-stone-500">
            {stat.label}
          </p>
          <p
            className="mt-1 text-2xl font-bold tabular-nums"
            style={{ color: stat.color ?? '#e7e5e4' /* stone-200 */ }}
          >
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}
