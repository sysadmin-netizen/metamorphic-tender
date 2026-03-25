'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { toast, ToastContainer } from '@/components/ui/toast';
import type {
  FormSchemaJson,
  BoqTemplateJson,
} from '@/lib/types/database';
import type { FormField } from '@/lib/types/form-schema';
import { validateFormData, validateBoqData } from '@/lib/validation';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TenderConfigSlice {
  form_schema: FormSchemaJson;
  boq_template: BoqTemplateJson;
  closing_deadline: string;
  package_name: string;
}

interface VendorDataSlice {
  company_name: string;
  contact_name: string;
  email: string;
  whatsapp: string;
  trade_licence_number: string;
  is_dda_approved: boolean;
  metaforge_confirmed: boolean;
}

interface SubmissionFormProps {
  token: string;
  tenderConfig: TenderConfigSlice;
  vendorData: VendorDataSlice;
  schemaHash: string;
}

interface BoqRateEntry {
  code: string;
  rate: number;
  total: number;
}

interface DraftState {
  formValues: Record<string, unknown>;
  boqRates: Record<string, number>;
  savedAt: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DRAFT_KEY_PREFIX = 'tender_draft_';
const AUTOSAVE_DEBOUNCE_MS = 500;

function buildPrefillValues(
  schema: FormSchemaJson,
  vendor: VendorDataSlice,
): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const section of schema.sections) {
    for (const field of section.fields) {
      if (field.prefill_from_vendor && field.prefill_from_vendor in vendor) {
        const key = field.prefill_from_vendor as keyof VendorDataSlice;
        values[field.id] = vendor[key];
      } else if (field.type === 'checkbox') {
        values[field.id] = false;
      } else {
        values[field.id] = '';
      }
    }
  }
  return values;
}

// ---------------------------------------------------------------------------
// Form field renderer
// ---------------------------------------------------------------------------

function FormFieldRenderer({
  field,
  value,
  error,
  onChange,
}: {
  field: FormField;
  value: unknown;
  error?: string;
  onChange: (id: string, value: unknown) => void;
}) {
  switch (field.type) {
    case 'select':
    case 'radio':
      return (
        <Select
          label={field.label}
          options={field.options ?? []}
          required={field.required}
          hint={field.hint}
          error={error}
          value={String(value ?? '')}
          onChange={(e) => onChange(field.id, e.target.value)}
        />
      );
    case 'checkbox':
      return (
        <Checkbox
          label={field.label}
          checked={Boolean(value)}
          required={field.required}
          error={error}
          onChange={(checked) => onChange(field.id, checked)}
        />
      );
    case 'textarea':
      return (
        <Textarea
          label={field.label}
          required={field.required}
          placeholder={field.placeholder}
          hint={field.hint}
          error={error}
          rows={field.rows ?? 4}
          value={String(value ?? '')}
          onChange={(e) => onChange(field.id, e.target.value)}
        />
      );
    case 'number':
      return (
        <Input
          label={field.label}
          type="number"
          required={field.required}
          placeholder={field.placeholder}
          hint={field.hint}
          error={error}
          min={field.min}
          max={field.max}
          step={field.step}
          value={String(value ?? '')}
          onChange={(e) => onChange(field.id, e.target.value === '' ? '' : Number(e.target.value))}
        />
      );
    default:
      return (
        <Input
          label={field.label}
          type={field.type}
          required={field.required}
          placeholder={field.placeholder}
          hint={field.hint}
          error={error}
          value={String(value ?? '')}
          onChange={(e) => onChange(field.id, e.target.value)}
        />
      );
  }
}

// ---------------------------------------------------------------------------
// BOQ Table
// ---------------------------------------------------------------------------

