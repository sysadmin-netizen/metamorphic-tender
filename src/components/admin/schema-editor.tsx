'use client';

import { useState, useCallback } from 'react';

/* ---------------------------------------------------------------
   Types
   --------------------------------------------------------------- */

interface SchemaEditorProps {
  initialSchema: string;
  onSave: (schema: string) => void;
}

/* ---------------------------------------------------------------
   Component
   --------------------------------------------------------------- */

export function SchemaEditor({ initialSchema, onSave }: SchemaEditorProps) {
  const [value, setValue] = useState(initialSchema);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value;
    setValue(next);
    setDirty(true);

    try {
      JSON.parse(next);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON');
    }
  }, []);

  const handleSave = useCallback(() => {
    if (error) return;
    try {
      // Re-validate and pretty-print before saving
      const parsed = JSON.parse(value) as unknown;
      const formatted = JSON.stringify(parsed, null, 2);
      setValue(formatted);
      setDirty(false);
      onSave(formatted);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON');
    }
  }, [value, error, onSave]);

  const isValid = error === null;

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-stone-300">
        Form Schema (JSON)
      </label>

      <textarea
        value={value}
        onChange={handleChange}
        rows={16}
        spellCheck={false}
        className={`
          w-full rounded-md border bg-stone-900 px-4 py-3 font-mono text-sm text-stone-200
          placeholder:text-stone-600 focus:outline-none focus:ring-1 resize-y
          ${error
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
            : 'border-stone-700 focus:border-amber-500 focus:ring-amber-500'}
        `}
      />

      {/* Validation error */}
      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {/* Save button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={!isValid || !dirty}
          className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-stone-900 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Save Schema
        </button>
      </div>
    </div>
  );
}
