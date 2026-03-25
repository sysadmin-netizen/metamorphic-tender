'use client';

import { useState, useCallback } from 'react';
import type { BoqLineItem } from '@/types';

/* ---------------------------------------------------------------
   Types
   --------------------------------------------------------------- */

interface BoqEditorProps {
  initialTemplate: BoqLineItem[];
  onSave: (template: BoqLineItem[]) => void;
}

/* ---------------------------------------------------------------
   Component
   --------------------------------------------------------------- */

export function BoqEditor({ initialTemplate, onSave }: BoqEditorProps) {
  const [rows, setRows] = useState<BoqLineItem[]>(initialTemplate);
  const [dirty, setDirty] = useState(false);

  const updateRow = useCallback((index: number, field: keyof BoqLineItem, rawValue: string) => {
    setRows((prev) => {
      const next = [...prev];
      const row = { ...next[index] };

      if (field === 'quantity') {
        const parsed = parseFloat(rawValue);
        row.quantity = Number.isNaN(parsed) ? 0 : parsed;
      } else {
        row[field] = rawValue;
      }

      next[index] = row;
      return next;
    });
    setDirty(true);
  }, []);

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, { code: '', description: '', unit: '', quantity: 0 }]);
    setDirty(true);
  }, []);

  const removeRow = useCallback((index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
    setDirty(true);
  }, []);

  const handleSave = useCallback(() => {
    onSave(rows);
    setDirty(false);
  }, [rows, onSave]);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-stone-300">
        BOQ Template
      </label>

      <div className="overflow-x-auto rounded-lg border border-stone-700">
        <table className="w-full text-sm">
          <thead className="bg-stone-800/80">
            <tr>
              <th className="text-left px-3 py-2.5 font-medium text-stone-400 w-32">Code</th>
              <th className="text-left px-3 py-2.5 font-medium text-stone-400">Description</th>
              <th className="text-left px-3 py-2.5 font-medium text-stone-400 w-24">Unit</th>
              <th className="text-right px-3 py-2.5 font-medium text-stone-400 w-28">Quantity</th>
              <th className="w-12" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-stone-900' : 'bg-stone-900/50'}>
                <td className="px-2 py-1.5">
                  <input
                    type="text"
                    value={row.code}
                    onChange={(e) => updateRow(idx, 'code', e.target.value)}
                    className="w-full rounded border border-stone-700 bg-stone-800 px-2 py-1.5 text-sm font-mono text-stone-200 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    placeholder="BOQ-001"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <input
                    type="text"
                    value={row.description}
                    onChange={(e) => updateRow(idx, 'description', e.target.value)}
                    className="w-full rounded border border-stone-700 bg-stone-800 px-2 py-1.5 text-sm text-stone-200 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    placeholder="Line item description"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <input
                    type="text"
                    value={row.unit}
                    onChange={(e) => updateRow(idx, 'unit', e.target.value)}
                    className="w-full rounded border border-stone-700 bg-stone-800 px-2 py-1.5 text-sm text-stone-200 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    placeholder="m2"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <input
                    type="number"
                    value={row.quantity}
                    onChange={(e) => updateRow(idx, 'quantity', e.target.value)}
                    className="w-full rounded border border-stone-700 bg-stone-800 px-2 py-1.5 text-sm text-stone-200 text-right tabular-nums focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    min={0}
                    step="any"
                  />
                </td>
                <td className="px-2 py-1.5 text-center">
                  <button
                    type="button"
                    onClick={() => removeRow(idx)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded text-stone-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    aria-label={`Remove row ${row.code || idx + 1}`}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-1.5 rounded-md border border-stone-700 bg-stone-800 px-3 py-2 text-sm font-medium text-stone-300 hover:bg-stone-700 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Row
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty}
          className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-stone-900 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Save BOQ Template
        </button>
      </div>
    </div>
  );
}
