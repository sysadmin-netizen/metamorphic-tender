'use client';

import { useCallback, useMemo, useState } from 'react';
import type { BoqTemplateJson, BoqSubmissionItemJson } from '@/lib/types/database';

/* ---------------------------------------------------------------
   Types
   --------------------------------------------------------------- */

interface SubmissionScores {
  price_score: number | null;
  quality_score: number | null;
  tier_score: number | null;
  composite_score: number | null;
}

interface SubmissionEntry {
  id: string;
  vendor_id: string;
  vendor_name: string;
  boq_data: BoqSubmissionItemJson[];
  total_quote_aed: number;
  material_option: string;
  compliance_flags: string[];
  scores: SubmissionScores;
}

interface SubmissionComparisonProps {
  submissions: SubmissionEntry[];
  boq_template: BoqTemplateJson;
  tenderId: string;
}

/* ---------------------------------------------------------------
   Compliance flag badge colors
   --------------------------------------------------------------- */

function flagColor(flag: string): string {
  if (flag.startsWith('MetaForge') || flag.startsWith('Insurance')) {
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  }
  return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
}

/* ---------------------------------------------------------------
   Component
   --------------------------------------------------------------- */

export function SubmissionComparison({ submissions, boq_template, tenderId }: SubmissionComparisonProps) {
  const [scoring, setScoring] = useState(false);
  const [scoringError, setScoringError] = useState<string | null>(null);
  const [scoringDone, setScoringDone] = useState(false);

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
        if (rate !== undefined && rate > 0 && rate < min) {
          min = rate;
        }
      }
      if (min !== Infinity) {
        map.set(lineItem.code, min);
      }
    }
    return map;
  }, [boq_template, submissions, ratesByVendor]);

  /** Find the highest composite score */
  const topScoredVendorId = useMemo(() => {
    let maxScore = -1;
    let topVendorId: string | null = null;
    for (const sub of submissions) {
      if (sub.scores.composite_score !== null && sub.scores.composite_score > maxScore) {
        maxScore = sub.scores.composite_score;
        topVendorId = sub.vendor_id;
      }
    }
    return topVendorId;
  }, [submissions]);

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

  /** Run AI scoring */
  const handleRunScoring = useCallback(async () => {
    setScoring(true);
    setScoringError(null);
    setScoringDone(false);

    try {
      const res = await fetch(`/api/tenders/${tenderId}/score`, {
        method: 'POST',
      });
      const json = await res.json() as { success: boolean; error?: string };
      if (!json.success) {
        setScoringError(json.error ?? 'Scoring failed');
      } else {
        setScoringDone(true);
        // Reload page to show updated scores
        window.location.reload();
      }
    } catch (err) {
      setScoringError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setScoring(false);
    }
  }, [tenderId]);

  if (submissions.length === 0) {
    return (
      <div className="rounded-lg bg-stone-800 border border-stone-700 p-8 text-center text-stone-500">
        No submissions received yet.
      </div>
    );
  }

  const hasScores = submissions.some((s) => s.scores.composite_score !== null);

  return (
    <div className="space-y-4">
      {/* Action buttons */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRunScoring}
            disabled={scoring}
            className="inline-flex items-center gap-2 rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-stone-900 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {scoring ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Scoring...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                </svg>
                Run AI Scoring
              </>
            )}
          </button>
          {scoringDone && (
            <span className="text-sm text-emerald-400">Scoring complete. Refreshing...</span>
          )}
        </div>

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

      {scoringError && (
        <div className="rounded-md bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {scoringError}
        </div>
      )}

      {/* Scores table (only shown if scoring has been run) */}
      {hasScores && (
        <div className="overflow-x-auto rounded-lg border border-amber-500/30">
          <table className="w-full text-sm">
            <thead className="bg-stone-800/80 sticky top-0 z-10">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-amber-400 whitespace-nowrap">Rank</th>
                <th className="text-left px-4 py-3 font-medium text-amber-400 whitespace-nowrap">Vendor</th>
                <th className="text-right px-4 py-3 font-medium text-stone-400 whitespace-nowrap">Total (AED)</th>
                <th className="text-right px-4 py-3 font-medium text-stone-400 whitespace-nowrap">Price Score</th>
                <th className="text-right px-4 py-3 font-medium text-stone-400 whitespace-nowrap">Quality Score</th>
                <th className="text-right px-4 py-3 font-medium text-stone-400 whitespace-nowrap">Tier Score</th>
                <th className="text-right px-4 py-3 font-medium text-amber-400 whitespace-nowrap">Composite</th>
                <th className="text-left px-4 py-3 font-medium text-stone-400 whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody>
              {[...submissions]
                .sort((a, b) => (b.scores.composite_score ?? 0) - (a.scores.composite_score ?? 0))
                .map((sub, idx) => {
                  const isTop = sub.vendor_id === topScoredVendorId;
                  return (
                    <tr
                      key={sub.id}
                      className={
                        isTop
                          ? 'bg-amber-500/10 border-l-2 border-l-amber-500'
                          : idx % 2 === 0
                            ? 'bg-stone-900'
                            : 'bg-stone-900/50'
                      }
                    >
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                          isTop ? 'bg-amber-500 text-stone-900' : 'bg-stone-800 text-stone-400'
                        }`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className={`px-4 py-2.5 font-medium whitespace-nowrap ${isTop ? 'text-amber-300' : 'text-stone-200'}`}>
                        {sub.vendor_name}
                        {isTop && <span className="ml-2 text-xs text-amber-400 font-normal">RECOMMENDED</span>}
                      </td>
                      <td className="px-4 py-2.5 text-stone-300 text-right tabular-nums">
                        {sub.total_quote_aed.toLocaleString('en-AE', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-2.5 text-stone-300 text-right tabular-nums">
                        {sub.scores.price_score?.toFixed(1) ?? '\u2014'}
                      </td>
                      <td className="px-4 py-2.5 text-stone-300 text-right tabular-nums">
                        {sub.scores.quality_score?.toFixed(1) ?? '\u2014'}
                      </td>
                      <td className="px-4 py-2.5 text-stone-300 text-right tabular-nums">
                        {sub.scores.tier_score?.toFixed(0) ?? '\u2014'}
                      </td>
                      <td className={`px-4 py-2.5 text-right tabular-nums font-semibold ${isTop ? 'text-amber-400' : 'text-stone-200'}`}>
                        {sub.scores.composite_score?.toFixed(1) ?? '\u2014'}
                      </td>
                      <td className="px-4 py-2.5">
                        {isTop && (
                          <button
                            type="button"
                            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors"
                          >
                            Award to {sub.vendor_name}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}

      {/* BOQ Comparison table */}
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
                    const isLowest = rate !== undefined && rate > 0 && rate === lowest;
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

      {/* Vendor metadata + compliance rows */}
      <div className="overflow-x-auto rounded-lg border border-stone-700">
        <table className="w-full text-sm">
          <tbody>
            <tr className="bg-stone-900">
              <td className="px-4 py-2.5 text-stone-400 font-medium w-48">Material Option</td>
              {submissions.map((sub) => (
                <td key={sub.vendor_id} className="px-4 py-2.5 text-stone-300 text-right">
                  {sub.material_option === 'labour_material'
                    ? 'Labour + Material'
                    : sub.material_option === 'split_rate'
                      ? 'Split Rate'
                      : 'Labour Only'}
                </td>
              ))}
            </tr>
            <tr className="bg-stone-900/50">
              <td className="px-4 py-2.5 text-stone-400 font-medium w-48">Compliance Flags</td>
              {submissions.map((sub) => (
                <td key={sub.vendor_id} className="px-4 py-2.5 text-right">
                  {sub.compliance_flags.length === 0 ? (
                    <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                      All clear
                    </span>
                  ) : (
                    <div className="flex flex-wrap justify-end gap-1">
                      {sub.compliance_flags.map((flag, i) => (
                        <span
                          key={i}
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${flagColor(flag)}`}
                        >
                          {flag}
                        </span>
                      ))}
                    </div>
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
