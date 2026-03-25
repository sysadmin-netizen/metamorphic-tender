import { NextResponse, type NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { ADMIN_SESSION_COOKIE } from '@/lib/constants';
import { calculateScores, type ScoringSubmission, type ScoringVendor } from '@/lib/scoring';

async function verifyAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.has(ADMIN_SESSION_COOKIE);
}

type RouteParams = { params: Promise<{ id: string }> };

/**
 * POST /api/tenders/[id]/score
 * Run AI scoring on all submissions for a tender.
 * Updates each submission record with computed scores.
 * Returns the ranked list of scored submissions.
 */
export async function POST(
  _request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  if (!(await verifyAdmin())) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 },
    );
  }

  const { id } = await params;
  const supabase = createServiceClient();

  // Verify tender exists
  const { data: tender, error: tenderError } = await supabase
    .from('tender_configs')
    .select('id, package_code')
    .eq('id', id)
    .single();

  if (tenderError || !tender) {
    return NextResponse.json(
      { success: false, error: 'Tender not found' },
      { status: 404 },
    );
  }

  // Fetch all submissions for this tender
  const { data: rawSubmissions, error: subError } = await supabase
    .from('submissions')
    .select('id, vendor_tender_id, vendor_id, total_quote_aed, metaforge_confirmed, insurance_confirmed, boq_data')
    .eq('tender_config_id', id);

  if (subError) {
    return NextResponse.json(
      { success: false, error: subError.message },
      { status: 500 },
    );
  }

  if (!rawSubmissions || rawSubmissions.length === 0) {
    return NextResponse.json(
      { success: false, error: 'No submissions to score' },
      { status: 400 },
    );
  }

  // Type-safe mapping of submission data
  const submissions: ScoringSubmission[] = rawSubmissions.map((s) => ({
    id: s.id,
    vendor_tender_id: s.vendor_tender_id,
    vendor_id: s.vendor_id,
    total_quote_aed: s.total_quote_aed,
    metaforge_confirmed: s.metaforge_confirmed,
    insurance_confirmed: s.insurance_confirmed,
    boq_data: s.boq_data as ScoringSubmission['boq_data'],
  }));

  // Fetch vendor details
  const vendorIds = [...new Set(submissions.map((s) => s.vendor_id))];
  const { data: rawVendors, error: vendorError } = await supabase
    .from('vendors')
    .select('id, company_name, tier, quality_score, is_dda_approved, metaforge_confirmed')
    .in('id', vendorIds);

  if (vendorError) {
    return NextResponse.json(
      { success: false, error: vendorError.message },
      { status: 500 },
    );
  }

  const vendors: ScoringVendor[] = (rawVendors ?? []).map((v) => ({
    id: v.id,
    company_name: v.company_name,
    tier: v.tier,
    quality_score: v.quality_score,
    is_dda_approved: v.is_dda_approved,
    metaforge_confirmed: v.metaforge_confirmed,
  }));

  // Run scoring
  const scoredResults = calculateScores(submissions, vendors);

  // Update each submission with computed scores
  const updateErrors: string[] = [];
  for (const result of scoredResults) {
    const submissionId = submissions.find(
      (s) => s.vendor_tender_id === result.vendor_tender_id,
    )?.id;

    if (!submissionId) continue;

    const { error: updateError } = await supabase
      .from('submissions')
      .update({
        price_score: result.price_score,
        quality_score: result.quality_score,
        tier_score: result.tier_score,
        composite_score: result.composite_score,
      })
      .eq('id', submissionId);

    if (updateError) {
      updateErrors.push(`Failed to update ${submissionId}: ${updateError.message}`);
    }
  }

  return NextResponse.json({
    success: true,
    data: scoredResults,
    update_errors: updateErrors.length > 0 ? updateErrors : undefined,
  });
}
