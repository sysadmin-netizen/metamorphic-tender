'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { VendorTable } from '@/components/admin/vendor-table';
import type { TableRow } from '@/lib/types/database';
import { PAGE_SIZE } from '@/lib/constants';

type VendorRow = TableRow<'vendors'>;

interface VendorsApiResponse {
  success: boolean;
  data?: VendorRow[];
  pagination?: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
  error?: string;
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchVendors = useCallback(async (currentPage: number, query: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: PAGE_SIZE.toString(),
      });
      if (query.trim()) {
        params.set('search', query.trim());
      }

      const res = await fetch(`/api/vendors?${params.toString()}`);
      const json: VendorsApiResponse = await res.json();

      if (json.success && json.data) {
        setVendors(json.data);
        if (json.pagination) {
          setTotalPages(json.pagination.total_pages);
        }
      }
    } catch {
      // Silently handle; empty state shown
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchVendors(page, searchQuery);
  }, [page, searchQuery, fetchVendors]);

  const handleSearch = useCallback((query: string) => {
    setPage(1);
    setSearchQuery(query);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-100">Vendors</h1>
          <p className="mt-1 text-sm text-stone-500">Manage vendor registry</p>
        </div>
        <Link
          href="/admin/vendors/import"
          className="inline-flex items-center gap-2 rounded-md border border-stone-700 bg-stone-800 px-4 py-2.5 text-sm font-medium text-stone-300 hover:bg-stone-700 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          Import CSV
        </Link>
      </div>

      {/* Loading state */}
      {loading && vendors.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-stone-600 border-t-amber-500" />
        </div>
      ) : (
        <VendorTable
          vendors={vendors}
          onSearch={handleSearch}
          page={page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
