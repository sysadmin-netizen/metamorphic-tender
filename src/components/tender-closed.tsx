import { formatGST } from '@/lib/date';

interface TenderClosedProps {
  closingDeadline: string;
  packageName: string;
}

export function TenderClosed({ closingDeadline, packageName }: TenderClosedProps) {
  return (
    <div className="mx-auto max-w-lg">
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <div className="flex items-start gap-3">
          <svg
            className="mt-0.5 h-6 w-6 flex-shrink-0 text-red-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-red-900">Tender Closed</h2>
            <p className="text-sm text-red-800">
              This tender closed on {formatGST(closingDeadline)}.
            </p>
            <p className="text-sm text-stone-600">
              Submissions for <strong>{packageName}</strong> are no longer accepted.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
