import type { FormSchema, FormField, BoqLineItem } from './types/form-schema';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateField(
  field: FormField,
  value: unknown,
  errors: string[]
): void {
  const isEmpty =
    value === undefined ||
    value === null ||
    value === '' ||
    (typeof value === 'string' && value.trim() === '');

  if (field.required && isEmpty) {
    errors.push(`${field.label} is required`);
    return;
  }

  if (isEmpty) {
    return;
  }

  switch (field.type) {
    case 'email': {
      if (typeof value !== 'string' || !EMAIL_REGEX.test(value)) {
        errors.push(`${field.label} must be a valid email address`);
      }
      break;
    }
    case 'number': {
      const num = typeof value === 'number' ? value : Number(value);
      if (isNaN(num)) {
        errors.push(`${field.label} must be a valid number`);
      } else {
        if (field.min !== undefined && num < field.min) {
          errors.push(`${field.label} must be at least ${field.min}`);
        }
        if (field.max !== undefined && num > field.max) {
          errors.push(`${field.label} must be at most ${field.max}`);
        }
      }
      break;
    }
    case 'select':
    case 'radio': {
      if (field.options && field.options.length > 0) {
        const validValues = field.options.map((opt) => opt.value);
        if (typeof value !== 'string' || !validValues.includes(value)) {
          errors.push(`${field.label} must be one of the available options`);
        }
      }
      break;
    }
    case 'checkbox': {
      if (field.required && value !== true) {
        // Replace the generic required error with a more specific one
        const idx = errors.indexOf(`${field.label} is required`);
        if (idx !== -1) {
          errors.splice(idx, 1);
        }
        errors.push(`${field.label} must be accepted`);
      }
      break;
    }
  }
}

export function validateFormData(
  formData: Record<string, unknown>,
  schema: FormSchema
): string[] {
  const errors: string[] = [];

  for (const section of schema.sections) {
    for (const field of section.fields) {
      const value = formData[field.id];

      if (field.type === 'checkbox' && field.required && value !== true) {
        errors.push(`${field.label} must be accepted`);
        continue;
      }

      validateField(field, value, errors);
    }
  }

  return errors;
}

interface BoqDataEntry {
  code: string;
  rate: number;
  total: number;
}

function isBoqDataEntry(item: unknown): item is BoqDataEntry {
  if (typeof item !== 'object' || item === null) return false;
  const record = item as Record<string, unknown>;
  return (
    typeof record['code'] === 'string' &&
    'rate' in record &&
    'total' in record
  );
}

export function validateBoqData(
  boqData: unknown[],
  template: BoqLineItem[]
): string[] {
  const errors: string[] = [];

  const submittedMap = new Map<string, BoqDataEntry>();
  for (const item of boqData) {
    if (isBoqDataEntry(item)) {
      submittedMap.set(item.code, item);
    }
  }

  for (const templateItem of template) {
    const entry = submittedMap.get(templateItem.code);

    if (!entry) {
      errors.push(`Missing BOQ entry for item ${templateItem.code}: ${templateItem.description}`);
      continue;
    }

    const rate = Number(entry.rate);
    if (isNaN(rate)) {
      errors.push(`Rate for ${templateItem.code} must be a valid number`);
    } else if (rate < 0) {
      errors.push(`Rate for ${templateItem.code} cannot be negative`);
    }

    const total = Number(entry.total);
    if (isNaN(total)) {
      errors.push(`Total for ${templateItem.code} must be a valid number`);
    } else if (total < 0) {
      errors.push(`Total for ${templateItem.code} cannot be negative`);
    }
  }

  return errors;
}
