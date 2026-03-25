'use client';

import type { FormSchema, FormField } from '@/lib/types/form-schema';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

interface FormRendererProps {
  schema: FormSchema;
  vendorData?: Record<string, unknown>;
  values: Record<string, unknown>;
  onChange: (fieldId: string, value: unknown) => void;
  errors: Record<string, string>;
}

function getStringValue(val: unknown): string {
  if (val === null || val === undefined) return '';
  return String(val);
}

function getBooleanValue(val: unknown): boolean {
  return val === true;
}

function resolveValue(
  field: FormField,
  values: Record<string, unknown>,
  vendorData?: Record<string, unknown>,
): unknown {
  const current = values[field.id];
  if (current !== undefined) return current;

  // Attempt vendor prefill if no current value
  if (field.prefill_from_vendor && vendorData) {
    const prefilled = vendorData[field.prefill_from_vendor];
    if (prefilled !== undefined) return prefilled;
  }

  return field.type === 'checkbox' ? false : '';
}

function FieldRenderer({
  field,
  value,
  error,
  onChange,
}: {
  field: FormField;
  value: unknown;
  error: string | undefined;
  onChange: (fieldId: string, value: unknown) => void;
}) {
  switch (field.type) {
    case 'select':
    case 'radio':
      return (
        <Select
          label={field.label}
          options={field.options ?? []}
          value={getStringValue(value)}
          onChange={(e) => onChange(field.id, e.target.value)}
          required={field.required}
          hint={field.hint}
          error={error}
        />
      );

    case 'checkbox':
      return (
        <Checkbox
          label={field.label}
          checked={getBooleanValue(value)}
          onChange={(checked) => onChange(field.id, checked)}
          required={field.required}
          error={error}
        />
      );

    case 'textarea':
      return (
        <Textarea
          label={field.label}
          value={getStringValue(value)}
          onChange={(e) => onChange(field.id, e.target.value)}
          required={field.required}
          placeholder={field.placeholder}
          hint={field.hint}
          error={error}
          rows={field.rows}
        />
      );

    default:
      return (
        <Input
          label={field.label}
          type={field.type}
          value={getStringValue(value)}
          onChange={(e) => onChange(field.id, e.target.value)}
          required={field.required}
          placeholder={field.placeholder}
          hint={field.hint}
          error={error}
          min={field.min}
          max={field.max}
          step={field.step}
        />
      );
  }
}

export function FormRenderer({
  schema,
  vendorData,
  values,
  onChange,
  errors,
}: FormRendererProps) {
  return (
    <div className="flex flex-col gap-8">
      {schema.sections.map((section) => (
        <fieldset key={section.id} className="flex flex-col gap-5">
          <legend className="text-lg font-semibold text-stone-900">
            {section.title}
          </legend>
          {section.description && (
            <p className="text-sm text-stone-500 -mt-3">{section.description}</p>
          )}
          <div className="flex flex-col gap-4">
            {section.fields.map((field) => {
              const resolvedValue = resolveValue(field, values, vendorData);
              return (
                <FieldRenderer
                  key={field.id}
                  field={field}
                  value={resolvedValue}
                  error={errors[field.id]}
                  onChange={onChange}
                />
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
