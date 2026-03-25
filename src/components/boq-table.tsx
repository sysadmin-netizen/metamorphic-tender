'use client';

import type { BoqLineItem } from '@/lib/types/form-schema';

interface BoqTableProps {
  template: BoqLineItem[];
  rates: Record<string, number>;
  quantities: Record<string, number>;
  onRateChange: (code: string, rate: number) => void;
  onQtyChange: (code: string, qty: number) => void;
  errors: Record<string, string>;
  qtyEditable: boolean;
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
  quantities,
  onRateChange,
  onQtyChange,
  errors,
  grandTotal,
  qtyEditable,
}: BoqTableProps & { grandTotal: number }) {
  return (
    <div className="hidden sm:block w-full overflow-x-auto">
      {qtyEditable && (
        <p className="text-[13px] text-[var(--md-grey)] mb-4">
          Vendors must assess quantities on site inspection. Enter your quantities and unit rates below. Line totals auto-calculate.
        </p>
      )}
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-[var(--md-dark)]">
            <th className="whitespace-nowrap px-3 py-2.5 text-left text-[11px] font-medium uppercase tracking-[0.5px] text-[var(--accent)] border-b-2 border-[var(--accent)]"
              style={{ width: '5%' }}>
              #
            </th>
            <th className="px-3 py-2.5 text-left text-[11px] font-medium uppercase tracking-[0.5px] text-[var(--accent)] border-b-2 border-[var(--accent)]"
              style={{ width: '35%' }}>
              Description
            </th>
            <th className="whitespace-nowrap px-3 py-2.5 text-left text-[11px] font-medium uppercase tracking-[0.5px] text-[var(--accent)] border-b-2 border-[var(--accent)]"
              style={{ width: '12%' }}>
              Unit
            </th>
            <th className="whitespace-nowrap px-3 py-2.5 text-right text-[11px] font-medium uppercase tracking-[0.5px] text-[var(--accent)] border-b-2 border-[var(--accent)]"
              style={{ width: '14%' }}>
              Qty
            </th>
            <th className="whitespace-nowrap px-3 py-2.5 text-right text-[11px] font-medium uppercase tracking-[0.5px] text-[var(--accent)] border-b-2 border-[var(--accent)]"
              style={{ width: '16%' }}>
              Rate (AED)
            </th>
            <th className="whitespace-nowrap px-3 py-2.5 text-right text-[11px] font-medium uppercase tracking-[0.5px] text-[var(--accent)] border-b-2 border-[var(--accent)]"
              style={{ width: '18%' }}>
              Total (AED)
            </th>
          </tr>
        </thead>
        <tbody>
          {template.map((item, idx) => {
            const rate = rates[item.code] ?? 0;
            const qty = qtyEditable ? (quantities[item.code] ?? 0) : item.quantity;
            const lineTotal = qty * rate;
            const error = errors[item.code];

            return (
              <tr key={item.code} className="border-b border-[#333]">
                <td className="px-3 py-2.5 text-sm text-[var(--text-inverse)]">
                  {idx + 1}
                </td>
                <td className="px-3 py-2.5 text-sm font-medium text-[var(--text-inverse)]">
                  {item.description}
                </td>
                <td className="px-3 py-2.5 text-[13px] text-[var(--md-grey)]">
                  {item.unit}
                </td>
                <td className="px-3 py-2.5 text-right">
                  {qtyEditable ? (
                    <input
                      type="number"
                      value={quantities[item.code] || ''}
                      onChange={(e) => {
                        const parsed = parseFloat(e.target.value);
                        onQtyChange(item.code, isNaN(parsed) ? 0 : parsed);
                      }}
                      min={0}
                      step={0.01}
                      placeholder="0"
                      className="w-full bg-[var(--md-dark)] border border-[#555] text-[var(--text-inverse)] px-2.5 py-2 text-sm text-right font-[inherit] focus:outline-none focus:border-[var(--accent)]"
                      aria-label={`Quantity for ${item.code}`}
                    />
                  ) : (
                    <span className="font-mono tabular-nums text-[var(--text-inverse)]">
                      {item.quantity.toLocaleString()}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-right">
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
                        'w-full bg-[var(--md-dark)] border text-[var(--text-inverse)] px-2.5 py-2 text-sm text-right font-[inherit] focus:outline-none focus:border-[var(--accent)]',
                        error ? 'border-[var(--md-red)]' : 'border-[#555]',
                      ].join(' ')}
                      aria-label={`Rate for ${item.code}`}
                    />
                    {error && (
                      <span className="text-xs text-[var(--md-red)]">{error}</span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2.5 text-right font-mono tabular-nums font-semibold text-[var(--accent)]">
                  {formatAED(lineTotal)}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-[var(--md-dark)] border-t-2 border-[var(--accent)]">
            <td
              colSpan={5}
              className="px-3 py-3 text-right text-sm font-bold text-[var(--accent)]"
            >
              GRAND TOTAL (AED)
            </td>
            <td className="whitespace-nowrap px-3 py-3 text-right font-mono tabular-nums text-base font-bold text-[var(--accent)]">
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
  quantities,
  onRateChange,
  onQtyChange,
  errors,
  grandTotal,
  qtyEditable,
}: BoqTableProps & { grandTotal: number }) {
  return (
    <div className="flex flex-col gap-3 sm:hidden">
      {qtyEditable && (
        <p className="text-[13px] text-[var(--md-grey)] mb-2">
          Vendors must assess quantities on site inspection. Enter your quantities and unit rates below.
        </p>
      )}
      {template.map((item, idx) => {
        const rate = rates[item.code] ?? 0;
        const qty = qtyEditable ? (quantities[item.code] ?? 0) : item.quantity;
        const lineTotal = qty * rate;
        const error = errors[item.code];

        return (
          <div
            key={item.code}
            className="border border-[#444] bg-[var(--md-dark)] p-4"
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-[var(--text-inverse)]">
                {item.description}
              </p>
              <span className="flex-shrink-0 text-xs text-[var(--md-grey)]">
                #{idx + 1}
              </span>
            </div>

            <div className="mb-3 flex gap-4 text-xs text-[var(--md-grey)]">
              <span>
                Unit: <span className="text-[var(--text-inverse)]">{item.unit}</span>
              </span>
              {!qtyEditable && (
                <span>
                  Qty:{' '}
                  <span className="font-mono tabular-nums text-[var(--text-inverse)]">
                    {item.quantity.toLocaleString()}
                  </span>
                </span>
              )}
            </div>

            <div className={`flex items-end gap-3 ${qtyEditable ? 'flex-wrap' : 'justify-between'}`}>
              {qtyEditable && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[var(--md-grey)]">
                    Qty
                  </label>
                  <input
                    type="number"
                    value={quantities[item.code] || ''}
                    onChange={(e) => {
                      const parsed = parseFloat(e.target.value);
                      onQtyChange(item.code, isNaN(parsed) ? 0 : parsed);
                    }}
                    min={0}
                    step={0.01}
                    placeholder="0"
                    className="w-24 min-h-[44px] bg-[var(--bg-primary)] border border-[#555] text-[var(--text-inverse)] px-3 py-2 text-right text-[16px] font-[inherit] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
              )}
              <div className="flex flex-col gap-1">
                <label
                  htmlFor={`rate-${item.code}`}
                  className="text-xs font-medium text-[var(--md-grey)]"
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
                    'w-28 min-h-[44px] bg-[var(--bg-primary)] border text-[var(--text-inverse)] px-3 py-2 text-right text-[16px] font-[inherit] focus:outline-none focus:border-[var(--accent)]',
                    error ? 'border-[var(--md-red)]' : 'border-[#555]',
                  ].join(' ')}
                />
                {error && (
                  <span className="text-xs text-[var(--md-red)]">{error}</span>
                )}
              </div>
              <div className="text-right ml-auto">
                <p className="text-xs text-[var(--md-grey)]">Total</p>
                <p className="font-mono tabular-nums text-sm font-semibold text-[var(--accent)]">
                  {formatAED(lineTotal)}
                </p>
              </div>
            </div>
          </div>
        );
      })}

      {/* Sticky grand total */}
      <div className="sticky bottom-0 z-10 border-t-2 border-[var(--accent)] bg-[var(--md-dark)] px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold uppercase text-[var(--accent)]">
            Grand Total (AED)
          </span>
          <span className="font-mono tabular-nums text-lg font-bold text-[var(--accent)]">
            {formatAED(grandTotal)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function BoqTable(props: BoqTableProps) {
  const { template, rates, quantities, qtyEditable } = props;

  const grandTotal = template.reduce((sum, item) => {
    const rate = rates[item.code] ?? 0;
    const qty = qtyEditable ? (quantities[item.code] ?? 0) : item.quantity;
    return sum + qty * rate;
  }, 0);

  return (
    <>
      <DesktopTable {...props} grandTotal={grandTotal} />
      <MobileCards {...props} grandTotal={grandTotal} />
    </>
  );
}
