import { createServiceClient } from '@/lib/supabase/server';
import { formatGST } from '@/lib/date';
import { StatsBar } from '@/components/admin/stats-bar';
import { TenderCard } from '@/components/admin/tender-card';
import type { StatItem, TenderCardData } from '@/types';

export default async function AdminDashboardPage() {
  const supabase = createServiceClient();

  // Fetch aggregate stats in parallel
  const [
    { count: totalTenders },
    { count: totalVendors },
    { count: totalSubmissions },
    { count: activeTenders },
  ] = await Promise.all([
    supabase.from('tender_configs').select('id', { count: 'exact', head: true }),
    supabase.from('vendors').select('id', { count: 'exact', head: true }),
    supabase.from('submissions').select('id', { count: 'exact', head: true }),
    supabase
      .from('tender_configs')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)
      .eq('is_archived', false),
  ]);

  const stats: StatItem[] = [
    { label: 'Total Tenders', value: totalTenders ?? 0 },
    { label: 'Total Vendors', value: totalVendors ?? 0 },
    { label: 'Total Submissions', value: totalSubmissions ?? 0 },
    { label: 'Active Tenders', value: activeTenders ?? 0, color: '#f59e0b' /* amber-500 */ },
  ];

  // Fetch active tenders with submission & invite counts
  const { data: activeTenderRows } = await supabase
    .from('tender_configs')
    .select('id, package_code, package_name, project_name, closing_deadline, is_active, is_archived')
    .eq('is_active', true)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })
    .limit(12);

  const tenderCards: TenderCardData[] = [];

  if (activeTenderRows) {
    const ids = activeTenderRows.map((t) => t.id);

    const [{ data: subCounts }, { data: inviteCounts }] = await Promise.all([
      supabase
        .from('submissions')
        .select('tender_config_id')
        .in('tender_config_id', ids),
      supabase
        .from('vendor_tenders')
        .select('tender_config_id')
        .in('tender_config_id', ids),
    ]);

    const submissionCountMap = new Map<string, number>();
    if (subCounts) {
      for (const row of subCounts) {
        submissionCountMap.set(
          row.tender_config_id,
          (submissionCountMap.get(row.tender_config_id) ?? 0) + 1,
        );
      }
    }

    const inviteCountMap = new Map<string, number>();
    if (inviteCounts) {
      for (const row of inviteCounts) {
        inviteCountMap.set(
          row.tender_config_id,
          (inviteCountMap.get(row.tender_config_id) ?? 0) + 1,
        );
      }
    }

    for (const tender of activeTenderRows) {
      tenderCards.push({
        ...tender,
        submission_count: submissionCountMap.get(tender.id) ?? 0,
        invite_count: inviteCountMap.get(tender.id) ?? 0,
      });
    }
  }

  // Fetch recent submissions (last 10)
  const { data: recentSubmissions } = await supabase
    .from('submissions')
    .select('id, vendor_id, tender_config_id, total_quote_aed, submitted_at')
    .order('submitted_at', { ascending: false })
    .limit(10);

  // Get vendor + tender names for recent submissions
  let vendorNameMap = new Map<string, string>();
  let tenderNameMap = new Map<string, string>();

  if (recentSubmissions && recentSubmissions.length > 0) {
    const vendorIds = [...new Set(recentSubmissions.map((s) => s.vendor_id))];
    const tenderIds = [...new Set(recentSubmissions.map((s) => s.tender_config_id))];

    const [{ data: vendors }, { data: tenders }] = await Promise.all([
      supabase.from('vendors').select('id, company_name').in('id', vendorIds),
      supabase.from('tender_configs').select('id, package_code').in('id', tenderIds),
    ]);

    if (vendors) {
      vendorNameMap = new Map(vendors.map((v) => [v.id, v.company_name]));
    }
    if (tenders) {
      tenderNameMap = new Map(tenders.map((t) => [t.id, t.package_code]));
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-stone-100">Dashboard</h1>
        <p className="mt-1 text-sm text-stone-500">Metamorphic Tender Portal administration</p>
      </div>

      {/* Stats */}
      <StatsBar stats={stats} />

      {/* Active Tender Cards */}
      <section>
        <h2 className="text-lg font-semibold text-stone-200 mb-4">Active Tenders</h2>
        {tenderCards.length === 0 ? (
          <p className="text-sm text-stone-500">No active tenders.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {tenderCards.map((tender) => (
              <TenderCard key={tender.id} tender={tender} />
            ))}
          </div>
        )}
      </section>

      {/* Recent Submissions */}
      <section>
        <h2 className="text-lg font-semibold text-stone-200 mb-4">Recent Submissions</h2>
        {!recentSubmissions || recentSubmissions.length === 0 ? (
          <p className="text-sm text-stone-500">No submissions yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-stone-700">
            <table className="w-full text-sm">
              <thead className="bg-stone-800/80 sticky top-0 z-10">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-stone-400">Vendor</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-400">Package</th>
                  <th className="text-right px-4 py-3 font-medium text-stone-400">Total (AED)</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-400">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {recentSubmissions.map((sub, idx) => (
                  <tr
                    key={sub.id}
                    className={idx % 2 === 0 ? 'bg-stone-900' : 'bg-stone-900/50'}
                  >
                    <td className="px-4 py-2.5 text-stone-200 font-medium whitespace-nowrap">
                      {vendorNameMap.get(sub.vendor_id) ?? sub.vendor_id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span className="font-mono text-xs text-amber-400">
                        {tenderNameMap.get(sub.tender_config_id) ?? sub.tender_config_id.slice(0, 8)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-stone-300 text-right tabular-nums">
                      {sub.total_quote_aed.toLocaleString('en-AE', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-2.5 text-stone-400 whitespace-nowrap">
                      {formatGST(sub.submitted_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
