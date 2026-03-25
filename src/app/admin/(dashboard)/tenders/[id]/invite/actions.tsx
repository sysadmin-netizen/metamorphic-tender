'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

/* ---------------------------------------------------------------
   Types
   --------------------------------------------------------------- */

interface InviteActionsProps {
  tenderId: string;
}

interface ApiResponse {
  success: boolean;
  error?: string;
}

/* ---------------------------------------------------------------
   Component: Generate Invites + Download CSV buttons
   --------------------------------------------------------------- */

export function InviteActions({ tenderId }: InviteActionsProps) {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tender_config_id: tenderId }),
      });

      const json: ApiResponse = await res.json();
      if (!json.success) {
        setError(json.error ?? 'Failed to generate invites');
        setGenerating(false);
        return;
      }

      router.refresh();
    } catch {
      setError('Network error. Please try again.');
    }
    setGenerating(false);
  }, [tenderId, router]);

  /** EC-26: Download invites as CSV */
  const handleDownloadCSV = useCallback(() => {
    window.open(`/api/invites/export?tender_config_id=${tenderId}`, '_blank');
  }, [tenderId]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating}
          className="inline-flex items-center gap-2 rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-stone-900 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {generating ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-stone-800 border-t-transparent" />
              Generating...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              Generate Invites
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleDownloadCSV}
          className="inline-flex items-center gap-2 rounded-md border border-stone-700 bg-stone-800 px-4 py-2 text-sm font-medium text-stone-300 hover:bg-stone-700 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Download CSV
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2.5 text-sm text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}
