'use client';

import { useState, useCallback } from 'react';

/* ---------------------------------------------------------------
   Types
   --------------------------------------------------------------- */

interface TermEntry {
  key: string;
  value: string;
}

interface CommercialTermsEditorProps {
  initialTerms: Record<string, string>;
  onSave: (terms: Record<string, string>) => void;
}

/* ---------------------------------------------------------------
   Default terms (pre-populated for new tenders)
   --------------------------------------------------------------- */

const DEFAULT_TERMS: TermEntry[] = [
  { key: 'Retention', value: '10% until practical completion' },
  { key: 'Liquidated Damages', value: 'AED 500 per day' },
  { key: 'Payment Terms', value: 'Net-7 from Metamorphic receipt of client payment' },
  { key: 'Cash Advance', value: 'Not applicable' },
  { key: 'Insurance Minimum', value: 'AED 2,000,000' },
  { key: 'Defect Liability', value: '12 months from practical completion' },
  { key: 'Invoicing', value: 'MetaForge portal only' },
  { key: 'Quality Min Score', value: '0.85' },
  { key: 'Site Access', value: 'MetaForge task unlock only' },
];

/* ---------------------------------------------------------------
   Helpers
   --------------------------------------------------------------- */

/** Convert a Record<string, string> into editable entries */
function recordToEntries(record: Record<string, string>): TermEntry[] {
  const entries = Object.entries(record).map(([key, value]) => ({
    key,
    value: String(value),
  }));
  return entries.length > 0 ? entries : [...DEFAULT_TERMS];
}

/** Serialize entries back to a plain record */
function entriesToRecord(entries: TermEntry[]): Record<string, string> {
  const record: Record<string, string> = {};
  for (const entry of entries) {
    const trimmedKey = entry.key.trim();
    if (trimmedKey) {
      record[trimmedKey] = entry.value;
    }
  }
  return record;
}

/* ---------------------------------------------------------------
   Component
   --------------------------------------------------------------- */

export function CommercialTermsEditor({ initialTerms, onSave }: CommercialTermsEditorProps) {
  const [entries, setEntries] = useState<TermEntry[]>(() => recordToEntries(initialTerms));
  const [dirty, setDirty] = useState(false);

  const updateEntry = useCallback((index: number, field: 'key' | 'value', newValue: string) => {
    setEntries((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: newValue };
      return next;
    });
    setDirty(true);
  }, []);

  const addEntry = useCallback(() => {
    setEntries((prev) => [...prev, { key: '', value: '' }]);
    setDirty(true);
  }, []);

  const removeEntry = useCallback((index: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== index));
    setDirty(true);
  }, []);

  const handleSave = useCallback(() => {
    const record = entriesToRecord(entries);
    onSave(record);
    setDirty(false);
  }, [entries, onSave]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-stone-200">Commercial Terms</h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Define key-value commercial terms for this tender.
          </p>
        </div>
        <span className="text-xs text-stone-500 tabular-nums">
          {entries.length} term{entries.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Terms list */}
      <div className="space-y-2">
        {entries.length === 0 && (
          <div className="rounded-lg border border-dashed border-stone-600 bg-stone-900/50 py-8 text-center">
            <p className="text-sm text-stone-500">No terms defined.</p>
            <p className="text-xs text-stone-600 mt-1">Click &quot;Add Term&quot; to add your first commercial term.</p>
          </div>
        )}

        {entries.map((entry, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 rounded-lg border border-stone-700 bg-stone-900/60 px-4 py-3 hover:bg-stone-800/50 transition-colors"
          >
            {/* Row number */}
            <span className="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-stone-800 text-xs font-medium text-stone-500 tabular-nums">
              {idx + 1}
            </span>

            {/* Key input */}
            <div className="flex-1 min-w-0">
              <label className="sr-only">Term name</label>
              <input
                type="text"
                value={entry.key}
                onChange={(e) => updateEntry(idx, 'key', e.target.value)}
                placeholder="Term name (e.g. Payment Terms)"
                className="w-full rounded border border-stone-700 bg-stone-800 px-3 py-2 text-sm font-medium text-stone-200 placeholder:text-stone-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Value input */}
            <div className="flex-[2] min-w-0">
              <label className="sr-only">Term value</label>
              <input
                type="text"
                value={entry.value}
                onChange={(e) => updateEntry(idx, 'value', e.target.value)}
                placeholder="Value..."
                className="w-full rounded border border-stone-700 bg-stone-800 px-3 py-2 text-sm text-stone-200 placeholder:text-stone-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Delete button */}
            <button
              type="button"
              onClick={() => removeEntry(idx)}
              className="flex-shrink-0 inline-flex h-8 w-8 items-center justify-center rounded text-stone-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              aria-label={`Remove term ${entry.key || idx + 1}`}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={addEntry}
          className="inline-flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm font-medium text-amber-400 hover:bg-amber-500/20 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Term
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty}
          className="rounded-md bg-amber-600 px-5 py-2.5 text-sm font-semibold text-stone-900 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Save Terms
        </button>
      </div>
    </div>
  );
}
