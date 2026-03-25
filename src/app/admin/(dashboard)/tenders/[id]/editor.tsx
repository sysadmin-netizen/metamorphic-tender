'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SchemaEditor } from '@/components/admin/schema-editor';
import { BoqEditor } from '@/components/admin/boq-editor';
import { CommercialTermsEditor } from '@/components/admin/commercial-terms-editor';
import type { BoqLineItem, FormSchemaJson } from '@/types';

/* ---------------------------------------------------------------
   Types
   --------------------------------------------------------------- */

interface TenderDetailEditorProps {
  tenderId: string;
  updatedAt: string;
  initialFormSchema: FormSchemaJson;
  initialBoqTemplate: BoqLineItem[];
  initialCommercialTerms: Record<string, string>;
  initialLocation: string;
  initialJobSequence: string;
  initialDependencies: string;
  initialMobilisationRequirement: string;
  initialScopeItems: string[];
  initialBoqQtyEditable: boolean;
  initialNotesEnabled: boolean;
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
  initialLocation,
  initialJobSequence,
  initialDependencies,
  initialMobilisationRequirement,
  initialScopeItems,
  initialBoqQtyEditable,
  initialNotesEnabled,
}: TenderDetailEditorProps) {
  const router = useRouter();
  const [currentUpdatedAt, setCurrentUpdatedAt] = useState(updatedAt);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Project detail fields
  const [location, setLocation] = useState(initialLocation);
  const [jobSequence, setJobSequence] = useState(initialJobSequence);
  const [dependencies, setDependencies] = useState(initialDependencies);
  const [mobilisationRequirement, setMobilisationRequirement] = useState(initialMobilisationRequirement);
  const [scopeItemsText, setScopeItemsText] = useState(initialScopeItems.join('\n'));
  const [boqQtyEditable, setBoqQtyEditable] = useState(initialBoqQtyEditable);
  const [notesEnabled, setNotesEnabled] = useState(initialNotesEnabled);

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
    (schema: FormSchemaJson) => {
      void patchTender({ form_schema: schema });
    },
    [patchTender],
  );

  const handleSaveBoq = useCallback(
    (template: BoqLineItem[]) => {
      void patchTender({ boq_template: template });
    },
    [patchTender],
  );

  const handleSaveTerms = useCallback(
    (terms: Record<string, string>) => {
      void patchTender({ commercial_terms: terms });
    },
    [patchTender],
  );

  const handleSaveProjectDetails = useCallback(() => {
    const scopeItems = scopeItemsText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    void patchTender({
      location: location.trim() || null,
      job_sequence: jobSequence.trim() || null,
      dependencies: dependencies.trim() || null,
      mobilisation_requirement: mobilisationRequirement.trim() || null,
      scope_items: scopeItems.length > 0 ? scopeItems : null,
      boq_qty_editable: boqQtyEditable,
      notes_enabled: notesEnabled,
    });
  }, [patchTender, location, jobSequence, dependencies, mobilisationRequirement, scopeItemsText, boqQtyEditable, notesEnabled]);

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

      {/* Project Details Editor */}
      <section className="space-y-4 rounded-lg border border-stone-700 bg-stone-800/50 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-200">Project Details</h2>
          <button
            type="button"
            onClick={handleSaveProjectDetails}
            disabled={saving}
            className="rounded-md bg-amber-600 px-4 py-1.5 text-sm font-semibold text-stone-900 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Save Details
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="ed_location" className="block text-sm font-medium text-stone-400 mb-1">
              Location
            </label>
            <input
              id="ed_location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-md border border-stone-700 bg-stone-900 px-3 py-2.5 text-sm text-stone-200 placeholder:text-stone-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              placeholder="Jubail Island, Abu Dhabi"
            />
          </div>
          <div>
            <label htmlFor="ed_job_sequence" className="block text-sm font-medium text-stone-400 mb-1">
              Job Sequence
            </label>
            <input
              id="ed_job_sequence"
              type="text"
              value={jobSequence}
              onChange={(e) => setJobSequence(e.target.value)}
              className="w-full rounded-md border border-stone-700 bg-stone-900 px-3 py-2.5 text-sm text-stone-200 placeholder:text-stone-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              placeholder="JS02 → JS04"
            />
          </div>
        </div>

        <div>
          <label htmlFor="ed_dependencies" className="block text-sm font-medium text-stone-400 mb-1">
            Dependencies
          </label>
          <input
            id="ed_dependencies"
            type="text"
            value={dependencies}
            onChange={(e) => setDependencies(e.target.value)}
            className="w-full rounded-md border border-stone-700 bg-stone-900 px-3 py-2.5 text-sm text-stone-200 placeholder:text-stone-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            placeholder="PKG-A waterproofing sign-off required"
          />
        </div>

        <div>
          <label htmlFor="ed_mob_req" className="block text-sm font-medium text-stone-400 mb-1">
            Mobilisation Requirement
          </label>
          <input
            id="ed_mob_req"
            type="text"
            value={mobilisationRequirement}
            onChange={(e) => setMobilisationRequirement(e.target.value)}
            className="w-full rounded-md border border-stone-700 bg-stone-900 px-3 py-2.5 text-sm text-stone-200 placeholder:text-stone-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            placeholder="Within 24 hours of award"
          />
        </div>

        <div>
          <label htmlFor="ed_scope" className="block text-sm font-medium text-stone-400 mb-1">
            Scope Items (one per line)
          </label>
          <textarea
            id="ed_scope"
            value={scopeItemsText}
            onChange={(e) => setScopeItemsText(e.target.value)}
            rows={5}
            className="w-full rounded-md border border-stone-700 bg-stone-900 px-3 py-2.5 text-sm text-stone-200 placeholder:text-stone-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-y"
            placeholder={"Blockwork — pool shell walls\nSteel reinforcement — rebar tying"}
          />
          <p className="mt-1 text-xs text-stone-500">
            Each line becomes a bullet point on the vendor form.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            id="ed_boq_qty"
            type="checkbox"
            checked={boqQtyEditable}
            onChange={(e) => setBoqQtyEditable(e.target.checked)}
            className="h-4 w-4 rounded border-stone-600 bg-stone-900 accent-amber-500"
          />
          <label htmlFor="ed_boq_qty" className="text-sm text-stone-300 cursor-pointer">
            Vendor can edit quantities (vendors assess quantities on site)
          </label>
        </div>

        <div className="flex items-center gap-3">
          <input
            id="ed_notes"
            type="checkbox"
            checked={notesEnabled}
            onChange={(e) => setNotesEnabled(e.target.checked)}
            className="h-4 w-4 rounded border-stone-600 bg-stone-900 accent-amber-500"
          />
          <label htmlFor="ed_notes" className="text-sm text-stone-300 cursor-pointer">
            Enable additional notes textarea
          </label>
        </div>
      </section>

      {/* Form Schema Editor -- visual builder */}
      <section className="rounded-lg border border-stone-700 bg-stone-800/50 p-6">
        <SchemaEditor
          initialSchema={initialFormSchema}
          onSave={handleSaveSchema}
        />
      </section>

      {/* BOQ Template Editor -- visual table */}
      <section className="rounded-lg border border-stone-700 bg-stone-800/50 p-6">
        <BoqEditor
          initialTemplate={initialBoqTemplate}
          onSave={handleSaveBoq}
        />
      </section>

      {/* Commercial Terms -- visual key-value editor */}
      <section className="rounded-lg border border-stone-700 bg-stone-800/50 p-6">
        <CommercialTermsEditor
          initialTerms={initialCommercialTerms}
          onSave={handleSaveTerms}
        />
      </section>
    </div>
  );
}
