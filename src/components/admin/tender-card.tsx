import Link from 'next/link';
import { formatGST } from '@/lib/date';
import type { TenderCardData } from '@/types';

interface TenderCardProps {
  tender: TenderCardData;
}

export function TenderCard({ tender }: TenderCardProps) {
  const deadlineDate = new Date(tender.closing_deadline);
  const isPast = deadlineDate.getTime() < Date.now();

  return (
    <Link
      href={`/admin/tenders/${tender.id}`}
      className="group block rounded-lg bg-stone-800 border border-stone-700 p-5 transition-all hover:border-l-[3px] hover:border-l-amber-500 hover:border-t-stone-700 hover:border-r-stone-700 hover:border-b-stone-700"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded bg-amber-500/10 px-2 py-0.5 text-xs font-mono font-semibold text-amber-400 border border-amber-500/20">
            {tender.package_code}
          </span>
          {tender.is_active && !tender.is_archived && (
            <span className="inline-flex items-center rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/20">
              Active
            </span>
          )}
          {tender.is_archived && (
            <span className="inline-flex items-center rounded bg-stone-600/30 px-2 py-0.5 text-xs font-medium text-stone-400 border border-stone-600/30">
              Archived
            </span>
          )}
        </div>
      </div>

      {/* Package name */}
      <h3 className="text-base font-semibold text-stone-100 mb-1 group-hover:text-amber-300 transition-colors">
        {tender.package_name}
      </h3>

      {/* Project name */}
      <p className="text-sm text-stone-400 mb-4">
        {tender.project_name}
      </p>

      {/* Footer metrics */}
      <div className="flex items-center gap-4 text-xs text-stone-500">
        <span className={isPast ? 'text-red-400' : 'text-stone-400'}>
          Deadline: {formatGST(tender.closing_deadline)}
        </span>
        <span className="text-stone-600">|</span>
        <span>{tender.submission_count} submission{tender.submission_count !== 1 ? 's' : ''}</span>
        <span className="text-stone-600">|</span>
        <span>{tender.invite_count} invite{tender.invite_count !== 1 ? 's' : ''}</span>
      </div>
    </Link>
  );
}
