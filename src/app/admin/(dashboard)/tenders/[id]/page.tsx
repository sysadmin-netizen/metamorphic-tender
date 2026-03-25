import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/server';
import { formatGST } from '@/lib/date';
import { TenderDetailEditor } from './editor';

export default async function TenderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data: tender, error } = await supabase
    .from('tender_configs')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !tender) {
    notFound();
  }

  // Fetch submission + invite counts for context
  const [{ count: submissionCount }, { count: inviteCount }] = await Promise.all([
    supabase
      .from('submissions')
      .select('id', { count: 'exact', head: true })
      .eq('tender_config_id', id),
    supabase
      .from('vendor_tenders')
      .select('id', { count: 'exact', head: true })
      .eq('tender_config_id', id),
  ]);

  // Parse scope_items safely
  const scopeItems: string[] = Array.isArray(tender.scope_items)
    ? (tender.scope_items as string[])
    : [];

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="inline-flex items-center rounded bg-amber-500/10 px-2.5 py-1 text-sm font-mono font-semibold text-amber-400 border border-amber-500/20">
              {tender.package_code}
            </span>
            {tender.is_active && !tender.is_archived && (
              <span className="inline-flex items-center rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/20">
                Active
              </span>
            )}
            {tender.is_archived && (
              <span className="inline-flex items-center rounded bg-stone-600/30 px-2 py-0.5 text-xs font-medium text-stone-400 border border-stone-600/30">
                Archived
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-stone-100">{tender.package_name}</h1>
          <p className="mt-1 text-sm text-stone-500">{tender.project_name}</p>
        </div>
      </div>

      {/* Metadata bar */}
      <div className="flex flex-wrap items-center gap-6 text-sm text-stone-400">
        <div>
          <span className="text-stone-500">Deadline:</span>{' '}
          <span className={new Date(tender.closing_deadline).getTime() < Date.now() ? 'text-red-400' : 'text-stone-300'}>
            {formatGST(tender.closing_deadline)}
          </span>
        </div>
        <div>
          <span className="text-stone-500">Submissions:</span>{' '}
          <span className="text-stone-300">{submissionCount ?? 0}</span>
        </div>
        <div>
          <span className="text-stone-500">Invites:</span>{' '}
          <span className="text-stone-300">{inviteCount ?? 0}</span>
        </div>
        <div>
          <span className="text-stone-500">Last updated:</span>{' '}
          <span className="text-stone-300">{formatGST(tender.updated_at)}</span>
        </div>
      </div>

      {/* Navigation links */}
      <div className="flex items-center gap-3">
        <Link
          href={`/admin/tenders/${id}/submissions`}
          className="inline-flex items-center gap-2 rounded-md border border-stone-700 bg-stone-800 px-4 py-2 text-sm font-medium text-stone-300 hover:bg-stone-700 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
          </svg>
          View Submissions
        </Link>
        <Link
          href={`/admin/tenders/${id}/invite`}
          className="inline-flex items-center gap-2 rounded-md border border-stone-700 bg-stone-800 px-4 py-2 text-sm font-medium text-stone-300 hover:bg-stone-700 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
          Manage Invites
        </Link>
      </div>

      {/* Editable sections (client component) */}
      <TenderDetailEditor
        tenderId={tender.id}
        updatedAt={tender.updated_at}
        initialFormSchema={tender.form_schema}
        initialBoqTemplate={tender.boq_template as { code: string; description: string; unit: string; quantity: number }[]}
        initialCommercialTerms={tender.commercial_terms as Record<string, string>}
        initialLocation={tender.location ?? ''}
        initialJobSequence={tender.job_sequence ?? ''}
        initialDependencies={tender.dependencies ?? ''}
        initialMobilisationRequirement={tender.mobilisation_requirement ?? ''}
        initialScopeItems={scopeItems}
        initialBoqQtyEditable={tender.boq_qty_editable ?? false}
        initialNotesEnabled={tender.notes_enabled ?? true}
      />
    </div>
  );
}