function BoqTable({
  template,
  rates,
  onRateChange,
}: {
  template: BoqTemplateJson;
  rates: Record<string, number>;
  onRateChange: (code: string, rate: number) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white table-scroll">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-stone-50">
            <th className="sticky left-0 z-10 bg-stone-50 whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-stone-500">
              Item
            </th>
            <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-stone-500">
              Description
            </th>
            <th className="whitespace-nowrap px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-stone-500">
              Unit
            </th>
            <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-stone-500">
              Qty
            </th>
            <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-stone-500">
              Rate (AED)
            </th>
            <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-stone-500">
              Total (AED)
            </th>
          </tr>
        </thead>
        <tbody>
          {template.map((item, idx) => {
            const rate = rates[item.code] ?? 0;
            const lineTotal = rate * item.quantity;
            return (
              <tr
                key={item.code}
                className={idx % 2 === 0 ? 'bg-white' : 'bg-stone-50/50'}
              >
                <td className="sticky left-0 z-10 bg-inherit whitespace-nowrap px-4 py-3 font-mono text-xs text-stone-600">
                  {item.code}
                </td>
                <td className="px-4 py-3 text-stone-900 min-w-[200px]">
                  {item.description}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-center text-stone-600">
                  {item.unit}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-mono tabular-nums text-stone-900">
                  {item.quantity.toLocaleString()}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={rate || ''}
                    placeholder="0.00"
                    onChange={(e) =>
                      onRateChange(
                        item.code,
                        e.target.value === '' ? 0 : Number(e.target.value),
                      )
                    }
                    className="w-28 rounded-md border border-stone-300 px-2 py-1.5 text-right font-mono text-[16px] tabular-nums text-stone-900 focus:border-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-700"
                    aria-label={`Rate for ${item.code}`}
                  />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-mono tabular-nums font-medium text-stone-900">
                  {lineTotal > 0
                    ? lineTotal.toLocaleString('en-AE', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : '\u2014'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main submission form component
// ---------------------------------------------------------------------------

export function SubmissionForm({
  token,
  tenderConfig,
  vendorData,
  schemaHash,
}: SubmissionFormProps) {
  const router = useRouter();
  const draftKey = `${DRAFT_KEY_PREFIX}${token}`;

  // -----------------------------------------------------------------------
  // State
  // -----------------------------------------------------------------------
  const [formValues, setFormValues] = useState<Record<string, unknown>>(() =>
    buildPrefillValues(tenderConfig.form_schema, vendorData),
  );
  const [boqRates, setBoqRates] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [restoredFromDraft, setRestoredFromDraft] = useState(false);

  // Ref to track if initial restore has happened
  const hasRestored = useRef(false);

  // -----------------------------------------------------------------------
  // Restore from sessionStorage on mount (EC-16)
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (hasRestored.current) return;
    hasRestored.current = true;

    try {
      const saved = sessionStorage.getItem(draftKey);
      if (saved) {
        const draft: DraftState = JSON.parse(saved);
        if (draft.formValues) setFormValues(draft.formValues);
        if (draft.boqRates) setBoqRates(draft.boqRates);
        setRestoredFromDraft(true);
        toast.info('Your progress has been restored.');
      }
    } catch {
      // Ignore parse errors
    }
  }, [draftKey]);

  // -----------------------------------------------------------------------
  // Auto-save to sessionStorage, debounced (EC-16)
  // -----------------------------------------------------------------------
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (submitted) return;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      try {
        const draft: DraftState = {
          formValues,
          boqRates,
          savedAt: Date.now(),
        };
        sessionStorage.setItem(draftKey, JSON.stringify(draft));
      } catch {
        // Storage full or unavailable
      }
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [formValues, boqRates, draftKey, submitted]);

  // -----------------------------------------------------------------------
  // Field change handler
  // -----------------------------------------------------------------------
  const handleFieldChange = useCallback(
    (id: string, value: unknown) => {
      setFormValues((prev) => ({ ...prev, [id]: value }));
      // Clear field-level error on change
      if (errors[id]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
    },
    [errors],
  );

  // -----------------------------------------------------------------------
  // BOQ rate change handler
  // -----------------------------------------------------------------------
  const handleRateChange = useCallback((code: string, rate: number) => {
    setBoqRates((prev) => ({ ...prev, [code]: rate }));
  }, []);

  // -----------------------------------------------------------------------
  // Grand total computation
  // -----------------------------------------------------------------------
  const grandTotal = useMemo(() => {
    let total = 0;
    for (const item of tenderConfig.boq_template) {
      const rate = boqRates[item.code] ?? 0;
      total += rate * item.quantity;
    }
    return total;
  }, [boqRates, tenderConfig.boq_template]);

  // -----------------------------------------------------------------------
  // Submit handler
  // -----------------------------------------------------------------------
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (isSubmitting) return;

      // --- Client-side validation ---
      const formSchema = {
        sections: tenderConfig.form_schema.sections.map((s) => ({
          ...s,
          fields: s.fields.map((f) => ({
            ...f,
            type: f.type as FormField['type'],
          })),
        })),
      };

      const formErrors = validateFormData(formValues, formSchema);

      const boqEntries: BoqRateEntry[] = tenderConfig.boq_template.map(
        (item) => ({
          code: item.code,
          rate: boqRates[item.code] ?? 0,
          total: (boqRates[item.code] ?? 0) * item.quantity,
        }),
      );

      const boqErrors = validateBoqData(
        boqEntries,
        tenderConfig.boq_template.map((t) => ({
          code: t.code,
          description: t.description,
          unit: t.unit,
          quantity: t.quantity,
        })),
      );

      const allErrors = [...formErrors, ...boqErrors];
      if (allErrors.length > 0) {
        // Build field-level error map
        const errorMap: Record<string, string> = {};
        for (const err of formErrors) {
          // Try to match error to field by label
          for (const section of tenderConfig.form_schema.sections) {
            for (const field of section.fields) {
              if (err.startsWith(field.label)) {
                errorMap[field.id] = err;
              }
            }
          }
        }
        setErrors(errorMap);
        toast.error(`Please fix ${allErrors.length} error${allErrors.length > 1 ? 's' : ''} before submitting.`);
        return;
      }

      // --- Submit (EC-05 client layer: disable button) ---
      setIsSubmitting(true);
      setErrors({});

      try {
        const response = await fetch('/api/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token,
            form_data: formValues,
            boq_data: boqEntries,
            schema_hash: schemaHash,
          }),
        });

        if (response.ok) {
          // Clear draft on success
          try {
            sessionStorage.removeItem(draftKey);
          } catch {
            // Ignore
          }
          setSubmitted(true);
          // EC-17: router.replace to same URL, which will hit Gate 3 and show receipt
          router.replace(`/t/${token}`);
          return;
        }

        // Handle error responses
        const status = response.status;
        let errorMessage = 'Submission failed. Please try again.';

        try {
          const body = await response.json();
          if (body.error) {
            errorMessage = body.error;
          }
        } catch {
          // Could not parse error body
        }

        switch (status) {
          case 403:
            toast.error(
              'This tender has expired or closed. You can no longer submit.',
            );
            break;
          case 409:
            toast.info(
              'A submission has already been recorded. Redirecting...',
            );
            router.replace(`/t/${token}`);
            return;
          case 422:
            toast.warning(
              'The form structure has changed. Please reload the page and try again.',
            );
            break;
          default:
            toast.error(errorMessage);
        }
      } catch {
        toast.error(
          'Network error. Please check your connection and try again.',
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      formValues,
      boqRates,
      isSubmitting,
      token,
      schemaHash,
      tenderConfig,
      draftKey,
      router,
    ],
  );

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <>
      <ToastContainer />

      {restoredFromDraft && (
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Draft restored from your previous session.
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* Form sections */}
        {tenderConfig.form_schema.sections.map((section) => (
          <fieldset
            key={section.id}
            className="mb-6 rounded-lg border border-stone-200 bg-white p-5"
          >
            <legend className="px-2 text-sm font-semibold text-[var(--text-primary)]">
              {section.title}
            </legend>
            {section.description && (
              <p className="mb-4 text-xs text-[var(--text-secondary)]">
                {section.description}
              </p>
            )}
            <div className="space-y-4">
              {section.fields.map((field) => (
                <FormFieldRenderer
                  key={field.id}
                  field={field as FormField}
                  value={formValues[field.id]}
                  error={errors[field.id]}
                  onChange={handleFieldChange}
                />
              ))}
            </div>
          </fieldset>
        ))}

        {/* BOQ Section */}
        {tenderConfig.boq_template.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
              Bill of Quantities
            </h2>
            <BoqTable
              template={tenderConfig.boq_template}
              rates={boqRates}
              onRateChange={handleRateChange}
            />
          </div>
        )}

        {/* Grand total (sticky on mobile) */}
        <div className="sticky-bottom mb-6 rounded-lg border border-stone-200 bg-white p-4 shadow-sm sm:static sm:shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--text-secondary)]">
              Grand Total
            </span>
            <span className="text-lg font-mono font-bold tabular-nums text-[var(--text-primary)]">
              AED{' '}
              {grandTotal.toLocaleString('en-AE', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>

        {/* Submit button */}
        <div className="pb-8">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={isSubmitting}
            disabled={isSubmitting || submitted}
            className="w-full sm:w-auto sm:min-w-[200px] min-h-[48px]"
          >
            Submit Tender
          </Button>
        </div>
      </form>
    </>
  );
}
