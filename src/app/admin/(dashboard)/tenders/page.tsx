'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { TenderCard } from '@/components/admin/tender-card';
import type { TenderCardData } from '@/types';

interface TenderListResponse {
  success: boolean;
  data?: Array<{
    id: string;
    package_code: string;
    package_name: string;
    project_name: string;
    closing_deadline: string;
    is_active: boolean;
    is_archived: boolean;
  }>;
  error?: string;
}

export default function TendersListPage() {
  const [tenders, setTenders] = useState<TenderCardData[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchTenders = useCallback(async (archived: boolean) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tenders?is_archived=${archived}&per_page=100`);
      const json: TenderListResponse = await res.json();

      if (json.success && json.data) {
        // Submission/invite counts would require additional API calls;
        // for the list view we display 0 and let the detail page show actuals.
        setTenders(
          json.data.map((t) => ({
            ...t,
            submission_count: 0,
            invite_count: 0,
          })),
        );
      }
    } catch {
      // Silently handle; empty state shown
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchTenders(showArchived);
  }, [showArchived, fetchTenders]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-100">Tenders</h1>
          <p className="mt-1 text-sm text-stone-500">Manage tender configurations</p>
        </div>
        <Link
          href="/admin/tenders/new"
          className="inline-flex items-center gap-2 rounded-md bg-amber-600 px-4 py-2.5 text-sm font-semibold text-stone-900 hover:bg-amber-500 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Tender
        </Link>
      </div>

      {/* Filter toggle */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowArchived(false)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            !showArchived
              ? 'bg-amber-600 text-stone-900'
              : 'bg-stone-800 text-stone-400 hover:text-stone-200'
          }`}
        >
          Active
        </button>
        <button
          type="button"
          onClick={() => setShowArchived(true)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            showArchived
              ? 'bg-amber-600 text-stone-900'
              : 'bg-stone-800 text-stone-400 hover:text-stone-200'
          }`}
        >
          Archived
        </button>
      </div>

      {/* Tender cards */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-stone-600 border-t-amber-500" />
        </div>
      ) : tenders.length === 0 ? (
        <div className="rounded-lg border border-stone-700 bg-stone-800 p-8 text-center text-stone-500">
          {showArchived ? 'No archived tenders.' : 'No active tenders. Create one to get started.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tenders.map((tender) => (
            <TenderCard key={tender.id} tender={tender} />
          ))}
        </div>
      )}
    </div>
  );
}
