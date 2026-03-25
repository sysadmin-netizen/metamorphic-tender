import type { BoqSubmissionItemJson } from '@/lib/types/database';
import { formatGST } from '@/lib/date';

interface SubmissionReceiptProps {
  submission: {
    form_data: Record<string, unknown>;
    boq_data: BoqSubmissionItemJson[];
    total_quote_aed: number;
    submitted_at: string;
  };
  vendorName: string;
  packageName: string;
}

function formatAED(value: number): string {
  return value.toLocaleString('en-AE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function SubmissionReceipt({
  submission,
  vendorName,
  packageName,
}: SubmissionReceiptProps) {
  const formEntries = Object.entries(submission.form_data);

  return (
    <div className="flex flex-col gap-6">
      {/* Success banner */}
      <div className="rounded-lg border border-green-200 bg-green-50 p-6">
        <div className="flex items-start gap-3">
          <svg
            className="mt-0.5 h-6 w-6 flex-shrink-0 text-green-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-green-900">
              Submission Received
            </h2>
            <p className="text-sm text-green-800">
              You have already submitted your tender for{' '}
              <strong>{packageName}</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Summary card */}
      <div className="rounded-lg border border-stone-200 bg-white p-6">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-stone-500">
          Submission Summary
        </h3>
        <dl className="flex flex-col gap-3">
          <div className="flex justify-between border-b border-stone-100 pb-2">
            <dt className="text-sm text-stone-500">Vendor</dt>
            <dd className="text-sm font-medium text-stone-900">{vendorName}</dd>
          </div>
          <div className="flex justify-between border-b border-stone-100 pb-2">
            <dt className="text-sm text-stone-500">Submitted</dt>
            <dd className="text-sm font-medium text-stone-900">
              {formatGST(submission.submitted_at)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-stone-500">Total Quote</dt>
            <dd className="font-mono tabular-nums text-base font-bold text-stone-900">
              AED {formatAED(submission.total_quote_aed)}
            </dd>
          </div>
        </dl>
      </div>

      {/* Form data read-only */}
      {formEntries.length > 0 && (
        <div className="rounded-lg border border-stone-200 bg-white p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-stone-500">
            Form Responses
          </h3>
          <dl className="flex flex-col gap-2">
            {formEntries.map(([key, value]) => (
              <div
                key={key}
                className="flex flex-col gap-0.5 border-b border-stone-100 py-2 last:border-0 sm:flex-row sm:gap-4"
              >
                <dt className="text-sm text-stone-500 sm:w-1/3">{key}</dt>
                <dd className="text-sm text-stone-900 sm:w-2/3">
                  {String(value)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* BOQ data read-only */}
      {submission.boq_data.length > 0 && (
        <div className="rounded-lg border border-stone-200 bg-white p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-stone-500">
            BOQ Summary
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50">
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-stone-500">
                    Code
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-stone-500">
                    Rate (AED)
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-stone-500">
                    Total (AED)
                  </th>
                </tr>
              </thead>
              <tbody>
                {submission.boq_data.map((item, idx) => (
                  <tr
                    key={item.code}
                    className={idx % 2 === 0 ? 'bg-white' : 'bg-stone-50/50'}
                  >
                    <td className="px-3 py-2 font-mono text-xs text-stone-600">
                      {item.code}
                    </td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums text-stone-900">
                      {formatAED(item.rate)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums font-medium text-stone-900">
                      {formatAED(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
