'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast, ToastContainer } from '@/components/ui/toast';
import { BoqTable } from '@/components/boq-table';
import { CommercialTerms } from '@/components/commercial-terms';
import type {
  FormSchemaJson,
  BoqTemplateJson,
  CommercialTermsJson,
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
  package_code: string;
  commercial_terms: Record<string, unknown>;
  boq_qty_editable: boolean;
  notes_enabled: boolean;
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
  quantity?: number;
}

interface DraftState {
  formValues: Record<string, unknown>;
  boqRates: Record<string, number>;
  boqQuantities: Record<string, number>;
  notes: string;
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
// Themed form field renderer (gold+black)
// ---------------------------------------------------------------------------

function VendorFormField({
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
  const baseInputClass =
    'w-full bg-[var(--md-dark)] border border-[#555] text-[var(--text-inverse)] px-3.5 py-3 text-sm font-[inherit] transition-colors duration-200 focus:outline-none focus:border-[var(--accent)] placeholder:text-[var(--md-grey)]';
  const errorInputClass = error ? 'border-[var(--md-red)]' : '';

  const label = (
    <label className="block text-xs uppercase tracking-[0.5px] text-[var(--md-grey)] mb-1.5">
      {field.label}
      {field.required && <span className="text-[var(--accent)] ml-1">*</span>}
    </label>
  );

  switch (field.type) {
    case 'select':
    case 'radio':
      return (
        <div className="flex flex-col">
          {label}
          <select
            required={field.required}
            value={String(value ?? '')}
            onChange={(e) => onChange(field.id, e.target.value)}
            className={`${baseInputClass} ${errorInputClass}`}
          >
            <option value="">— Select —</option>
            {(field.options ?? []).map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {field.hint && <span className="mt-1 text-xs text-[var(--md-grey)]">{field.hint}</span>}
          {error && <span className="mt-1 text-xs text-[var(--md-red)]">{error}</span>}
        </div>
      );
    case 'checkbox':
      return (
        <div className="flex items-start gap-2 py-2">
          <input
            type="checkbox"
            checked={Boolean(value)}
            required={field.required}
            onChange={(e) => onChange(field.id, e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
          />
          <div>
            <span className="text-sm text-[var(--text-inverse)]">
              {field.label}
              {field.required && <span className="text-[var(--accent)] ml-1">*</span>}
            </span>
            {error && <span className="block mt-1 text-xs text-[var(--md-red)]">{error}</span>}
          </div>
        </div>
      );
    case 'textarea':
      return (
        <div className="flex flex-col">
          {label}
          <textarea
            required={field.required}
            placeholder={field.placeholder}
            rows={field.rows ?? 4}
            value={String(value ?? '')}
            onChange={(e) => onChange(field.id, e.target.value)}
            className={`${baseInputClass} ${errorInputClass} resize-y`}
          />
          {field.hint && <span className="mt-1 text-xs text-[var(--md-grey)]">{field.hint}</span>}
          {error && <span className="mt-1 text-xs text-[var(--md-red)]">{error}</span>}
        </div>
      );
    case 'number':
      return (
        <div className="flex flex-col">
          {label}
          <input
            type="number"
            required={field.required}
            placeholder={field.placeholder}
            min={field.min}
            max={field.max}
            step={field.step}
            value={String(value ?? '')}
            onChange={(e) => onChange(field.id, e.target.value === '' ? '' : Number(e.target.value))}
            className={`${baseInputClass} ${errorInputClass}`}
          />
          {field.hint && <span className="mt-1 text-xs text-[var(--md-grey)]">{field.hint}</span>}
          {error && <span className="mt-1 text-xs text-[var(--md-red)]">{error}</span>}
        </div>
      );
    default:
      return (
        <div className="flex flex-col">
          {label}
          <input
            type={field.type}
            required={field.required}
            placeholder={field.placeholder}
            value={String(value ?? '')}
            onChange={(e) => onChange(field.id, e.target.value)}
            className={`${baseInputClass} ${errorInputClass}`}
          />
          {field.hint && <span className="mt-1 text-xs text-[var(--md-grey)]">{field.hint}</span>}
          {error && <span className="mt-1 text-xs text-[var(--md-red)]">{error}</span>}
        </div>
      );
  }
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
  const [boqQuantities, setBoqQuantities] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
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
        if (draft.boqQuantities) setBoqQuantities(draft.boqQuantities);
        if (draft.notes) setNotes(draft.notes);
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
          boqQuantities,
          notes,
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
  }, [formValues, boqRates, boqQuantities, notes, draftKey, submitted]);

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
  // BOQ rate and quantity change handlers
  // -----------------------------------------------------------------------
  const handleRateChange = useCallback((code: string, rate: number) => {
    setBoqRates((prev) => ({ ...prev, [code]: rate }));
  }, []);

  const handleQtyChange = useCallback((code: string, qty: number) => {
    setBoqQuantities((prev) => ({ ...prev, [code]: qty }));
  }, []);

  // -----------------------------------------------------------------------
  // Grand total computation
  // -----------------------------------------------------------------------
  const grandTotal = useMemo(() => {
    let total = 0;
    for (const item of tenderConfig.boq_template) {
      const rate = boqRates[item.code] ?? 0;
      const qty = tenderConfig.boq_qty_editable
        ? (boqQuantities[item.code] ?? 0)
        : item.quantity;
      total += rate * qty;
    }
    return total;
  }, [boqRates, boqQuantities, tenderConfig.boq_template, tenderConfig.boq_qty_editable]);

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
        (item) => {
          const rate = boqRates[item.code] ?? 0;
          const qty = tenderConfig.boq_qty_editable
            ? (boqQuantities[item.code] ?? 0)
            : item.quantity;
          return {
            code: item.code,
            rate,
            total: rate * qty,
            ...(tenderConfig.boq_qty_editable ? { quantity: qty } : {}),
          };
        },
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

      // Check terms acceptance
      if (!termsAccepted) {
        formErrors.push('You must accept the commercial terms to submit.');
      }

      const allErrors = [...formErrors, ...boqErrors];
      if (allErrors.length > 0) {
        // Build field-level error map
        const errorMap: Record<string, string> = {};
        for (const err of formErrors) {
          for (const section of tenderConfig.form_schema.sections) {
            for (const field of section.fields) {
              if (err.startsWith(field.label)) {
                errorMap[field.id] = err;
              }
            }
          }
        }
        if (!termsAccepted) {
          errorMap['terms_accepted'] = 'You must accept the commercial terms to submit.';
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
            form_data: {
              ...formValues,
              ...(notes.trim() ? { additional_notes: notes.trim() } : {}),
            },
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
      boqQuantities,
      notes,
      termsAccepted,
      isSubmitting,
      token,
      schemaHash,
      tenderConfig,
      draftKey,
      router,
    ],
  );

  // -----------------------------------------------------------------------
  // Render — gold+black themed form matching reference HTML
  // -----------------------------------------------------------------------
  return (
    <>
      <ToastContainer />

      {restoredFromDraft && (
        <div className="mb-6 border border-[var(--accent)] bg-[var(--md-dark)] px-4 py-3 text-sm text-[var(--accent)]">
          Draft restored from your previous session.
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* Form sections with 2-column grid layout */}
        {tenderConfig.form_schema.sections.map((section) => (
          <div key={section.id} className="mb-8">
            <h3 className="text-[var(--accent)] text-base font-semibold uppercase tracking-wider border-b border-[#444] pb-2 mb-5">
              {section.title}
            </h3>
            {section.description && (
              <p className="mb-4 text-xs text-[var(--md-grey)]">
                {section.description}
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {section.fields.map((field) => {
                const isFullWidth =
                  field.type === 'textarea' ||
                  field.type === 'checkbox';
                return (
                  <div
                    key={field.id}
                    className={isFullWidth ? 'sm:col-span-2' : ''}
                  >
                    <VendorFormField
                      field={field as FormField}
                      value={formValues[field.id]}
                      error={errors[field.id]}
                      onChange={handleFieldChange}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Package Code — locked field */}
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label className="block text-xs uppercase tracking-[0.5px] text-[var(--md-grey)] mb-1.5">
              Package Code
            </label>
            <input
              type="text"
              value={tenderConfig.package_code}
              disabled
              className="w-full bg-[#333] border border-[#555] text-[var(--accent)] font-semibold px-3.5 py-3 text-sm cursor-not-allowed"
            />
          </div>
        </div>

        {/* BOQ Section */}
        {tenderConfig.boq_template.length > 0 && (
          <div className="mb-8">
            <h3 className="text-[var(--accent)] text-base font-semibold uppercase tracking-wider border-b border-[#444] pb-2 mb-5">
              Bill of Quantities — Rates{tenderConfig.boq_qty_editable ? ' & Quantities' : ''}
            </h3>
            <BoqTable
              template={tenderConfig.boq_template}
              rates={boqRates}
              quantities={boqQuantities}
              onRateChange={handleRateChange}
              onQtyChange={handleQtyChange}
              errors={{}}
              qtyEditable={tenderConfig.boq_qty_editable}
            />
          </div>
        )}

        {/* Grand total */}
        <div className="mb-8 bg-[var(--md-dark)] border-t-2 border-[var(--accent)] p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold uppercase tracking-wider text-[var(--text-inverse)]">
              Grand Total (AED)
            </span>
            <span className="text-lg font-mono font-bold tabular-nums text-[var(--accent)]">
              {grandTotal.toLocaleString('en-AE', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>

        {/* Commercial Terms — inline numbered box */}
        <div className="mb-8">
          <h3 className="text-[var(--accent)] text-base font-semibold uppercase tracking-wider border-b border-[#444] pb-2 mb-5">
            Commercial Terms — Acknowledgement
          </h3>
          <CommercialTerms
            terms={tenderConfig.commercial_terms}
            accepted={termsAccepted}
            onAcceptChange={setTermsAccepted}
            error={errors['terms_accepted']}
          />
        </div>

        {/* Additional Notes (Optional) */}
        {tenderConfig.notes_enabled && (
          <div className="mb-8">
            <h3 className="text-[var(--accent)] text-base font-semibold uppercase tracking-wider border-b border-[#444] pb-2 mb-5">
              Additional Notes (Optional)
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Any clarifications, exclusions, or assumptions..."
              className="w-full bg-[var(--md-dark)] border border-[#555] text-[var(--text-inverse)] px-3.5 py-3 text-sm font-[inherit] transition-colors duration-200 focus:outline-none focus:border-[var(--accent)] placeholder:text-[var(--md-grey)] resize-y"
            />
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={isSubmitting || submitted}
          className="w-full bg-[var(--accent)] text-[var(--bg-primary)] border-none py-4 text-base font-bold uppercase tracking-[2px] cursor-pointer transition-colors duration-200 hover:bg-[var(--accent-hover)] disabled:bg-[#555] disabled:text-[#888] disabled:cursor-not-allowed"
        >
          {isSubmitting
            ? 'SUBMITTING...'
            : submitted
              ? 'SUBMITTED'
              : `Submit Tender — ${tenderConfig.package_code}`}
        </button>
      </form>
    </>
  );
}
