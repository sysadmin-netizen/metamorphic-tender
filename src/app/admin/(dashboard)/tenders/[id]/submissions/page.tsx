import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/server';

import { SubmissionComparison } from '@/components/admin/submission-comparison';
import type { BoqTemplateJson, BoqSubmissionItemJson } from '@/lib/types/database';

export default async function TenderSubmissionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createServiceClient();

  // Fetch tender config for the BOQ template
  const { data: tender, error: tenderError } = await supabase
    .from('tender_configs')
    .select('id, package_code, package_name, boq_template')
    .eq('id', id)
    .single();

  if (tenderError || !tender) {
    notFound();
  }

  // Fetch all submissions for this tender (including score fields)
  const { data: submissions } = await supabase
    .from('submissions')
    .select('id, vendor_id, boq_data, total_quote_aed, material_option, submitted_at, metaforge_confirmed, insurance_confirmed, price_score, quality_score, tier_score, composite_score')
    .eq('tender_config_id', id)
    .order('total_quote_aed', { ascending: true });

  // Resolve vendor names
  const vendorIds = [...new Set((submissions ?? []).map((s) => s.vendor_id))];
  let vendorNameMap = new Map<string, string>();
  if (vendorIds.length > 0) {
    const { data: vendors } = await supabase
      .from('vendors')
      .select('id, company_name')
      .in('id', vendorIds);
    if (vendors) {
      vendorNameMap = new Map(vendors.map((v) => [v.id, v.company_name]));
    }
  }

  // Compute compliance flags and shape data for the comparison component
  const allTotals = (submissions ?? []).map((s) => s.total_quote_aed);
  const sortedTotals = [...allTotals].sort((a, b) => a - b);
  const medianTotal = sortedTotals.length > 0
    ? sortedTotals.length % 2 === 0
      ? (sortedTotals[sortedTotals.length / 2 - 1] + sortedTotals[sortedTotals.length / 2]) / 2
      : sortedTotals[Math.floor(sortedTotals.length / 2)]
    : 0;

  const comparisonEntries = (submissions ?? []).map((sub) => {
    const flags: string[] = [];

    // MetaForge check
    if (!sub.metaforge_confirmed) {
      flags.push('MetaForge Not Confirmed');
    }

    // Insurance check
    if (!sub.insurance_confirmed) {
      flags.push('Insurance Not Confirmed');
    }

    // Zero-rate BOQ items
    const boqItems = sub.boq_data as BoqSubmissionItemJson[];
    const zeroRateCodes: string[] = [];
    for (const item of boqItems) {
      if (item.rate === 0) {
        zeroRateCodes.push(item.code);
      }
    }
    if (zeroRateCodes.length > 0) {
      flags.push(`Zero Rates: ${zeroRateCodes.join(', ')}`);
    }

    // Above market rate (>30% above median)
    if (medianTotal > 0 && sub.total_quote_aed > medianTotal * 1.3) {
      flags.push('Above Market Rate');
    }

    return {
      id: sub.id,
      vendor_id: sub.vendor_id,
      vendor_name: vendorNameMap.get(sub.vendor_id) ?? sub.vendor_id.slice(0, 8),
      boq_data: boqItems,
      total_quote_aed: sub.total_quote_aed,
      material_option: sub.material_option,
      compliance_flags: flags,
      scores: {
        price_score: sub.price_score,
        quality_score: sub.quality_score,
        tier_score: sub.tier_score,
        composite_score: sub.composite_score,
      },
    };
  });

  const boqTemplate = tender.boq_template as BoqTemplateJson;

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
          <h1 className="text-2xl font-bold text-stone-100">Submissions</h1>
          <p className="mt-1 text-sm text-stone-500">
            {tender.package_name} &mdash; {comparisonEntries.length} submission{comparisonEntries.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Comparison table */}
      <SubmissionComparison
        submissions={comparisonEntries}
        boq_template={boqTemplate}
        tenderId={id}
      />
    </div>
  );
}
