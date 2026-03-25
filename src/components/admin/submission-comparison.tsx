'use client';

import { useCallback, useMemo } from 'react';
import type { BoqTemplateJson, BoqSubmissionItemJson } from '@/lib/types/database';

/* ---------------------------------------------------------------
   Types
   --------------------------------------------------------------- */

interface SubmissionEntry {
  id: string;
  vendor_id: string;
  vendor_name: string;
  boq_data: BoqSubmissionItemJson[];
  total_quote_aed: number;
  material_option: string;
  compliance_flags: string[];
}

interface SubmissionComparisonProps {
  submissions: SubmissionEntry[];
  boq_template: BoqTemplateJson;
}

/* ---------------------------------------------------------------
   Component
   --------------------------------------------------------------- */

export function SubmissionComparison({ submissions, boq_template }: SubmissionComparisonProps) {
  /** Build a lookup: vendor_id -> { boq_code -> rate } */
  const ratesByVendor = useMemo(() => {
    const map = new Map<string, Map<string, number>>();
    for (const sub of submissions) {
      const vendorRates = new Map<string, number>();
      for (const item of sub.boq_data) {
        vendorRates.set(item.code, item.rate);
      }
      map.set(sub.vendor_id, vendorRates);
    }
    return map;
  }, [submissions]);

  /** For each BOQ code, find the lowest rate across all vendors */
  const lowestRates = useMemo(() => {
    const map = new Map<string, number>();
    for (const lineItem of boq_template) {
      let min = Infinity;
      for (const sub of submissions) {
        const vendorRates = ratesByVendor.get(sub.vendor_id);
        const rate = vendorRates?.get(lineItem.code);
        if (rate !== undefined && rate < min) {
          min = rate;
        }
      }
      if (min !== Infinity) {
        map.set(lineItem.code, min);
      }
    }
    return map;
  }, [boq_template, submissions, ratesByVendor]);

  /** Export comparison data as CSV */
  const handleExportCSV = useCallback(() => {
    const headers = ['BOQ Code', 'Description', 'Unit', 'Qty', ...submissions.map((s) => s.vendor_name)];
    const rows = boq_template.map((item) => {
      const vendorCells = submissions.map((sub) => {
        const rate = ratesByVendor.get(sub.vendor_id)?.get(item.code);
        return rate !== undefined ? rate.toString() : '';
      });
      return [item.code, item.description, item.unit, item.quantity.toString(), ...vendorCells];
    });

    // Totals row
    const totalsRow = ['', 'TOTAL', '', '', ...submissions.map((s) => s.total_quote_aed.toString())];
    rows.push(totalsRow);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'submission-comparison.csv';
    link.click();
    URL.revokeObjectURL(url);
  }, [submissions, boq_template, ratesByVendor]);

  if (submissions.length === 0) {
    return (
      <div className="rounded-lg bg-stone-800 border border-stone-700 p-8 text-center text-stone-500">
        No submissions received yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Export button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 rounded-md bg-stone-700 px-3 py-2 text-sm font-medium text-stone-200 hover:bg-stone-600 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Comparison table */}
      <div className="overflow-x-auto rounded-lg border border-stone-700">
        <table className="w-full text-sm">
          <thead className="bg-stone-800/80 sticky top-0 z-10">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-stone-400 whitespace-nowrap">BOQ Item</th>
              <th className="text-left px-4 py-3 font-medium text-stone-400 whitespace-nowrap">Unit</th>
              <th className="text-right px-4 py-3 font-medium text-stone-400 whitespace-nowrap">Qty</th>
              {submissions.map((sub) => (
                <th key={sub.vendor_id} className="text-right px-4 py-3 font-medium text-stone-400 whitespace-nowrap">
                  {sub.vendor_name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {boq_template.map((item, idx) => {
              const lowest = lowestRates.get(item.code);
              return (
                <tr
                  key={item.code}
                  className={idx % 2 === 0 ? 'bg-stone-900' : 'bg-stone-900/50'}
                >
                  <td className="px-4 py-2.5 text-stone-300 whitespace-nowrap">
                    <span className="font-mono text-xs text-stone-500 mr-2">{item.code}</span>
                    {item.description}
                  </td>
                  <td className="px-4 py-2.5 text-stone-400 whitespace-nowrap">{item.unit}</td>
                  <td className="px-4 py-2.5 text-stone-400 text-right tabular-nums">{item.quantity}</td>
                  {submissions.map((sub) => {
                    const rate = ratesByVendor.get(sub.vendor_id)?.get(item.code);
                    const isLowest = rate !== undefined && rate === lowest;
                    return (
                      <td
                        key={sub.vendor_id}
                        className={`px-4 py-2.5 text-right tabular-nums whitespace-nowrap ${
                          isLowest ? 'text-emerald-400 font-semibold' : 'text-stone-300'
                        }`}
                      >
                        {rate !== undefined ? rate.toLocaleString('en-AE', { minimumFractionDigits: 2 }) : '\u2014'}
                      </td>
                    );
                  })}
                </tr>
              );
            })}

            {/* Totals row */}
            <tr className="border-t border-stone-700 bg-stone-800 font-semibold">
              <td className="px-4 py-3 text-stone-200" colSpan={3}>
                TOTAL (AED)
              </td>
              {submissions.map((sub) => {
                const allTotals = submissions.map((s) => s.total_quote_aed);
                const minTotal = Math.min(...allTotals);
                const isLowest = sub.total_quote_aed === minTotal;
                return (
                  <td
                    key={sub.vendor_id}
                    className={`px-4 py-3 text-right tabular-nums ${
                      isLowest ? 'text-emerald-400' : 'text-stone-200'
                    }`}
                  >
                    {sub.total_quote_aed.toLocaleString('en-AE', { minimumFractionDigits: 2 })}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Vendor metadata rows */}
      <div className="overflow-x-auto rounded-lg border border-stone-700">
        <table className="w-full text-sm">
          <tbody>
            <tr className="bg-stone-900">
              <td className="px-4 py-2.5 text-stone-400 font-medium w-48">Material Option</td>
              {submissions.map((sub) => (
                <td key={sub.vendor_id} className="px-4 py-2.5 text-stone-300 text-right">
                  {sub.material_option === 'labour_material' ? 'Labour + Material' : 'Labour Only'}
                </td>
              ))}
            </tr>
            <tr className="bg-stone-900/50">
              <td className="px-4 py-2.5 text-stone-400 font-medium w-48">Compliance Flags</td>
              {submissions.map((sub) => (
                <td key={sub.vendor_id} className="px-4 py-2.5 text-right">
                  {sub.compliance_flags.length === 0 ? (
                    <span className="text-emerald-400 text-xs">All clear</span>
                  ) : (
                    <span className="text-amber-400 text-xs">{sub.compliance_flags.join(', ')}</span>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
