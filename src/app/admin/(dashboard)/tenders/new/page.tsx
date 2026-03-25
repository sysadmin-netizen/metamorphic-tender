'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SchemaEditor } from '@/components/admin/schema-editor';
import { BoqEditor } from '@/components/admin/boq-editor';
import type { BoqLineItem, FormSchemaJson, CommercialTermsJson } from '@/types';

/* ---------------------------------------------------------------
   Default empty form schema
   --------------------------------------------------------------- */

const DEFAULT_SCHEMA: FormSchemaJson = {
  sections: [
    {
      id: 'company_info',
      title: 'Company Information',
      fields: [
        {
          id: 'company_name',
          type: 'text',
          label: 'Company Name',
          required: true,
          prefill_from_vendor: 'company_name',
        },
      ],
    },
  ],
};

const DEFAULT_COMMERCIAL_TERMS: CommercialTermsJson = {
  payment_terms: 'Net 60 days from invoice date',
  retention: '10% until practical completion',
  performance_bond: '10% of contract value',
  advance_payment_guarantee: '100% of advance amount',
  defects_liability_period: '12 months from practical completion',
  price_validity: '90 days from submission deadline',
  currency: 'AED',
  tax: 'Exclusive of VAT (5%)',
};

/* ---------------------------------------------------------------
   Page component
   --------------------------------------------------------------- */

interface ApiResponse {
  success: boolean;
  data?: { id: string };
  error?: string;
}

export default function NewTenderPage() {
  const router = useRouter();

  // Basic fields
  const [packageCode, setPackageCode] = useState('');
  const [packageName, setPackageName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [closingDeadline, setClosingDeadline] = useState('');

  // JSON editors
  const [formSchema, setFormSchema] = useState(JSON.stringify(DEFAULT_SCHEMA, null, 2));
  const [commercialTerms, setCommercialTerms] = useState(
    JSON.stringify(DEFAULT_COMMERCIAL_TERMS, null, 2),
  );

  // BOQ editor
  const [boqTemplate, setBoqTemplate] = useState<BoqLineItem[]>([
    { code: '', description: '', unit: '', quantity: 0 },
  ]);

  // Commercial terms validation
  const [termsError, setTermsError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTermsChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value;
    setCommercialTerms(next);
    try {
      JSON.parse(next);
      setTermsError(null);
    } catch (err) {
      setTermsError(err instanceof Error ? err.message : 'Invalid JSON');
    }
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError(null);
      setSaving(true);

      try {
        const parsedSchema: unknown = JSON.parse(formSchema);
        const parsedTerms: unknown = JSON.parse(commercialTerms);

        const body = {
          package_code: packageCode.trim(),
          package_name: packageName.trim(),
          project_name: projectName.trim(),
          closing_deadline: new Date(closingDeadline).toISOString(),
          form_schema: parsedSchema,
          boq_template: boqTemplate.filter((row) => row.code.trim().length > 0),
          commercial_terms: parsedTerms,
        };

        const res = await fetch('/api/tenders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        const json: ApiResponse = await res.json();

        if (!json.success) {
          setError(json.error ?? 'Failed to create tender');
          setSaving(false);
          return;
        }

        router.push(`/admin/tenders/${json.data?.id ?? ''}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unexpected error');
        setSaving(false);
      }
    },
    [packageCode, packageName, projectName, closingDeadline, formSchema, boqTemplate, commercialTerms, router],
  );

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-stone-100">New Tender</h1>
        <p className="mt-1 text-sm text-stone-500">Configure a new tender package</p>
      </div>

      {error && (
        <div className="rounded-md bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic details */}
        <section className="space-y-4 rounded-lg border border-stone-700 bg-stone-800/50 p-6">
          <h2 className="text-lg font-semibold text-stone-200">Basic Details</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="package_code" className="block text-sm font-medium text-stone-400 mb-1">
                Package Code
              </label>
              <input
                id="package_code"
                type="text"
                required
                value={packageCode}
                onChange={(e) => setPackageCode(e.target.value)}
                className="w-full rounded-md border border-stone-700 bg-stone-900 px-3 py-2.5 text-sm text-stone-200 font-mono placeholder:text-stone-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                placeholder="PKG-001"
              />
            </div>
            <div>
              <label htmlFor="closing_deadline" className="block text-sm font-medium text-stone-400 mb-1">
                Closing Deadline
              </label>
              <input
                id="closing_deadline"
                type="datetime-local"
                required
                value={closingDeadline}
                onChange={(e) => setClosingDeadline(e.target.value)}
                className="w-full rounded-md border border-stone-700 bg-stone-900 px-3 py-2.5 text-sm text-stone-200 placeholder:text-stone-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="package_name" className="block text-sm font-medium text-stone-400 mb-1">
              Package Name
            </label>
            <input
              id="package_name"
              type="text"
              required
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              className="w-full rounded-md border border-stone-700 bg-stone-900 px-3 py-2.5 text-sm text-stone-200 placeholder:text-stone-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              placeholder="Main Building Structure Works"
            />
          </div>

          <div>
            <label htmlFor="project_name" className="block text-sm font-medium text-stone-400 mb-1">
              Project Name
            </label>
            <input
              id="project_name"
              type="text"
              required
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full rounded-md border border-stone-700 bg-stone-900 px-3 py-2.5 text-sm text-stone-200 placeholder:text-stone-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              placeholder="Project Alpha"
            />
          </div>
        </section>

        {/* Form schema */}
        <section className="rounded-lg border border-stone-700 bg-stone-800/50 p-6">
          <SchemaEditor
            initialSchema={formSchema}
            onSave={(schema) => setFormSchema(schema)}
          />
        </section>

        {/* BOQ template */}
        <section className="rounded-lg border border-stone-700 bg-stone-800/50 p-6">
          <BoqEditor
            initialTemplate={boqTemplate}
            onSave={(template) => setBoqTemplate(template)}
          />
        </section>

        {/* Commercial terms */}
        <section className="space-y-3 rounded-lg border border-stone-700 bg-stone-800/50 p-6">
          <label className="block text-sm font-medium text-stone-300">
            Commercial Terms (JSON)
          </label>
          <textarea
            value={commercialTerms}
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
        </section>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving || !!termsError}
            className="rounded-md bg-amber-600 px-6 py-2.5 text-sm font-semibold text-stone-900 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Creating...' : 'Create Tender'}
          </button>
        </div>
      </form>
    </div>
  );
}
