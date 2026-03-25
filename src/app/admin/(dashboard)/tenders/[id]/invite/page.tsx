import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/server';
import { formatGST } from '@/lib/date';
import { STATUS_COLORS } from '@/lib/constants';
import { InviteActions } from './actions';
import type { VendorTenderStatus } from '@/lib/types/database';

export default async function TenderInvitePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createServiceClient();

  // Fetch tender basic info
  const { data: tender, error: tenderError } = await supabase
    .from('tender_configs')
    .select('id, package_code, package_name')
    .eq('id', id)
    .single();

  if (tenderError || !tender) {
    notFound();
  }

  // Fetch all invites (vendor_tenders) for this tender
  const { data: invites } = await supabase
    .from('vendor_tenders')
    .select('id, vendor_id, token, status, expires_at, invited_at, opened_at, submitted_at, reissue_count')
    .eq('tender_config_id', id)
    .order('invited_at', { ascending: false });

  // Resolve vendor names + emails
  const vendorIds = [...new Set((invites ?? []).map((inv) => inv.vendor_id))];
  let vendorMap = new Map<string, { company_name: string; email: string }>();
  if (vendorIds.length > 0) {
    const { data: vendors } = await supabase
      .from('vendors')
      .select('id, company_name, email')
      .in('id', vendorIds);
    if (vendors) {
      vendorMap = new Map(vendors.map((v) => [v.id, { company_name: v.company_name, email: v.email }]));
    }
  }

  const inviteRows = (invites ?? []).map((inv) => {
    const vendor = vendorMap.get(inv.vendor_id);
    return {
      ...inv,
      vendor_name: vendor?.company_name ?? inv.vendor_id.slice(0, 8),
      vendor_email: vendor?.email ?? '',
      status: inv.status as VendorTenderStatus,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href={`/admin/tenders/${id}`}
              className="text-stone-500 hover:text-stone-300 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </Link>
            <span className="font-mono text-sm text-amber-400">{tender.package_code}</span>
          </div>
          <h1 className="text-2xl font-bold text-stone-100">Invite Management</h1>
          <p className="mt-1 text-sm text-stone-500">
            {tender.package_name} &mdash; {inviteRows.length} invite{inviteRows.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Action buttons (client component) */}
      <InviteActions tenderId={id} />

      {/* Invites table */}
      <div className="overflow-x-auto rounded-lg border border-stone-700">
        <table className="w-full text-sm">
          <thead className="bg-stone-800/80 sticky top-0 z-10">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-stone-400">Vendor</th>
              <th className="text-left px-4 py-3 font-medium text-stone-400">Email</th>
              <th className="text-left px-4 py-3 font-medium text-stone-400">Status</th>
              <th className="text-left px-4 py-3 font-medium text-stone-400">Invited</th>
              <th className="text-left px-4 py-3 font-medium text-stone-400">Expires</th>
              <th className="text-left px-4 py-3 font-medium text-stone-400 w-28">Actions</th>
            </tr>
          </thead>
          <tbody>
            {inviteRows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-stone-500">
                  No invites issued yet. Click &quot;Generate Invites&quot; to begin.
                </td>
              </tr>
            )}
            {inviteRows.map((inv, idx) => {
              const statusStyle = STATUS_COLORS[inv.status];
              // EC-25: Re-issue only for expired or opened (NOT submitted)
              const canReissue = inv.status === 'expired' || inv.status === 'opened';

              return (
                <tr
                  key={inv.id}
                  className={idx % 2 === 0 ? 'bg-stone-900' : 'bg-stone-900/50'}
                >
                  <td className="px-4 py-2.5 text-stone-200 font-medium whitespace-nowrap">
                    {inv.vendor_name}
                  </td>
                  <td className="px-4 py-2.5 text-stone-400 whitespace-nowrap">
                    {inv.vendor_email}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${statusStyle.bg} ${statusStyle.text} border ${statusStyle.border}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-stone-400 whitespace-nowrap">
                    {formatGST(inv.invited_at)}
                  </td>
                  <td className="px-4 py-2.5 text-stone-400 whitespace-nowrap">
                    {formatGST(inv.expires_at)}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    {canReissue && (
                      <InviteReissueButton inviteId={inv.id} tenderId={id} />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   Inline server-rendered placeholder for the re-issue button.
   The actual interactivity is in the client component.
   --------------------------------------------------------------- */

function InviteReissueButton({ inviteId, tenderId }: { inviteId: string; tenderId: string }) {
  return (
    <form action={`/api/invites/${inviteId}/reissue`} method="POST">
      <input type="hidden" name="tender_id" value={tenderId} />
      <button
        type="submit"
        className="rounded-md border border-stone-600 bg-stone-800 px-2.5 py-1 text-xs font-medium text-stone-300 hover:bg-stone-700 hover:text-amber-400 transition-colors"
      >
        Re-issue
      </button>
    </form>
  );
}
