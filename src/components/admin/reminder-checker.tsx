'use client';

import { useState, useCallback } from 'react';

/* ---------------------------------------------------------------
   Types
   --------------------------------------------------------------- */

interface ReminderInfo {
  tender_id: string;
  package_code: string;
  vendor_id: string;
  vendor_name: string;
  elapsed_pct: number;
  reminder_type: 'reminder_50pct' | 'reminder_90pct';
  already_sent: boolean;
}

interface ReminderResponse {
  success: boolean;
  data?: {
    reminders: ReminderInfo[];
    new_reminders_logged: number;
    total_pending_vendors: number;
    message?: string;
  };
  error?: string;
}

/* ---------------------------------------------------------------
   Component
   --------------------------------------------------------------- */

export function ReminderChecker() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReminderResponse['data'] | null>(null);

  const handleCheck = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/reminders', { method: 'POST' });
      const json = (await res.json()) as ReminderResponse;

      if (!json.success) {
        setError(json.error ?? 'Failed to check reminders');
      } else {
        setResult(json.data ?? null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-stone-200">Submission Reminders</h2>
        <button
          type="button"
          onClick={handleCheck}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md bg-stone-700 px-4 py-2 text-sm font-medium text-stone-200 hover:bg-stone-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Checking...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
              Check Reminders
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-3">
          {result.message ? (
            <p className="text-sm text-stone-500">{result.message}</p>
          ) : (
            <>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-stone-400">
                  Pending vendors: <span className="text-stone-200 font-medium">{result.total_pending_vendors}</span>
                </span>
                {result.new_reminders_logged > 0 && (
                  <span className="text-amber-400">
                    {result.new_reminders_logged} new reminder{result.new_reminders_logged !== 1 ? 's' : ''} logged
                  </span>
                )}
              </div>

              {result.reminders.length === 0 ? (
                <p className="text-sm text-stone-500">No reminders due at this time.</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-stone-700">
                  <table className="w-full text-sm">
                    <thead className="bg-stone-800/80">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium text-stone-400">Vendor</th>
                        <th className="text-left px-4 py-3 font-medium text-stone-400">Package</th>
                        <th className="text-right px-4 py-3 font-medium text-stone-400">Elapsed</th>
                        <th className="text-left px-4 py-3 font-medium text-stone-400">Reminder</th>
                        <th className="text-left px-4 py-3 font-medium text-stone-400">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.reminders.map((rem, idx) => (
                        <tr
                          key={`${rem.vendor_id}-${rem.reminder_type}`}
                          className={idx % 2 === 0 ? 'bg-stone-900' : 'bg-stone-900/50'}
                        >
                          <td className="px-4 py-2.5 text-stone-200 font-medium whitespace-nowrap">
                            {rem.vendor_name}
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap">
                            <span className="font-mono text-xs text-amber-400">{rem.package_code}</span>
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums">
                            <span className={
                              rem.elapsed_pct >= 90
                                ? 'text-red-400 font-semibold'
                                : rem.elapsed_pct >= 50
                                  ? 'text-amber-400'
                                  : 'text-stone-300'
                            }>
                              {rem.elapsed_pct}%
                            </span>
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap">
                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                              rem.reminder_type === 'reminder_90pct'
                                ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                            }`}>
                              {rem.reminder_type === 'reminder_90pct' ? '90% Warning' : '50% Reminder'}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap">
                            {rem.already_sent ? (
                              <span className="text-xs text-stone-500">Already sent</span>
                            ) : (
                              <span className="text-xs text-emerald-400 font-medium">Newly logged</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
