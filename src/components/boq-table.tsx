'use client';

import type { BoqLineItem } from '@/lib/types/form-schema';

interface BoqTableProps {
  template: BoqLineItem[];
  rates: Record<string, number>;
  onRateChange: (code: string, rate: number) => void;
  errors: Record<string, string>;
}

function formatAED(value: number): string {
  return value.toLocaleString('en-AE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function DesktopTable({
  template,
  rates,
  onRateChange,
  errors,
  grandTotal,
}: BoqTableProps & { grandTotal: number }) {
  return (
    <div className="hidden sm:block w-full overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-stone-50">
            <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-stone-500">
              Code
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-stone-500">
              Description
            </th>
            <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-stone-500">
              Unit
            </th>
            <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-stone-500">
              Qty
            </th>
            <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-stone-500">
              Rate (AED)
            </th>
            <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-stone-500">
              Total (AED)
            </th>
          </tr>
        </thead>
        <tbody>
          {template.map((item, idx) => {
            const rate = rates[item.code] ?? 0;
            const lineTotal = item.quantity * rate;
            const error = errors[item.code];

            return (
              <tr
                key={item.code}
                className={idx % 2 === 0 ? 'bg-white' : 'bg-stone-50/50'}
              >
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-stone-600">
                  {item.code}
                </td>
                <td className="px-4 py-3 text-stone-900">{item.description}</td>
                <td className="whitespace-nowrap px-4 py-3 text-stone-600">
                  {item.unit}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-mono tabular-nums text-stone-600">
                  {item.quantity.toLocaleString()}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <div className="flex flex-col items-end gap-1">
                    <input
                      type="number"
                      value={rate || ''}
                      onChange={(e) => {
                        const parsed = parseFloat(e.target.value);
                        onRateChange(item.code, isNaN(parsed) ? 0 : parsed);
                      }}
                      min={0}
                      step={0.01}
                      placeholder="0.00"
                      className={[
                        'w-28 min-h-[36px] rounded-md border px-2 py-1 text-right font-mono text-sm tabular-nums',
                        'focus:outline-none focus:ring-2 focus:ring-amber-700 focus:border-amber-700',
                        error
                          ? 'border-red-600 focus:ring-red-600'
                          : 'border-stone-300',
                      ].join(' ')}
                      aria-label={`Rate for ${item.code}`}
                    />
                    {error && (
                      <span className="text-xs text-red-700">{error}</span>
                    )}
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-mono tabular-nums font-medium text-stone-900">
                  {formatAED(lineTotal)}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-stone-300 bg-stone-50">
            <td
              colSpan={5}
              className="px-4 py-4 text-right text-sm font-semibold text-stone-900"
            >
              Grand Total (AED)
            </td>
            <td className="whitespace-nowrap px-4 py-4 text-right font-mono tabular-nums text-base font-bold text-stone-900">
              {formatAED(grandTotal)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function MobileCards({
  template,
  rates,
  onRateChange,
  errors,
  grandTotal,
}: BoqTableProps & { grandTotal: number }) {
  return (
    <div className="flex flex-col gap-3 sm:hidden">
      {template.map((item) => {
        const rate = rates[item.code] ?? 0;
        const lineTotal = item.quantity * rate;
        const error = errors[item.code];

        return (
          <div
            key={item.code}
            className="rounded-lg border border-stone-200 bg-white p-4"
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-stone-900">
                {item.description}
              </p>
              <span className="flex-shrink-0 font-mono text-xs text-stone-500">
                {item.code}
              </span>
            </div>

            <div className="mb-3 flex gap-4 text-xs text-stone-500">
              <span>
                Unit: <span className="text-stone-700">{item.unit}</span>
              </span>
              <span>
                Qty:{' '}
                <span className="font-mono tabular-nums text-stone-700">
                  {item.quantity.toLocaleString()}
                </span>
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col gap-1">
                <label
                  htmlFor={`rate-${item.code}`}
                  className="text-xs font-medium text-stone-500"
                >
                  Rate (AED)
                </label>
                <input
                  id={`rate-${item.code}`}
                  type="number"
                  value={rate || ''}
                  onChange={(e) => {
                    const parsed = parseFloat(e.target.value);
                    onRateChange(item.code, isNaN(parsed) ? 0 : parsed);
                  }}
                  min={0}
                  step={0.01}
                  placeholder="0.00"
                  className={[
                    'w-28 min-h-[44px] rounded-md border px-3 py-2 text-right font-mono text-[16px] tabular-nums',
                    'focus:outline-none focus:ring-2 focus:ring-amber-700 focus:border-amber-700',
                    error
                      ? 'border-red-600 focus:ring-red-600'
                      : 'border-stone-300',
                  ].join(' ')}
                />
                {error && (
                  <span className="text-xs text-red-700">{error}</span>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-stone-500">Total</p>
                <p className="font-mono tabular-nums text-sm font-semibold text-stone-900">
                  {formatAED(lineTotal)}
                </p>
              </div>
            </div>
          </div>
        );
      })}

      {/* Sticky grand total */}
      <div className="sticky bottom-0 z-10 rounded-lg border-2 border-stone-300 bg-stone-50 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-stone-900">
            Grand Total (AED)
          </span>
          <span className="font-mono tabular-nums text-lg font-bold text-stone-900">
            {formatAED(grandTotal)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function BoqTable(props: BoqTableProps) {
  const { template, rates } = props;

  const grandTotal = template.reduce((sum, item) => {
    const rate = rates[item.code] ?? 0;
    return sum + item.quantity * rate;
  }, 0);

  return (
    <>
      <DesktopTable {...props} grandTotal={grandTotal} />
      <MobileCards {...props} grandTotal={grandTotal} />
    </>
  );
}
