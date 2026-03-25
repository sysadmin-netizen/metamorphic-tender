'use client';

import { useState, useCallback } from 'react';
import type { FormSchemaJson } from '@/types';

/* ---------------------------------------------------------------
   Types
   --------------------------------------------------------------- */

/** Field types the admin can choose from */
const FIELD_TYPES = [
  'text',
  'email',
  'tel',
  'number',
  'date',
  'select',
  'checkbox',
  'textarea',
  'radio',
] as const;

type FieldType = (typeof FIELD_TYPES)[number];

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: 'Short Text',
  email: 'Email',
  tel: 'Phone',
  number: 'Number',
  date: 'Date',
  select: 'Dropdown',
  checkbox: 'Checkbox',
  textarea: 'Long Text',
  radio: 'Multiple Choice',
};

interface FieldOption {
  value: string;
  label: string;
}

interface EditorField {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  placeholder: string;
  hint: string;
  options: FieldOption[];
  prefill_from_vendor: string;
}

interface EditorSection {
  id: string;
  title: string;
  description: string;
  fields: EditorField[];
  collapsed: boolean;
}

interface SchemaEditorProps {
  initialSchema: FormSchemaJson;
  onSave: (schema: FormSchemaJson) => void;
}

/* ---------------------------------------------------------------
   Helpers
   --------------------------------------------------------------- */

function generateId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function fieldHasOptions(type: FieldType): boolean {
  return type === 'select' || type === 'radio';
}

/** Parse a FormSchemaJson into mutable editor state */
function schemaToEditorState(schema: FormSchemaJson): EditorSection[] {
  return schema.sections.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description ?? '',
    collapsed: false,
    fields: s.fields.map((f) => ({
      id: f.id,
      type: (FIELD_TYPES.includes(f.type as FieldType) ? f.type : 'text') as FieldType,
      label: f.label,
      required: f.required,
      placeholder: f.placeholder ?? '',
      hint: f.hint ?? '',
      options: f.options ?? [],
      prefill_from_vendor: f.prefill_from_vendor ?? '',
    })),
  }));
}

/** Serialize editor state back to FormSchemaJson */
function editorStateToSchema(sections: EditorSection[]): FormSchemaJson {
  return {
    sections: sections.map((s) => ({
      id: s.id,
      title: s.title,
      ...(s.description ? { description: s.description } : {}),
      fields: s.fields.map((f) => {
        const base: FormSchemaJson['sections'][number]['fields'][number] = {
          id: f.id,
          type: f.type,
          label: f.label,
          required: f.required,
        };
        if (f.placeholder) base.placeholder = f.placeholder;
        if (f.hint) base.hint = f.hint;
        if (f.prefill_from_vendor) base.prefill_from_vendor = f.prefill_from_vendor;
        if (fieldHasOptions(f.type) && f.options.length > 0) {
          base.options = f.options.filter((o) => o.value.trim() !== '');
        }
        return base;
      }),
    })),
  };
}

/* ---------------------------------------------------------------
   SVG Icons
   --------------------------------------------------------------- */

function ArrowUpIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
    </svg>
  );
}

function ArrowDownIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-5 w-5'} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-5 w-5'} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-4 w-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

/* ---------------------------------------------------------------
   Sub-components — Google Forms-style cards
   --------------------------------------------------------------- */

