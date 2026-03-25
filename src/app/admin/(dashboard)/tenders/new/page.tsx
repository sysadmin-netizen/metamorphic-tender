'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SchemaEditor } from '@/components/admin/schema-editor';
import { BoqEditor } from '@/components/admin/boq-editor';
import { CommercialTermsEditor } from '@/components/admin/commercial-terms-editor';
import type { BoqLineItem, FormSchemaJson } from '@/types';

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

const DEFAULT_COMMERCIAL_TERMS: Record<string, string> = {
  Retention: '10% until practical completion',
  'Liquidated Damages': 'AED 500 per day',
  'Payment Terms': 'Net-7 from Metamorphic receipt of client payment',
  'Cash Advance': 'Not applicable',
  'Insurance Minimum': 'AED 2,000,000',
  'Defect Liability': '12 months from practical completion',
  Invoicing: 'MetaForge portal only',
  'Quality Min Score': '0.85',
  'Site Access': 'MetaForge task unlock only',
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

  // Visual editor state
  const [formSchema, setFormSchema] = useState<FormSchemaJson>(DEFAULT_SCHEMA);
  const [commercialTerms, setCommercialTerms] = useState<Record<string, string>>(
    DEFAULT_COMMERCIAL_TERMS,
  );
  const [boqTemplate, setBoqTemplate] = useState<BoqLineItem[]>([
    { code: 'A-001', description: '', unit: '', quantity: 0 },
  ]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError(null);
      setSaving(true);

      try {
        const body = {
          package_code: packageCode.trim(),
          package_name: packageName.trim(),
          project_name: projectName.trim(),
          closing_deadline: new Date(closingDeadline).toISOString(),
          form_schema: formSchema,
          boq_template: boqTemplate.filter((row) => row.code.trim().length > 0),
          commercial_terms: commercialTerms,
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

        {/* Form schema — visual builder */}
        <section className="rounded-lg border border-stone-700 bg-stone-800/50 p-6">
          <SchemaEditor
            initialSchema={formSchema}
            onSave={(schema) => setFormSchema(schema)}
          />
        </section>

        {/* BOQ template — visual table */}
        <section className="rounded-lg border border-stone-700 bg-stone-800/50 p-6">
          <BoqEditor
            initialTemplate={boqTemplate}
            onSave={(template) => setBoqTemplate(template)}
          />
        </section>

        {/* Commercial terms — visual key-value editor */}
        <section className="rounded-lg border border-stone-700 bg-stone-800/50 p-6">
          <CommercialTermsEditor
            initialTerms={commercialTerms}
            onSave={(terms) => setCommercialTerms(terms)}
          />
        </section>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-amber-600 px-6 py-2.5 text-sm font-semibold text-stone-900 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Creating...' : 'Create Tender'}
          </button>
        </div>
      </form>
    </div>
  );
}
