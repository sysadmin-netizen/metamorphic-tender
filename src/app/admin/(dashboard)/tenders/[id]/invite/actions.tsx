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

interface QuickInviteResponse {
  success: boolean;
  token?: string;
  link?: string;
  vendor_id?: string;
  error?: string;
}

/* ---------------------------------------------------------------
   Component: Copy Link button — copies vendor invite URL to clipboard
   --------------------------------------------------------------- */

interface CopyLinkButtonProps {
  token: string;
}

export function CopyLinkButton({ token }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);
  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const handleCopy = useCallback(async () => {
    const link = `${appUrl}/t/${token}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }, [token, appUrl]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
        copied
          ? 'border-green-600 bg-green-600/10 text-green-400'
          : 'border-stone-600 bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-stone-200'
      }`}
      title="Copy invite link"
    >
      {copied ? (
        <span className="flex items-center gap-1">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
          Copied
        </span>
      ) : (
        <span className="flex items-center gap-1">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-3.02a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L4.25 8.688" /></svg>
          Copy Link
        </span>
      )}
    </button>
  );
}

/* ---------------------------------------------------------------
   Component: Re-issue button (EC-25)
   POST /api/invites/reissue with JSON body { vendor_tender_id }
   --------------------------------------------------------------- */

interface ReissueButtonProps {
  vendorTenderId: string;
}

