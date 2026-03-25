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
   Constants
   --------------------------------------------------------------- */

const COMMON_UNITS = [
  { value: 'm\u00B2', label: 'm\u00B2 - Square metres' },
  { value: 'm\u00B3', label: 'm\u00B3 - Cubic metres' },
  { value: 'kg', label: 'kg - Kilograms' },
  { value: 'LS', label: 'LS - Lump Sum' },
  { value: 'nr', label: 'nr - Number' },
  { value: 'LM', label: 'LM - Linear metres' },
  { value: 'set', label: 'set - Set' },
  { value: 'm', label: 'm - Metres' },
  { value: 'ton', label: 'ton - Tonnes' },
  { value: 'hr', label: 'hr - Hours' },
  { value: 'day', label: 'day - Days' },
  { value: 'pcs', label: 'pcs - Pieces' },
] as const;

/* ---------------------------------------------------------------
   Helpers
   --------------------------------------------------------------- */

/** Generate next sequential code based on existing rows (A-001, A-002, ...) */
function generateNextCode(rows: BoqLineItem[]): string {
  let maxNum = 0;
  for (const row of rows) {
    const match = /^A-(\d+)$/i.exec(row.code.trim());
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }
  const next = maxNum + 1;
  return `A-${String(next).padStart(3, '0')}`;
}

/* ---------------------------------------------------------------
   Component
   --------------------------------------------------------------- */

export function BoqEditor({ initialTemplate, onSave }: BoqEditorProps) {
  const [rows, setRows] = useState<BoqLineItem[]>(initialTemplate);
  const [dirty, setDirty] = useState(false);
  const [confirmDeleteIdx, setConfirmDeleteIdx] = useState<number | null>(null);

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
    setRows((prev) => [
      ...prev,
      { code: generateNextCode(prev), description: '', unit: '', quantity: 0 },
    ]);
    setDirty(true);
  }, []);

  const removeRow = useCallback((index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
    setDirty(true);
    setConfirmDeleteIdx(null);
  }, []);

  const handleSave = useCallback(() => {
    onSave(rows);
    setDirty(false);
  }, [rows, onSave]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-stone-200">BOQ Template</h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Define the bill of quantities line items vendors will price against.
          </p>
        </div>
        <span className="text-xs text-stone-500 tabular-nums">
          {rows.length} row{rows.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-stone-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-stone-800">
              <th className="text-center px-2 py-3 font-medium text-stone-500 text-xs uppercase tracking-wider w-12">
                #
              </th>
              <th className="text-left px-3 py-3 font-medium text-stone-500 text-xs uppercase tracking-wider w-32">
                Code
              </th>
              <th className="text-left px-3 py-3 font-medium text-stone-500 text-xs uppercase tracking-wider">
                Description
              </th>
              <th className="text-left px-3 py-3 font-medium text-stone-500 text-xs uppercase tracking-wider w-36">
                Unit
              </th>
              <th className="text-right px-3 py-3 font-medium text-stone-500 text-xs uppercase tracking-wider w-28">
                Quantity
              </th>
              <th className="w-14" />
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-700/50">
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sm text-stone-600 italic">
                  No line items yet. Click &quot;Add Row&quot; to add your first BOQ item.
                </td>
              </tr>
            )}
            {rows.map((row, idx) => (
              <tr
                key={idx}
                className={`${idx % 2 === 0 ? 'bg-stone-900' : 'bg-stone-900/60'} hover:bg-stone-800/50 transition-colors`}
              >
                {/* Row number */}
                <td className="px-2 py-2 text-center">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-stone-800 text-xs font-medium text-stone-500 tabular-nums">
                    {idx + 1}
                  </span>
                </td>

                {/* Code */}
                <td className="px-2 py-2">
                  <input
                    type="text"
                    value={row.code}
                    onChange={(e) => updateRow(idx, 'code', e.target.value)}
                    className="w-full rounded border border-stone-700 bg-stone-800 px-2.5 py-2 text-sm font-mono text-stone-200 placeholder:text-stone-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    placeholder="A-001"
                  />
                </td>

                {/* Description */}
                <td className="px-2 py-2">
                  <input
                    type="text"
                    value={row.description}
                    onChange={(e) => updateRow(idx, 'description', e.target.value)}
                    className="w-full rounded border border-stone-700 bg-stone-800 px-2.5 py-2 text-sm text-stone-200 placeholder:text-stone-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    placeholder="Line item description"
                  />
                </td>

                {/* Unit (dropdown) */}
                <td className="px-2 py-2">
                  <select
                    value={row.unit}
                    onChange={(e) => updateRow(idx, 'unit', e.target.value)}
                    className="w-full rounded border border-stone-700 bg-stone-800 px-2.5 py-2 text-sm text-stone-200 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="" className="text-stone-600">Select unit...</option>
                    {COMMON_UNITS.map((u) => (
                      <option key={u.value} value={u.value}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </td>

                {/* Quantity */}
                <td className="px-2 py-2">
                  <input
                    type="number"
                    value={row.quantity}
                    onChange={(e) => updateRow(idx, 'quantity', e.target.value)}
                    className="w-full rounded border border-stone-700 bg-stone-800 px-2.5 py-2 text-sm text-stone-200 text-right tabular-nums focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    min={0}
                    step="any"
                  />
                </td>

                {/* Delete */}
                <td className="px-2 py-2 text-center">
                  {confirmDeleteIdx === idx ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => removeRow(idx)}
                        className="rounded px-1.5 py-1 text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors"
                        aria-label="Confirm delete"
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteIdx(null)}
                        className="rounded px-1.5 py-1 text-xs font-medium text-stone-400 bg-stone-700 hover:bg-stone-600 transition-colors"
                        aria-label="Cancel delete"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteIdx(idx)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded text-stone-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      aria-label={`Remove row ${row.code || idx + 1}`}
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                        />
                      </svg>
                    </button>
                  )}
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
          className="inline-flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm font-medium text-amber-400 hover:bg-amber-500/20 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Row
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty}
          className="rounded-md bg-amber-600 px-5 py-2.5 text-sm font-semibold text-stone-900 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Save BOQ Template
        </button>
      </div>
    </div>
  );
}
