export interface FormSchema {
  sections: FormSection[];
}

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
}

export interface FormField {
  id: string;
  type: 'text' | 'email' | 'tel' | 'number' | 'date' | 'select' | 'checkbox' | 'textarea' | 'radio';
  label: string;
  required: boolean;
  placeholder?: string;
  prefill_from_vendor?: string;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  step?: number;
  rows?: number;
  hint?: string;
}

export interface BoqLineItem {
  code: string;
  description: string;
  unit: string;
  quantity: number;
}

export interface BoqSubmissionItem {
  code: string;
  rate: number;
  total: number;
}