export function ReissueButton({ vendorTenderId }: ReissueButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleReissue = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch('/api/invites/reissue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendor_tender_id: vendorTenderId }),
      });
      const json: ApiResponse = await res.json();
      if (!json.success) {
        setError(json.error ?? 'Failed to re-issue invite');
        setLoading(false);
        return;
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  }, [vendorTenderId, router]);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleReissue}
        disabled={loading || success}
        className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          success
            ? 'border-green-600 bg-green-600/10 text-green-400'
            : 'border-stone-600 bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-amber-400'
        }`}
      >
        {loading ? 'Re-issuing...' : success ? 'Done!' : 'Re-issue'}
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}

/* ---------------------------------------------------------------
   Component: Quick Link Generation + Generate Invites + Download CSV
   --------------------------------------------------------------- */

export function InviteActions({ tenderId }: InviteActionsProps) {
  const router = useRouter();

  // Quick link state
  const [quickCompanyName, setQuickCompanyName] = useState('');
  const [quickContactName, setQuickContactName] = useState('');
  const [quickWhatsapp, setQuickWhatsapp] = useState('');
  const [quickGenerating, setQuickGenerating] = useState(false);
  const [quickLink, setQuickLink] = useState<string | null>(null);
  const [quickCopied, setQuickCopied] = useState(false);
  const [quickError, setQuickError] = useState<string | null>(null);

  // Bulk generate state
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Generate a quick shareable link for anyone */
  const handleQuickGenerate = useCallback(async () => {
    setQuickGenerating(true);
    setQuickError(null);
    setQuickLink(null);
    setQuickCopied(false);

    try {
      const res = await fetch('/api/invites/quick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tender_config_id: tenderId,
          ...(quickCompanyName.trim() ? { company_name: quickCompanyName.trim() } : {}),
          ...(quickContactName.trim() ? { contact_name: quickContactName.trim() } : {}),
          ...(quickWhatsapp.trim() ? { whatsapp: quickWhatsapp.trim() } : {}),
        }),
      });

      const json: QuickInviteResponse = await res.json();
      if (!json.success || !json.link) {
        setQuickError(json.error ?? 'Failed to generate link');
        setQuickGenerating(false);
        return;
      }

      setQuickLink(json.link);
      router.refresh();
    } catch {
      setQuickError('Network error. Please try again.');
    }
    setQuickGenerating(false);
  }, [tenderId, quickCompanyName, quickContactName, quickWhatsapp, router]);

  /** Copy link to clipboard */
  const handleCopyLink = useCallback(async () => {
    if (!quickLink) return;
    try {
      await navigator.clipboard.writeText(quickLink);
      setQuickCopied(true);
      setTimeout(() => setQuickCopied(false), 3000);
    } catch {
      // Fallback: select the text
    }
  }, [quickLink]);

  /** Generate bulk invites for all active vendors */
  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setError(null);

    try {
      // Fetch all active vendors to get their IDs (paginate if needed)
      const vendorIds: string[] = [];
      let page = 1;
      let hasMore = true;
      while (hasMore) {
        const vendorRes = await fetch(`/api/vendors?per_page=100&page=${page}`);
        const vendorJson = await vendorRes.json();
        const batch: string[] = (vendorJson.data ?? []).map((v: { id: string }) => v.id);
        vendorIds.push(...batch);
        hasMore = page < (vendorJson.pagination?.total_pages ?? 0);
        page++;
      }

      if (vendorIds.length === 0) {
        setError('No active vendors found. Add vendors first before generating bulk invites.');
        setGenerating(false);
        return;
      }

      const res = await fetch('/api/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tender_config_id: tenderId,
          vendor_ids: vendorIds,
        }),
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
    <div className="space-y-4">
      {/* ---- Quick Link Generation Section ---- */}
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 sm:p-5 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-amber-400 flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-3.02a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L4.25 8.688" />
            </svg>
            Generate Quick Link
          </h3>
          <p className="text-xs text-stone-500 mt-1">
            Create a shareable link for anyone -- paste it in WhatsApp, email, etc. No pre-registration needed.
          </p>
        </div>

        {/* Optional fields */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-stone-400 mb-1">Company Name <span className="text-stone-600">(optional)</span></label>
            <input
              type="text"
              value={quickCompanyName}
              onChange={(e) => setQuickCompanyName(e.target.value)}
              placeholder="e.g. ABC Contracting"
              className="w-full rounded-md border border-stone-700 bg-stone-800 px-3 py-2 text-sm text-stone-200 placeholder:text-stone-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-400 mb-1">Contact Name <span className="text-stone-600">(optional)</span></label>
            <input
              type="text"
              value={quickContactName}
              onChange={(e) => setQuickContactName(e.target.value)}
              placeholder="e.g. Ahmed"
              className="w-full rounded-md border border-stone-700 bg-stone-800 px-3 py-2 text-sm text-stone-200 placeholder:text-stone-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-400 mb-1">WhatsApp <span className="text-stone-600">(optional)</span></label>
            <input
              type="text"
              value={quickWhatsapp}
              onChange={(e) => setQuickWhatsapp(e.target.value)}
              placeholder="e.g. +971501234567"
              className="w-full rounded-md border border-stone-700 bg-stone-800 px-3 py-2 text-sm text-stone-200 placeholder:text-stone-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Generate button */}
        <button
          type="button"
          onClick={handleQuickGenerate}
          disabled={quickGenerating}
          className="inline-flex items-center gap-2 rounded-md bg-amber-500 px-5 py-2.5 text-sm font-bold text-stone-900 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
        >
          {quickGenerating ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-stone-800 border-t-transparent" />
              Generating...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Generate Link
            </>
          )}
        </button>

        {/* Generated link display */}
        {quickLink && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-2">
            <input
              type="text"
              readOnly
              value={quickLink}
              className="flex-1 rounded-md border border-stone-600 bg-stone-900 px-3 py-2 text-sm text-stone-300 font-mono select-all focus:outline-none focus:ring-1 focus:ring-amber-500"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors whitespace-nowrap ${
                quickCopied
                  ? 'bg-green-600 text-white'
                  : 'bg-stone-700 text-stone-200 hover:bg-stone-600'
              }`}
            >
              {quickCopied ? (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                  </svg>
                  Copy Link
                </>
              )}
            </button>
          </div>
        )}

        {/* Quick link error */}
        {quickError && (
          <div className="rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2.5 text-sm text-red-400">
            {quickError}
          </div>
        )}
      </div>

      {/* ---- Bulk Invite Buttons ---- */}
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
                Generate Invites (All Vendors)
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
    </div>
  );
}
