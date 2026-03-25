'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SchemaEditor } from '@/components/admin/schema-editor';
import { BoqEditor } from '@/components/admin/boq-editor';
import { CommercialTermsEditor } from '@/components/admin/commercial-terms-editor';
import { PACKAGE_PRESETS, type PackagePreset } from '@/lib/package-presets';
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

/** Dropdown option value: preset code or 'custom' */
type PackageSelection = string;

export default function NewTenderPage() {
  const router = useRouter();

  // Package selection
  const [selectedPackage, setSelectedPackage] = useState<PackageSelection>('');

  // Basic fields
  const [packageCode, setPackageCode] = useState('');
  const [packageName, setPackageName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [closingDeadline, setClosingDeadline] = useState('');

  // New project detail fields
  const [location, setLocation] = useState('');
  const [jobSequence, setJobSequence] = useState('');
  const [dependencies, setDependencies] = useState('');
  const [mobilisationRequirement, setMobilisationRequirement] = useState('');
  const [scopeItemsText, setScopeItemsText] = useState('');
  const [boqQtyEditable, setBoqQtyEditable] = useState(false);
  const [notesEnabled, setNotesEnabled] = useState(true);

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

  /** When a package preset is selected, auto-fill all relevant fields */
  const handlePackageSelect = useCallback((value: PackageSelection) => {
    setSelectedPackage(value);

    if (value === 'custom' || value === '') {
      // Reset to empty state for custom package
      setPackageCode('');
      setPackageName('');
      setJobSequence('');
      setDependencies('');
      setMobilisationRequirement('');
      setScopeItemsText('');
      setBoqQtyEditable(false);
      setBoqTemplate([{ code: 'A-001', description: '', unit: '', quantity: 0 }]);
      return;
    }

    const preset: PackagePreset | undefined = PACKAGE_PRESETS.find((p) => p.code === value);
    if (!preset) return;

    setPackageCode(preset.code);
    setPackageName(preset.name);
    setJobSequence(preset.job_sequence);
    setDependencies(preset.dependencies);
    setMobilisationRequirement(preset.mobilisation_requirement);
    setScopeItemsText(preset.scope_items.join('\n'));
    setBoqQtyEditable(preset.boq_qty_editable);

    // Convert preset BOQ to BoqLineItem[]
    const boqItems: BoqLineItem[] = preset.default_boq.map((item) => ({
      code: item.code,
      description: item.description,
      unit: item.unit,
      quantity: item.quantity,
    }));
    setBoqTemplate(boqItems);
  }, []);

  const isPresetSelected = selectedPackage !== '' && selectedPackage !== 'custom';

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError(null);
      setSaving(true);

      // Parse scope items from textarea (one per line)
      const scopeItems = scopeItemsText
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      try {
        const body = {
          package_code: packageCode.trim(),
          package_name: packageName.trim(),
          project_name: projectName.trim(),
          closing_deadline: new Date(closingDeadline).toISOString(),
          form_schema: formSchema,
          boq_template: boqTemplate.filter((row) => row.code.trim().length > 0),
          commercial_terms: commercialTerms,
          location: location.trim() || null,
          job_sequence: jobSequence.trim() || null,
          dependencies: dependencies.trim() || null,
          mobilisation_requirement: mobilisationRequirement.trim() || null,
          scope_items: scopeItems.length > 0 ? scopeItems : null,
          boq_qty_editable: boqQtyEditable,
          notes_enabled: notesEnabled,
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
    [
      packageCode, packageName, projectName, closingDeadline, formSchema,
      boqTemplate, commercialTerms, location, jobSequence, dependencies,
      mobilisationRequirement, scopeItemsText, boqQtyEditable, notesEnabled,
      router,
    ],
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
        {/* Package Selection */}
        <section className="space-y-4 rounded-lg border border-amber-500/30 bg-stone-800/50 p-6">
          <h2 className="text-lg font-semibold text-amber-400">Package Selection</h2>
          <p className="text-sm text-stone-400">
            Select a predefined package to auto-fill all fields, or choose Custom for a blank template.
          </p>

          <div>
            <label htmlFor="package_select" className="block text-sm font-medium text-stone-400 mb-1">
              Package
            </label>
            <select
              id="package_select"
              value={selectedPackage}
              onChange={(e) => handlePackageSelect(e.target.value)}
              className="w-full rounded-md border border-stone-700 bg-stone-900 px-3 py-2.5 text-sm text-stone-200 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="">-- Select a Package --</option>
              {PACKAGE_PRESETS.map((preset) => (
                <option key={preset.code} value={preset.code}>
                  {preset.code} &mdash; {preset.name}
                </option>
              ))}
              <option value="custom">Custom Package</option>
            </select>
          </div>
        </section>

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
                readOnly={isPresetSelected}
                className={`w-full rounded-md border border-stone-700 bg-stone-900 px-3 py-2.5 text-sm font-mono placeholder:text-stone-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                  isPresetSelected
                    ? 'text-amber-400 bg-stone-800 cursor-not-allowed'
                    : 'text-stone-200'
                }`}
                placeholder="PKG-001"
              />
              {isPresetSelected && (
                <p className="mt-1 text-xs text-stone-500">Locked to preset package code</p>
              )}
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
              placeholder="META 31 — Royal Gujarat"
            />
          </div>
        </section>

        {/* Project Details */}
        <section className="space-y-4 rounded-lg border border-stone-700 bg-stone-800/50 p-6">
          <h2 className="text-lg font-semibold text-stone-200">Project Details</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-stone-400 mb-1">
                Location
              </label>
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-md border border-stone-700 bg-stone-900 px-3 py-2.5 text-sm text-stone-200 placeholder:text-stone-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                placeholder="Jubail Island, Abu Dhabi"
              />
            </div>
            <div>
              <label htmlFor="job_sequence" className="block text-sm font-medium text-stone-400 mb-1">
                Job Sequence
              </label>
              <input
                id="job_sequence"
                type="text"
                value={jobSequence}
                onChange={(e) => setJobSequence(e.target.value)}
                className="w-full rounded-md border border-stone-700 bg-stone-900 px-3 py-2.5 text-sm text-stone-200 placeholder:text-stone-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                placeholder="JS02 → JS04"
              />
            </div>
          </div>

          <div>
            <label htmlFor="dependencies" className="block text-sm font-medium text-stone-400 mb-1">
              Dependencies
            </label>
            <input
              id="dependencies"
              type="text"
              value={dependencies}
              onChange={(e) => setDependencies(e.target.value)}
              className="w-full rounded-md border border-stone-700 bg-stone-900 px-3 py-2.5 text-sm text-stone-200 placeholder:text-stone-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              placeholder="PKG-A waterproofing sign-off required"
            />
          </div>

          <div>
            <label htmlFor="mobilisation_requirement" className="block text-sm font-medium text-stone-400 mb-1">
              Mobilisation Requirement
            </label>
            <input
              id="mobilisation_requirement"
              type="text"
              value={mobilisationRequirement}
              onChange={(e) => setMobilisationRequirement(e.target.value)}
              className="w-full rounded-md border border-stone-700 bg-stone-900 px-3 py-2.5 text-sm text-stone-200 placeholder:text-stone-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              placeholder="Within 24 hours of award"
            />
          </div>

          <div>
            <label htmlFor="scope_items" className="block text-sm font-medium text-stone-400 mb-1">
              Scope Items (one per line)
            </label>
            <textarea
              id="scope_items"
              value={scopeItemsText}
              onChange={(e) => setScopeItemsText(e.target.value)}
              rows={5}
              className="w-full rounded-md border border-stone-700 bg-stone-900 px-3 py-2.5 text-sm text-stone-200 placeholder:text-stone-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-y"
              placeholder={"Blockwork — pool shell walls, planter walls\nSteel reinforcement — rebar tying, BRC mesh\nFormwork & shuttering"}
            />
            <p className="mt-1 text-xs text-stone-500">
              Each line becomes a bullet point on the vendor form.
            </p>
          </div>
        </section>

        {/* Form Options */}
        <section className="space-y-4 rounded-lg border border-stone-700 bg-stone-800/50 p-6">
          <h2 className="text-lg font-semibold text-stone-200">Form Options</h2>

          <div className="flex items-center gap-3">
            <input
              id="boq_qty_editable"
              type="checkbox"
              checked={boqQtyEditable}
              onChange={(e) => setBoqQtyEditable(e.target.checked)}
              className="h-4 w-4 rounded border-stone-600 bg-stone-900 accent-amber-500"
            />
            <label htmlFor="boq_qty_editable" className="text-sm text-stone-300 cursor-pointer">
              Vendor can edit quantities (vendors assess quantities on site)
            </label>
          </div>

          <div className="flex items-center gap-3">
            <input
              id="notes_enabled"
              type="checkbox"
              checked={notesEnabled}
              onChange={(e) => setNotesEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-stone-600 bg-stone-900 accent-amber-500"
            />
            <label htmlFor="notes_enabled" className="text-sm text-stone-300 cursor-pointer">
              Enable additional notes textarea
            </label>
          </div>
        </section>

        {/* Form schema -- visual builder */}
        <section className="rounded-lg border border-stone-700 bg-stone-800/50 p-6">
          <SchemaEditor
            initialSchema={formSchema}
            onSave={(schema) => setFormSchema(schema)}
          />
        </section>

        {/* BOQ template -- visual table */}
        <section className="rounded-lg border border-stone-700 bg-stone-800/50 p-6">
          <BoqEditor
            initialTemplate={boqTemplate}
            onSave={(template) => setBoqTemplate(template)}
          />
        </section>

        {/* Commercial terms -- visual key-value editor */}
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
