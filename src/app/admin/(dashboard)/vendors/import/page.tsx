'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CsvImporter } from '@/components/admin/csv-importer';

interface ImportApiResponse {
  success: boolean;
  imported?: number;
  error?: string;
}

export default function VendorImportPage() {
  const router = useRouter();
  const [existingKeys, setExistingKeys] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch existing vendor trade licence numbers for duplicate detection (EC-13)
  useEffect(() => {
    async function fetchExisting() {
      try {
        const res = await fetch('/api/vendors?per_page=10000&fields=trade_licence_number');
        const json: { success: boolean; data?: Array<{ trade_licence_number: string }> } = await res.json();
        if (json.success && json.data) {
          setExistingKeys(new Set(json.data.map((v) => v.trade_licence_number)));
        }
      } catch {
        // Non-critical; duplicates will just not be flagged in preview
      }
    }
    void fetchExisting();
  }, []);

  const handleImport = useCallback(
    async (rows: string[][]) => {
      setImporting(true);
      setResult(null);

      try {
        const res = await fetch('/api/vendors/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rows }),
        });

        const json: ImportApiResponse = await res.json();

        if (!json.success) {
          setResult({ type: 'error', text: json.error ?? 'Import failed' });
          setImporting(false);
          return;
        }

        setResult({
          type: 'success',
          text: `Successfully imported ${json.imported ?? rows.length} vendor${(json.imported ?? rows.length) !== 1 ? 's' : ''}.`,
        });

        // Redirect to vendors list after short delay
        setTimeout(() => {
          router.push('/admin/vendors');
        }, 1500);
      } catch {
        setResult({ type: 'error', text: 'Network error. Please try again.' });
      }
      setImporting(false);
    },
    [router],
  );

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-100">Import Vendors</h1>
        <p className="mt-1 text-sm text-stone-500">
          Paste CSV data or upload a CSV/Excel file to bulk-import vendors
        </p>
      </div>

      {/* Status messages */}
      {result && (
        <div
          className={`rounded-md px-4 py-3 text-sm ${
            result.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}
        >
          {result.text}
        </div>
      )}

      {importing && (
        <div className="flex items-center gap-2 text-sm text-stone-400">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-stone-600 border-t-amber-500" />
          Importing vendors...
        </div>
      )}

      {/* CSV Importer */}
      <div className="rounded-lg border border-stone-700 bg-stone-800/50 p-6">
        <CsvImporter
          onImport={handleImport}
          existingKeys={existingKeys}
          keyColumnIndex={1}
        />
      </div>

      {/* Instructions */}
      <div className="rounded-lg border border-stone-700 bg-stone-800/30 p-5 text-sm text-stone-500">
        <h3 className="font-medium text-stone-400 mb-2">Expected CSV format</h3>
        <p className="font-mono text-xs text-stone-600">
          company_name, trade_licence_number, contact_name, email, whatsapp, tier
        </p>
        <p className="mt-2">
          Rows with trade licence numbers matching existing vendors will be flagged as duplicates
          and excluded from the import.
        </p>
      </div>
    </div>
  );
}
