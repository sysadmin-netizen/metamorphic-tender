'use client';

import { useState, useCallback } from 'react';
import type { TableRow } from '@/lib/types/database';
import { TIER_COLORS } from '@/lib/constants';

/* ---------------------------------------------------------------
   Types
   --------------------------------------------------------------- */

type VendorRow = TableRow<'vendors'>;

interface VendorTableProps {
  vendors: VendorRow[];
  onSearch: (query: string) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/* ---------------------------------------------------------------
   Component
   --------------------------------------------------------------- */

export function VendorTable({ vendors, onSearch, page, totalPages, onPageChange }: VendorTableProps) {
  const [searchValue, setSearchValue] = useState('');

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchValue(value);
      onSearch(value);
    },
    [onSearch],
  );

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          value={searchValue}
          onChange={handleSearchChange}
          placeholder="Search vendors by company, contact, or email..."
          className="w-full rounded-md border border-stone-700 bg-stone-800 py-2.5 pl-10 pr-4 text-sm text-stone-200 placeholder:text-stone-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-stone-700">
        <table className="w-full text-sm">
          <thead className="bg-stone-800/80 sticky top-0 z-10">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-stone-400">Company</th>
              <th className="text-left px-4 py-3 font-medium text-stone-400">Contact</th>
              <th className="text-left px-4 py-3 font-medium text-stone-400">Email</th>
              <th className="text-left px-4 py-3 font-medium text-stone-400">Tier</th>
              <th className="text-right px-4 py-3 font-medium text-stone-400">Quality Score</th>
              <th className="text-left px-4 py-3 font-medium text-stone-400">Status</th>
            </tr>
          </thead>
          <tbody>
            {vendors.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-stone-500">
                  No vendors found.
                </td>
              </tr>
            )}
            {vendors.map((vendor, idx) => {
              const tierStyle = TIER_COLORS[vendor.tier] ?? { bg: 'bg-stone-50', text: 'text-stone-700' };
              return (
                <tr
                  key={vendor.id}
                  className={idx % 2 === 0 ? 'bg-stone-900' : 'bg-stone-900/50'}
                >
                  <td className="px-4 py-2.5 text-stone-200 font-medium whitespace-nowrap">
                    {vendor.company_name}
                  </td>
                  <td className="px-4 py-2.5 text-stone-300 whitespace-nowrap">
                    {vendor.contact_name}
                  </td>
                  <td className="px-4 py-2.5 text-stone-400 whitespace-nowrap">
                    {vendor.email}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${tierStyle.bg} ${tierStyle.text}`}>
                      {vendor.tier}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-stone-300 text-right tabular-nums">
                    {vendor.quality_score}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
                        vendor.is_active
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}
                    >
                      {vendor.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-stone-500">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="rounded-md border border-stone-700 bg-stone-800 px-3 py-1.5 text-xs font-medium text-stone-300 hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="rounded-md border border-stone-700 bg-stone-800 px-3 py-1.5 text-xs font-medium text-stone-300 hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
