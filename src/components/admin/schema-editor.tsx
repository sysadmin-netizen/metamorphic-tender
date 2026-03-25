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
   Sub-components
   --------------------------------------------------------------- */

/* --- Arrow icons for reorder --- */

function ChevronUpIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-4 w-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-4 w-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  );
}

/* --- Option row for select/radio fields --- */

function OptionRow({
  option,
  onUpdate,
  onRemove,
}: {
  option: FieldOption;
  onUpdate: (patch: Partial<FieldOption>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={option.value}
        onChange={(e) => onUpdate({ value: e.target.value, label: option.label || e.target.value })}
        placeholder="Value"
        className="flex-1 rounded border border-stone-600 bg-stone-800 px-2 py-1 text-xs text-stone-200 placeholder:text-stone-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
      />
      <input
        type="text"
        value={option.label}
        onChange={(e) => onUpdate({ label: e.target.value })}
        placeholder="Display label"
        className="flex-1 rounded border border-stone-600 bg-stone-800 px-2 py-1 text-xs text-stone-200 placeholder:text-stone-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
      />
      <button
        type="button"
        onClick={onRemove}
        className="rounded p-1 text-stone-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        aria-label="Remove option"
      >
        <TrashIcon className="h-3 w-3" />
      </button>
    </div>
  );
}

/* --- Single field editor row --- */

function FieldEditor({
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

  return (
    <div className="rounded-lg border border-stone-600 bg-stone-800 p-4 space-y-3">
      {/* Top row: reorder + label + type + required + delete */}
      <div className="flex items-start gap-3">
        {/* Reorder buttons */}
        <div className="flex flex-col gap-0.5 pt-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            className="rounded p-0.5 text-stone-500 hover:text-amber-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Move field up"
          >
            <ChevronUpIcon />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="rounded p-0.5 text-stone-500 hover:text-amber-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Move field down"
          >
            <ChevronDownIcon />
          </button>
        </div>

        {/* Field label */}
        <div className="flex-1">
          <label className="block text-xs font-medium text-stone-500 mb-1">Field Label</label>
          <input
            type="text"
            value={field.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            placeholder="e.g. Company Name"
            className="w-full rounded border border-stone-600 bg-stone-900 px-3 py-2 text-sm text-stone-200 placeholder:text-stone-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        {/* Field type dropdown */}
        <div className="w-36">
          <label className="block text-xs font-medium text-stone-500 mb-1">Type</label>
          <select
            value={field.type}
            onChange={(e) => onUpdate({ type: e.target.value as FieldType })}
            className="w-full rounded border border-stone-600 bg-stone-900 px-3 py-2 text-sm text-stone-200 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            {FIELD_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Required toggle */}
        <div className="flex flex-col items-center pt-5">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={field.required}
              onChange={(e) => onUpdate({ required: e.target.checked })}
              className="rounded border-stone-600 bg-stone-900 text-amber-500 focus:ring-amber-500 focus:ring-offset-0 h-4 w-4"
            />
            <span className="text-xs text-stone-400">Required</span>
          </label>
        </div>

        {/* Delete */}
        <button
          type="button"
          onClick={onRemove}
          className="mt-5 rounded p-1.5 text-stone-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          aria-label={`Delete field ${field.label || index + 1}`}
        >
          <TrashIcon />
        </button>
      </div>

      {/* Second row: placeholder + hint */}
      <div className="grid grid-cols-2 gap-3 pl-9">
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">Placeholder</label>
          <input
            type="text"
            value={field.placeholder}
            onChange={(e) => onUpdate({ placeholder: e.target.value })}
            placeholder="Placeholder text..."
            className="w-full rounded border border-stone-600 bg-stone-900 px-3 py-1.5 text-sm text-stone-200 placeholder:text-stone-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">Hint text</label>
          <input
            type="text"
            value={field.hint}
            onChange={(e) => onUpdate({ hint: e.target.value })}
            placeholder="Help text shown below field..."
            className="w-full rounded border border-stone-600 bg-stone-900 px-3 py-1.5 text-sm text-stone-200 placeholder:text-stone-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Options area for select / radio */}
      {showOptions && (
        <div className="pl-9 space-y-2">
          <label className="block text-xs font-medium text-stone-500">Options</label>
          {field.options.length === 0 && (
            <p className="text-xs text-stone-600 italic">No options yet. Add at least one option.</p>
          )}
          {field.options.map((opt, optIdx) => (
            <OptionRow
              key={optIdx}
              option={opt}
              onUpdate={(patch) => updateOption(optIdx, patch)}
              onRemove={() => removeOption(optIdx)}
            />
          ))}
          <button
            type="button"
            onClick={addOption}
            className="inline-flex items-center gap-1 rounded border border-dashed border-stone-600 px-2 py-1 text-xs text-stone-400 hover:text-amber-400 hover:border-amber-500/50 transition-colors"
          >
            <PlusIcon className="h-3 w-3" />
            Add Option
          </button>
        </div>
      )}
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
    const title = prompt('Section title:');
    if (!title || !title.trim()) return;
    const id = generateId('section');
    setSections((prev) => [
      ...prev,
      { id, title: title.trim(), description: '', fields: [], collapsed: false },
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
    if (!confirm('Delete this entire section and all its fields?')) return;
    setSections((prev) => prev.filter((_, i) => i !== sectionIdx));
    setDirty(true);
  }, []);

  const toggleSection = useCallback((sectionIdx: number) => {
    setSections((prev) => {
      const next = [...prev];
      next[sectionIdx] = { ...next[sectionIdx], collapsed: !next[sectionIdx].collapsed };
      return next;
    });
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
    if (!confirm('Delete this field?')) return;
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-stone-200">Form Schema</h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Build the vendor submission form visually. Add sections and fields below.
          </p>
        </div>
        <button
          type="button"
          onClick={addSection}
          className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-400 hover:bg-amber-500/20 transition-colors"
        >
          <PlusIcon />
          Add Section
        </button>
      </div>

      {/* Sections */}
      {sections.length === 0 && (
        <div className="rounded-lg border border-dashed border-stone-600 bg-stone-900/50 py-12 text-center">
          <p className="text-sm text-stone-500">No sections yet.</p>
          <p className="text-xs text-stone-600 mt-1">Click &quot;Add Section&quot; to get started.</p>
        </div>
      )}

      {sections.map((section, sIdx) => (
        <div
          key={section.id}
          className="rounded-lg border border-stone-700 bg-stone-900/50 overflow-hidden"
        >
          {/* Section header */}
          <div className="flex items-center gap-3 bg-stone-800/80 px-4 py-3">
            <button
              type="button"
              onClick={() => toggleSection(sIdx)}
              className="text-stone-400 hover:text-stone-200 transition-colors"
              aria-label={section.collapsed ? 'Expand section' : 'Collapse section'}
            >
              <svg
                className={`h-4 w-4 transition-transform ${section.collapsed ? '' : 'rotate-90'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={section.title}
                onChange={(e) => updateSection(sIdx, { title: e.target.value })}
                className="w-full bg-transparent text-sm font-semibold text-stone-200 placeholder:text-stone-600 focus:outline-none border-b border-transparent focus:border-amber-500 transition-colors"
                placeholder="Section title..."
              />
            </div>

            <span className="text-xs text-stone-500 tabular-nums whitespace-nowrap">
              {section.fields.length} field{section.fields.length !== 1 ? 's' : ''}
            </span>

            <button
              type="button"
              onClick={() => removeSection(sIdx)}
              className="rounded p-1.5 text-stone-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              aria-label={`Delete section ${section.title}`}
            >
              <TrashIcon />
            </button>
          </div>

          {/* Section body (collapsible) */}
          {!section.collapsed && (
            <div className="px-4 pb-4 pt-3 space-y-3">
              {/* Section description */}
              <input
                type="text"
                value={section.description}
                onChange={(e) => updateSection(sIdx, { description: e.target.value })}
                placeholder="Section description (optional)..."
                className="w-full rounded border border-stone-700 bg-stone-800/50 px-3 py-1.5 text-xs text-stone-300 placeholder:text-stone-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />

              {/* Fields */}
              {section.fields.length === 0 && (
                <p className="py-4 text-center text-xs text-stone-600 italic">
                  No fields in this section. Click &quot;Add Field&quot; below.
                </p>
              )}

              {section.fields.map((field, fIdx) => (
                <FieldEditor
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

              {/* Add field button */}
              <button
                type="button"
                onClick={() => addField(sIdx)}
                className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-stone-600 px-3 py-2 text-xs font-medium text-stone-400 hover:text-amber-400 hover:border-amber-500/50 transition-colors w-full justify-center"
              >
                <PlusIcon className="h-3.5 w-3.5" />
                Add Field
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Save button */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty}
          className="rounded-md bg-amber-600 px-5 py-2.5 text-sm font-semibold text-stone-900 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
