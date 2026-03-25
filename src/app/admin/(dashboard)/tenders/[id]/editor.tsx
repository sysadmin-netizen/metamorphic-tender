'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SchemaEditor } from '@/components/admin/schema-editor';
import { BoqEditor } from '@/components/admin/boq-editor';
import type { BoqLineItem } from '@/types';

/* ---------------------------------------------------------------
   Types
   --------------------------------------------------------------- */

interface TenderDetailEditorProps {
  tenderId: string;
  updatedAt: string;
  initialFormSchema: string;
  initialBoqTemplate: BoqLineItem[];
  initialCommercialTerms: string;
}

interface PatchResponse {
  success: boolean;
  data?: { updated_at: string };
  error?: string;
  code?: string;
}

/* ---------------------------------------------------------------
   Component
   --------------------------------------------------------------- */

export function TenderDetailEditor({
  tenderId,
  updatedAt,
  initialFormSchema,
  initialBoqTemplate,
  initialCommercialTerms,
}: TenderDetailEditorProps) {
  const router = useRouter();
  const [currentUpdatedAt, setCurrentUpdatedAt] = useState(updatedAt);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Commercial terms state
  const [termsValue, setTermsValue] = useState(initialCommercialTerms);
  const [termsError, setTermsError] = useState<string | null>(null);
  const [termsDirty, setTermsDirty] = useState(false);

  const handleTermsChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value;
    setTermsValue(next);
    setTermsDirty(true);
    try {
      JSON.parse(next);
      setTermsError(null);
    } catch (err) {
      setTermsError(err instanceof Error ? err.message : 'Invalid JSON');
    }
  }, []);

  /**
   * PATCH the tender with optimistic concurrency (EC-23).
   * Sends updated_at in the payload so the server can detect conflicts.
   */
  const patchTender = useCallback(
    async (payload: Record<string, unknown>) => {
      setSaving(true);
      setMessage(null);

      try {
        const res = await fetch(`/api/tenders/${tenderId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            updated_at: currentUpdatedAt,
            ...payload,
          }),
        });

        const json: PatchResponse = await res.json();

        if (!json.success) {
          setMessage({ type: 'error', text: json.error ?? 'Save failed' });
          setSaving(false);
          return;
        }

        if (json.data?.updated_at) {
          setCurrentUpdatedAt(json.data.updated_at);
        }

        setMessage({ type: 'success', text: 'Saved successfully.' });
        router.refresh();
      } catch {
        setMessage({ type: 'error', text: 'Network error. Please try again.' });
      }
      setSaving(false);
    },
    [tenderId, currentUpdatedAt, router],
  );

  const handleSaveSchema = useCallback(
    (schema: string) => {
      try {
        const parsed: unknown = JSON.parse(schema);
        void patchTender({ form_schema: parsed });
      } catch {
        setMessage({ type: 'error', text: 'Invalid JSON in schema' });
      }
    },
    [patchTender],
  );

  const handleSaveBoq = useCallback(
    (template: BoqLineItem[]) => {
      void patchTender({ boq_template: template });
    },
    [patchTender],
  );

  const handleSaveTerms = useCallback(() => {
    if (termsError) return;
    try {
      const parsed: unknown = JSON.parse(termsValue);
      setTermsDirty(false);
      void patchTender({ commercial_terms: parsed });
    } catch {
      setTermsError('Invalid JSON');
    }
  }, [termsValue, termsError, patchTender]);

  return (
    <div className="space-y-8">
      {/* Status message */}
      {message && (
        <div
          className={`rounded-md px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      {saving && (
        <div className="flex items-center gap-2 text-sm text-stone-400">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-stone-600 border-t-amber-500" />
          Saving...
        </div>
      )}

      {/* Form Schema Editor */}
      <section className="rounded-lg border border-stone-700 bg-stone-800/50 p-6">
        <SchemaEditor
          initialSchema={initialFormSchema}
          onSave={handleSaveSchema}
        />
      </section>

      {/* BOQ Template Editor */}
      <section className="rounded-lg border border-stone-700 bg-stone-800/50 p-6">
        <BoqEditor
          initialTemplate={initialBoqTemplate}
          onSave={handleSaveBoq}
        />
      </section>

      {/* Commercial Terms */}
      <section className="space-y-3 rounded-lg border border-stone-700 bg-stone-800/50 p-6">
        <label className="block text-sm font-medium text-stone-300">
          Commercial Terms (JSON)
        </label>
        <textarea
          value={termsValue}
          onChange={handleTermsChange}
          rows={10}
          spellCheck={false}
          className={`
            w-full rounded-md border bg-stone-900 px-4 py-3 font-mono text-sm text-stone-200
            placeholder:text-stone-600 focus:outline-none focus:ring-1 resize-y
            ${termsError
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
              : 'border-stone-700 focus:border-amber-500 focus:ring-amber-500'}
          `}
        />
        {termsError && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
            {termsError}
          </p>
        )}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSaveTerms}
            disabled={!termsDirty || !!termsError || saving}
            className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-stone-900 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Save Commercial Terms
          </button>
        </div>
      </section>
    </div>
  );
}
