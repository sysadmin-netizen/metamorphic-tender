import { formatGST } from '@/lib/date';
import { COMPANY_NAME } from '@/lib/constants';

interface LinkExpiredProps {
  expiredAt: string;
  closingDeadline: string;
  packageName: string;
}

export function LinkExpired({
  expiredAt,
  closingDeadline,
  packageName,
}: LinkExpiredProps) {
  const tokenExpiry = new Date(expiredAt).getTime();
  const deadlineTime = new Date(closingDeadline).getTime();
  const tokenExpiredFirst = tokenExpiry <= deadlineTime;

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
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-red-900">Link Expired</h2>
            {tokenExpiredFirst ? (
              <p className="text-sm text-red-800">
                Your access link for <strong>{packageName}</strong> expired on{' '}
                {formatGST(expiredAt)}.
              </p>
            ) : (
              <p className="text-sm text-red-800">
                The tender deadline for <strong>{packageName}</strong> passed on{' '}
                {formatGST(closingDeadline)}.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-stone-200 bg-white p-6 text-center">
        <p className="text-sm text-stone-600">
          Contact {COMPANY_NAME} to request a new link.
        </p>
      </div>
    </div>
  );
}
