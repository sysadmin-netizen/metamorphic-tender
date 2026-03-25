'use client';

import { useState, useCallback, useRef } from 'react';

/* ---------------------------------------------------------------
   Types
   --------------------------------------------------------------- */

interface ParsedRow {
  values: string[];
  isDuplicate: boolean;
}

interface CsvImporterProps {
  /** Called with the final array of string[] rows (header excluded). */
  onImport: (rows: string[][]) => void;
  /**
   * Set of identifiers (e.g. existing vendor codes like "EC-13")
   * that should be flagged as duplicates.
   */
  existingKeys?: Set<string>;
  /** Which column index holds the duplicate-detection key. Default: 0. */
  keyColumnIndex?: number;
}

/* ---------------------------------------------------------------
   CSV parsing helper
   --------------------------------------------------------------- */

function parseCSV(raw: string): string[][] {
  const lines = raw.trim().split(/\r?\n/);
  return lines.map((line) =>
    line.split(',').map((cell) => cell.trim().replace(/^"|"$/g, '')),
  );
}

/* ---------------------------------------------------------------
   Component
   --------------------------------------------------------------- */

export function CsvImporter({
  onImport,
  existingKeys = new Set<string>(),
  keyColumnIndex = 0,
}: CsvImporterProps) {
  const [rawText, setRawText] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [previewing, setPreviewing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processCSV = useCallback(
    (text: string) => {
      const allRows = parseCSV(text);
      if (allRows.length < 2) {
        setHeaders([]);
        setParsedRows([]);
        return;
      }
      const [headerRow, ...dataRows] = allRows;
      setHeaders(headerRow);
      setParsedRows(
        dataRows.map((values) => ({
          values,
          isDuplicate: existingKeys.has(values[keyColumnIndex] ?? ''),
        })),
      );
      setPreviewing(true);
    },
    [existingKeys, keyColumnIndex],
  );

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const text = e.target.value;
      setRawText(text);
      if (text.trim().length > 0) {
        processCSV(text);
      } else {
        setPreviewing(false);
        setHeaders([]);
        setParsedRows([]);
      }
    },
    [processCSV],
  );

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result;
        if (typeof text === 'string') {
          setRawText(text);
          processCSV(text);
        }
      };
      reader.readAsText(file);
    },
    [processCSV],
  );

  const handleImport = useCallback(() => {
    const nonDuplicate = parsedRows
      .filter((row) => !row.isDuplicate)
      .map((row) => row.values);
    onImport(nonDuplicate);
  }, [parsedRows, onImport]);

  const duplicateCount = parsedRows.filter((r) => r.isDuplicate).length;
  const importCount = parsedRows.length - duplicateCount;

  return (
    <div className="space-y-4">
      {/* Input area */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-stone-300">
          Paste CSV or upload a file
        </label>
        <textarea
          value={rawText}
          onChange={handleTextChange}
          rows={8}
          placeholder="company_name,trade_licence_number,contact_name,email,whatsapp,tier&#10;Acme Corp,TL-001,John Doe,john@acme.com,+971501234567,trial"
          className="w-full rounded-md border border-stone-700 bg-stone-900 px-4 py-3 font-mono text-sm text-stone-200 placeholder:text-stone-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-y"
        />
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-md border border-stone-700 bg-stone-800 px-3 py-2 text-sm font-medium text-stone-300 hover:bg-stone-700 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            Upload CSV File
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Preview table */}
      {previewing && parsedRows.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-stone-300">
              Preview ({parsedRows.length} row{parsedRows.length !== 1 ? 's' : ''})
            </h3>
            <div className="flex items-center gap-4 text-xs">
              {duplicateCount > 0 && (
                <span className="text-amber-400">
                  {duplicateCount} duplicate{duplicateCount !== 1 ? 's' : ''} will be skipped
                </span>
              )}
              <span className="text-stone-400">
                {importCount} row{importCount !== 1 ? 's' : ''} to import
              </span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-stone-700 max-h-80 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-800/80 sticky top-0 z-10">
                <tr>
                  {headers.map((header, idx) => (
                    <th key={idx} className="text-left px-3 py-2.5 font-medium text-stone-400 whitespace-nowrap">
                      {header}
                    </th>
                  ))}
                  <th className="text-left px-3 py-2.5 font-medium text-stone-400 w-24">Status</th>
                </tr>
              </thead>
              <tbody>
                {parsedRows.map((row, idx) => (
                  <tr
                    key={idx}
                    className={`${idx % 2 === 0 ? 'bg-stone-900' : 'bg-stone-900/50'} ${
                      row.isDuplicate ? 'opacity-60' : ''
                    }`}
                  >
                    {row.values.map((cell, cellIdx) => (
                      <td key={cellIdx} className="px-3 py-2 text-stone-300 whitespace-nowrap">
                        {cell}
                      </td>
                    ))}
                    <td className="px-3 py-2 whitespace-nowrap">
                      {row.isDuplicate ? (
                        <span className="inline-flex items-center rounded bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400 border border-amber-500/20">
                          Already exists
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/20">
                          New
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Import button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleImport}
              disabled={importCount === 0}
              className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-stone-900 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Import {importCount} Row{importCount !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