/** Option row for select/radio fields */
function OptionRow({
  option,
  index,
  fieldType,
  onUpdate,
  onRemove,
}: {
  option: FieldOption;
  index: number;
  fieldType: FieldType;
  onUpdate: (patch: Partial<FieldOption>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      {/* Radio/checkbox indicator */}
      <span className="flex-shrink-0 text-stone-500">
        {fieldType === 'radio' ? (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <circle cx="12" cy="12" r="9" />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
          </svg>
        )}
      </span>
      <input
        type="text"
        value={option.label || option.value}
        onChange={(e) => onUpdate({ value: e.target.value, label: e.target.value })}
        placeholder={`Option ${index + 1}`}
        className="flex-1 min-w-0 rounded-md border border-stone-600 bg-stone-900 px-3 py-2 text-sm text-stone-200 placeholder:text-stone-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
      />
      <button
        type="button"
        onClick={onRemove}
        className="flex-shrink-0 rounded-md p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        aria-label="Remove option"
      >
        <XIcon />
      </button>
    </div>
  );
}

/** Single field editor — Google Forms card layout */
function FieldCard({
  field,
  index,
  total,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  field: EditorField;
  index: number;
  total: number;
  onUpdate: (patch: Partial<EditorField>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const showOptions = fieldHasOptions(field.type);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const addOption = () => {
    onUpdate({ options: [...field.options, { value: '', label: '' }] });
  };

  const updateOption = (optIdx: number, patch: Partial<FieldOption>) => {
    const next = field.options.map((o, i) => (i === optIdx ? { ...o, ...patch } : o));
    onUpdate({ options: next });
  };

  const removeOption = (optIdx: number) => {
    onUpdate({ options: field.options.filter((_, i) => i !== optIdx) });
  };

  const handleDelete = () => {
    if (confirmDelete) {
      onRemove();
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  return (
    <div className="rounded-xl border border-stone-700 bg-stone-800/50 p-4 sm:p-6 flex flex-col gap-3">
      {/* Field label — the MAIN prominent input */}
      <input
        type="text"
        value={field.label}
        onChange={(e) => onUpdate({ label: e.target.value })}
        placeholder="Field label (e.g. Company Name)"
        className="w-full text-base sm:text-lg font-medium rounded-md border-0 border-b-2 border-stone-600 bg-transparent px-1 py-2 text-stone-100 placeholder:text-stone-600 focus:border-amber-500 focus:outline-none transition-colors"
      />

      {/* Type + Required — stacks on mobile, row on desktop */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-start sm:items-center">
        <div className="w-full sm:w-auto sm:min-w-[180px]">
          <select
            value={field.type}
            onChange={(e) => onUpdate({ type: e.target.value as FieldType })}
            className="w-full rounded-md border border-stone-600 bg-stone-900 px-3 py-2.5 text-sm text-stone-200 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 min-h-[44px]"
          >
            {FIELD_TYPES.map((t) => (
              <option key={t} value={t}>
                {FIELD_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 cursor-pointer min-h-[44px] px-1">
          <input
            type="checkbox"
            checked={field.required}
            onChange={(e) => onUpdate({ required: e.target.checked })}
            className="rounded border-stone-600 bg-stone-900 text-amber-500 focus:ring-amber-500 focus:ring-offset-0 h-5 w-5"
          />
          <span className="text-sm text-stone-300">Required</span>
        </label>
      </div>

      {/* Placeholder */}
      <div>
        <label className="block text-xs font-medium text-stone-500 mb-1">Placeholder</label>
        <input
          type="text"
          value={field.placeholder}
          onChange={(e) => onUpdate({ placeholder: e.target.value })}
          placeholder="Placeholder text..."
          className="w-full rounded-md border border-stone-600 bg-stone-900 px-3 py-2 text-sm text-stone-200 placeholder:text-stone-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
      </div>

      {/* Hint */}
      <div>
        <label className="block text-xs font-medium text-stone-500 mb-1">Hint text</label>
        <input
          type="text"
          value={field.hint}
          onChange={(e) => onUpdate({ hint: e.target.value })}
          placeholder="Help text shown below field..."
          className="w-full rounded-md border border-stone-600 bg-stone-900 px-3 py-2 text-sm text-stone-200 placeholder:text-stone-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
      </div>

      {/* Options area for select / radio */}
      {showOptions && (
        <div className="flex flex-col gap-2">
          <label className="block text-xs font-medium text-stone-400">Options</label>
          {field.options.length === 0 && (
            <p className="text-xs text-stone-600 italic py-1">No options yet. Add at least one option.</p>
          )}
          {field.options.map((opt, optIdx) => (
            <OptionRow
              key={optIdx}
              option={opt}
              index={optIdx}
              fieldType={field.type}
              onUpdate={(patch) => updateOption(optIdx, patch)}
              onRemove={() => removeOption(optIdx)}
            />
          ))}
          <button
            type="button"
            onClick={addOption}
            className="inline-flex items-center gap-2 rounded-md border border-dashed border-stone-600 px-3 py-2 text-sm text-stone-400 hover:text-amber-400 hover:border-amber-500/50 transition-colors min-h-[44px]"
          >
            <PlusIcon className="h-4 w-4" />
            Add Option
          </button>
        </div>
      )}

      {/* Action toolbar — reorder + delete */}
      <div className="flex gap-2 justify-end pt-2 border-t border-stone-700/50">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={index === 0}
          className="rounded-md p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-400 hover:text-amber-400 hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Move field up"
        >
          <ArrowUpIcon />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={index === total - 1}
          className="rounded-md p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-400 hover:text-amber-400 hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Move field down"
        >
          <ArrowDownIcon />
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className={`rounded-md p-2 min-h-[44px] flex items-center justify-center gap-1.5 transition-colors ${
            confirmDelete
              ? 'bg-red-500/20 text-red-400 px-3'
              : 'text-stone-400 hover:text-red-400 hover:bg-red-500/10 min-w-[44px]'
          }`}
          aria-label={`Delete field ${field.label || index + 1}`}
        >
          <TrashIcon className="h-5 w-5" />
          {confirmDelete && <span className="text-xs font-medium">Confirm?</span>}
        </button>
      </div>
    </div>
  );
}

/** Section header — Google Forms-style with colored left border */
function SectionCard({
  section,
  sectionIdx,
  children,
  onUpdateTitle,
  onUpdateDescription,
  onRemove,
}: {
  section: EditorSection;
  sectionIdx: number;
  children: React.ReactNode;
  onUpdateTitle: (title: string) => void;
  onUpdateDescription: (desc: string) => void;
  onRemove: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = () => {
    if (confirmDelete) {
      onRemove();
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Section header card */}
      <div className="rounded-xl border border-stone-700 bg-stone-800/50 border-l-4 border-l-amber-500 p-4 sm:p-6 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={section.title}
              onChange={(e) => onUpdateTitle(e.target.value)}
              placeholder="Section title..."
              className="w-full text-lg sm:text-xl font-semibold rounded-md border-0 border-b-2 border-stone-600 bg-transparent px-1 py-1 text-stone-100 placeholder:text-stone-600 focus:border-amber-500 focus:outline-none transition-colors"
            />
          </div>
          <span className="text-xs text-stone-500 tabular-nums whitespace-nowrap pt-2">
            Section {sectionIdx + 1}
          </span>
        </div>

        <input
          type="text"
          value={section.description}
          onChange={(e) => onUpdateDescription(e.target.value)}
          placeholder="Section description (optional)..."
          className="w-full rounded-md border border-stone-700 bg-stone-900/50 px-3 py-2 text-sm text-stone-300 placeholder:text-stone-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        />

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleDelete}
            className={`rounded-md p-2 min-h-[44px] flex items-center justify-center gap-1.5 transition-colors ${
              confirmDelete
                ? 'bg-red-500/20 text-red-400 px-3'
                : 'text-stone-400 hover:text-red-400 hover:bg-red-500/10 min-w-[44px]'
            }`}
            aria-label={`Delete section ${section.title}`}
          >
            <TrashIcon className="h-5 w-5" />
            {confirmDelete && <span className="text-xs font-medium">Delete Section?</span>}
          </button>
        </div>
      </div>

      {/* Fields within section */}
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------
   Main component
   --------------------------------------------------------------- */

export function SchemaEditor({ initialSchema, onSave }: SchemaEditorProps) {
  const [sections, setSections] = useState<EditorSection[]>(() =>
    schemaToEditorState(initialSchema),
  );
  const [dirty, setDirty] = useState(false);

  /* --- Section operations --- */

  const addSection = useCallback(() => {
    const id = generateId('section');
    setSections((prev) => [
      ...prev,
      { id, title: '', description: '', fields: [], collapsed: false },
    ]);
    setDirty(true);
  }, []);

  const updateSection = useCallback((sectionIdx: number, patch: Partial<EditorSection>) => {
    setSections((prev) => {
      const next = [...prev];
      next[sectionIdx] = { ...next[sectionIdx], ...patch };
      return next;
    });
    setDirty(true);
  }, []);

  const removeSection = useCallback((sectionIdx: number) => {
    setSections((prev) => prev.filter((_, i) => i !== sectionIdx));
    setDirty(true);
  }, []);

  /* --- Field operations within a section --- */

  const addField = useCallback((sectionIdx: number) => {
    setSections((prev) => {
      const next = [...prev];
      const section = { ...next[sectionIdx] };
      section.fields = [
        ...section.fields,
        {
          id: generateId('field'),
          type: 'text' as FieldType,
          label: '',
          required: false,
          placeholder: '',
          hint: '',
          options: [],
          prefill_from_vendor: '',
        },
      ];
      next[sectionIdx] = section;
      return next;
    });
    setDirty(true);
  }, []);

  const updateField = useCallback(
    (sectionIdx: number, fieldIdx: number, patch: Partial<EditorField>) => {
      setSections((prev) => {
        const next = [...prev];
        const section = { ...next[sectionIdx] };
        section.fields = [...section.fields];
        section.fields[fieldIdx] = { ...section.fields[fieldIdx], ...patch };
        next[sectionIdx] = section;
        return next;
      });
      setDirty(true);
    },
    [],
  );

  const removeField = useCallback((sectionIdx: number, fieldIdx: number) => {
    setSections((prev) => {
      const next = [...prev];
      const section = { ...next[sectionIdx] };
      section.fields = section.fields.filter((_, i) => i !== fieldIdx);
      next[sectionIdx] = section;
      return next;
    });
    setDirty(true);
  }, []);

  const moveField = useCallback((sectionIdx: number, fieldIdx: number, direction: -1 | 1) => {
    setSections((prev) => {
      const next = [...prev];
      const section = { ...next[sectionIdx] };
      const fields = [...section.fields];
      const targetIdx = fieldIdx + direction;
      if (targetIdx < 0 || targetIdx >= fields.length) return prev;
      [fields[fieldIdx], fields[targetIdx]] = [fields[targetIdx], fields[fieldIdx]];
      section.fields = fields;
      next[sectionIdx] = section;
      return next;
    });
    setDirty(true);
  }, []);

  /* --- Save --- */

  const handleSave = useCallback(() => {
    const schema = editorStateToSchema(sections);
    onSave(schema);
    setDirty(false);
  }, [sections, onSave]);

  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-stone-200">Form Schema</h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Build the vendor submission form. Add sections and fields below.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty}
          className="rounded-md bg-amber-600 px-5 py-2.5 text-sm font-semibold text-stone-900 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors min-h-[44px]"
        >
          Save Changes
        </button>
      </div>

      {/* Empty state */}
      {sections.length === 0 && (
        <div className="rounded-xl border border-dashed border-stone-600 bg-stone-900/50 py-12 text-center">
          <p className="text-sm text-stone-500">No sections yet.</p>
          <p className="text-xs text-stone-600 mt-1">Click the button below to get started.</p>
        </div>
      )}

      {/* Sections + Fields */}
      {sections.map((section, sIdx) => (
        <SectionCard
          key={section.id}
          section={section}
          sectionIdx={sIdx}
          onUpdateTitle={(title) => updateSection(sIdx, { title })}
          onUpdateDescription={(description) => updateSection(sIdx, { description })}
          onRemove={() => removeSection(sIdx)}
        >
          {/* Fields list */}
          {section.fields.length === 0 && (
            <div className="rounded-xl border border-dashed border-stone-700 bg-stone-900/30 py-6 text-center">
              <p className="text-xs text-stone-600 italic">
                No fields in this section yet.
              </p>
            </div>
          )}

          {section.fields.map((field, fIdx) => (
            <FieldCard
              key={field.id}
              field={field}
              index={fIdx}
              total={section.fields.length}
              onUpdate={(patch) => updateField(sIdx, fIdx, patch)}
              onRemove={() => removeField(sIdx, fIdx)}
              onMoveUp={() => moveField(sIdx, fIdx, -1)}
              onMoveDown={() => moveField(sIdx, fIdx, 1)}
            />
          ))}

          {/* Add field button — prominent card style */}
          <button
            type="button"
            onClick={() => addField(sIdx)}
            className="w-full rounded-xl border-2 border-dashed border-stone-700 bg-stone-900/30 py-4 flex items-center justify-center gap-2 text-sm font-medium text-stone-400 hover:text-amber-400 hover:border-amber-500/50 hover:bg-stone-800/30 transition-colors min-h-[56px]"
          >
            <PlusIcon className="h-5 w-5" />
            Add Field
          </button>
        </SectionCard>
      ))}

      {/* Add Section button — prominent */}
      <button
        type="button"
        onClick={addSection}
        className="w-full rounded-xl border-2 border-dashed border-amber-500/30 bg-amber-500/5 py-5 flex items-center justify-center gap-2 text-sm font-semibold text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/50 transition-colors min-h-[56px]"
      >
        <PlusIcon className="h-5 w-5" />
        Add Section
      </button>

      {/* Bottom save button (for convenience after long forms) */}
      {sections.length > 0 && (
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={!dirty}
            className="rounded-md bg-amber-600 px-5 py-2.5 text-sm font-semibold text-stone-900 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors min-h-[44px]"
          >
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
}
