'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { TenderCard } from '@/components/admin/tender-card';
import { toast } from '@/components/ui/toast';
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
    archived_at?: string | null;
  }>;
  error?: string;
}

// ---------------------------------------------------------------------------
// Delete confirmation modal
// ---------------------------------------------------------------------------

type ModalAction = 'delete-active' | 'delete-archived' | 'restore';

interface ConfirmModalProps {
  tender: TenderCardData | null;
  action: ModalAction;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

const MODAL_CONFIG: Record<ModalAction, {
  title: string;
  description: string;
  confirmLabel: string;
  loadingLabel: string;
  confirmClass: string;
  spinnerClass: string;
}> = {
  'delete-active': {
    title: 'Delete Tender?',
    description: 'This tender will be moved to the Archive for 30 days. Tenders with submissions will be archived instead of deleted.',
    confirmLabel: 'Move to Archive',
    loadingLabel: 'Archiving...',
    confirmClass: 'bg-red-900/50 text-red-300 border-red-700/50 hover:bg-red-800/60 hover:text-red-200',
    spinnerClass: 'border-red-400/30 border-t-red-400',
  },
  'delete-archived': {
    title: 'Permanently Delete?',
    description: 'This tender will be permanently deleted. This action cannot be undone. All associated invites will also be removed.',
    confirmLabel: 'Delete Permanently',
    loadingLabel: 'Deleting...',
    confirmClass: 'bg-red-900/50 text-red-300 border-red-700/50 hover:bg-red-800/60 hover:text-red-200',
    spinnerClass: 'border-red-400/30 border-t-red-400',
  },
  restore: {
    title: 'Restore Tender?',
    description: 'This tender will be moved back to Active. The 30-day auto-delete countdown will be cancelled.',
    confirmLabel: 'Restore to Active',
    loadingLabel: 'Restoring...',
    confirmClass: 'bg-emerald-900/50 text-emerald-300 border-emerald-700/50 hover:bg-emerald-800/60 hover:text-emerald-200',
    spinnerClass: 'border-emerald-400/30 border-t-emerald-400',
  },
};

function ConfirmModal({ tender, action, onClose, onConfirm, isLoading }: ConfirmModalProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const config = MODAL_CONFIG[action];

  useEffect(() => {
    if (tender) cancelRef.current?.focus();
  }, [tender]);

  useEffect(() => {
    if (!tender) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [tender, onClose]);

  if (!tender) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-md rounded-lg border border-[#c9a84c]/40 bg-stone-900 p-6 shadow-xl animate-[fadeInScale_150ms_ease-out]">
        <h2 className="text-lg font-semibold text-stone-200">{config.title}</h2>
        <p className="mt-2 text-sm font-medium text-stone-300">{tender.package_name}</p>
        <p className="mt-3 text-sm text-stone-400">{config.description}</p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-md px-4 py-2 text-sm font-medium text-stone-400 hover:text-stone-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold border transition-colors disabled:opacity-50 ${config.confirmClass}`}
          >
            {isLoading ? (
              <>
                <span className={`h-3.5 w-3.5 animate-spin rounded-full border-2 ${config.spinnerClass}`} />
                {config.loadingLabel}
              </>
            ) : (
              config.confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function TendersListPage() {
  const [tenders, setTenders] = useState<TenderCardData[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalTarget, setModalTarget] = useState<TenderCardData | null>(null);
  const [modalAction, setModalAction] = useState<ModalAction>('delete-active');
  const [isModalLoading, setIsModalLoading] = useState(false);

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

  // ---- Open modal helpers ----

  const openModal = useCallback((e: React.MouseEvent, tender: TenderCardData, action: ModalAction) => {
    e.preventDefault();
    e.stopPropagation();
    setModalTarget(tender);
    setModalAction(action);
  }, []);

  const handleDeleteClick = useCallback((e: React.MouseEvent, tender: TenderCardData) => {
    openModal(e, tender, showArchived ? 'delete-archived' : 'delete-active');
  }, [openModal, showArchived]);

  const handleRestoreClick = useCallback((e: React.MouseEvent, tender: TenderCardData) => {
    openModal(e, tender, 'restore');
  }, [openModal]);

  const handleModalClose = useCallback(() => {
    if (!isModalLoading) setModalTarget(null);
  }, [isModalLoading]);

  // ---- Confirm handler (handles all actions) ----

  const handleModalConfirm = useCallback(async () => {
    if (!modalTarget) return;
    setIsModalLoading(true);

    try {
      if (modalAction === 'restore') {
        const res = await fetch(`/api/tenders/${modalTarget.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ updated_at: new Date().toISOString(), is_archived: false, is_active: true }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => null) as { error?: string } | null;
          toast.error(body?.error ?? 'Failed to restore tender');
          setIsModalLoading(false);
          return;
        }
        toast.success(`"${modalTarget.package_name}" restored to Active`);
      } else {
        const res = await fetch(`/api/tenders/${modalTarget.id}`, { method: 'DELETE' });
        const body = await res.json().catch(() => null) as {
          success?: boolean; error?: string; archived?: boolean; message?: string;
        } | null;
        if (!res.ok) {
          toast.error(body?.error ?? 'Failed to delete tender');
          setIsModalLoading(false);
          return;
        }
        if (body?.archived) {
          toast.warning(body.message ?? 'Tender archived (has submissions)');
        } else {
          toast.success('Tender deleted permanently');
        }
      }

      setModalTarget(null);
      setTenders((prev) => prev.filter((t) => t.id !== modalTarget.id));
    } catch {
      toast.error('Network error');
    } finally {
      setIsModalLoading(false);
    }
  }, [modalTarget, modalAction]);

  return (
    <>
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

        {/* Auto-delete notice for archived view */}
        {showArchived && !loading && tenders.length > 0 && (
          <div className="flex items-center gap-3 rounded-lg border border-stone-700 bg-stone-800/60 px-4 py-3">
            <svg className="h-5 w-5 shrink-0 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <p className="text-sm text-stone-400">
              Archived tenders are automatically deleted after <span className="font-semibold text-stone-300">30 days</span>. To keep a tender, move it back to Active before then.
            </p>
          </div>
        )}

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
              <div key={tender.id} className="group/card relative">
                <TenderCard tender={tender} />

                {/* Action buttons -- always visible */}
                <div className="absolute right-2 top-2 z-10 flex items-center gap-1.5">
                  {/* Restore button (archived view only) */}
                  {showArchived && (
                    <button
                      type="button"
                      onClick={(e) => handleRestoreClick(e, tender)}
                      className="flex h-7 items-center gap-1 rounded-md bg-stone-800/90 px-2 text-xs font-medium text-stone-400 backdrop-blur-sm transition-all hover:bg-emerald-900/50 hover:text-emerald-400 border border-stone-700/50 hover:border-emerald-700/50"
                      aria-label={`Restore tender ${tender.package_name}`}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                      </svg>
                      Restore
                    </button>
                  )}

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={(e) => handleDeleteClick(e, tender)}
                    className="flex h-7 w-7 items-center justify-center rounded-md bg-stone-800/90 text-stone-500 backdrop-blur-sm transition-all hover:bg-red-900/60 hover:text-red-400 border border-stone-700/50 hover:border-red-700/50"
                    aria-label={`Delete tender ${tender.package_name}`}
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation modal (delete / restore) */}
      <ConfirmModal
        tender={modalTarget}
        action={modalAction}
        onClose={handleModalClose}
        onConfirm={handleModalConfirm}
        isLoading={isModalLoading}
      />
    </>
  );
}
