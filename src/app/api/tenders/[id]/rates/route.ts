import { NextResponse, type NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { ADMIN_SESSION_COOKIE } from '@/lib/constants';
import { buildRateDatabase, type RateSubmissionInput, type BoqTemplateItem } from '@/lib/rate-engine';
import type { BoqTemplateJson, BoqSubmissionItemJson } from '@/lib/types/database';

async function verifyAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.has(ADMIN_SESSION_COOKIE);
}

type RouteParams = { params: Promise<{ id: string }> };

/**
 * POST /api/tenders/[id]/rates
 * Build rate database from a tender's submissions and upsert into boq_rates table.
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

  // Fetch tender config for package_code and BOQ template
  const { data: tender, error: tenderError } = await supabase
    .from('tender_configs')
    .select('id, package_code, boq_template')
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
    .select('vendor_id, boq_data')
    .eq('tender_config_id', id);

  if (subError) {
    return NextResponse.json(
      { success: false, error: subError.message },
      { status: 500 },
    );
  }

  if (!rawSubmissions || rawSubmissions.length === 0) {
    return NextResponse.json(
      { success: false, error: 'No submissions to analyze' },
      { status: 400 },
    );
  }

  // Map raw data to typed inputs
  const submissions: RateSubmissionInput[] = rawSubmissions.map((s) => ({
    vendor_id: s.vendor_id,
    boq_data: (s.boq_data as BoqSubmissionItemJson[]).map((item) => ({
      code: item.code,
      rate: item.rate,
      total: item.total,
      quantity: item.quantity,
    })),
  }));

  const boqTemplate: BoqTemplateItem[] = (tender.boq_template as BoqTemplateJson).map((item) => ({
    code: item.code,
    description: item.description,
    unit: item.unit,
    quantity: item.quantity,
  }));

  // Build rate database
  const rateEntries = buildRateDatabase(submissions, boqTemplate);

  // Upsert into boq_rates table
  const today = new Date().toISOString().split('T')[0];
  const upsertErrors: string[] = [];

  for (const entry of rateEntries) {
    if (entry.sample_size === 0) continue; // Skip items with no data

    // Delete existing rate for this package + line item + cycle date
    await supabase
      .from('boq_rates')
      .delete()
      .eq('package_code', tender.package_code)
      .eq('line_item_code', entry.line_item_code)
      .eq('tender_cycle_date', today);

    // Insert new rate
    const { error: insertError } = await supabase
      .from('boq_rates')
      .insert({
        package_code: tender.package_code,
        line_item_code: entry.line_item_code,
        line_item_description: entry.line_item_description,
        unit: entry.unit,
        rate_min: entry.rate_min,
        rate_median: entry.rate_median,
        rate_max: entry.rate_max,
        outlier_count: entry.outlier_count,
        sample_size: entry.sample_size,
        tender_cycle_date: today,
      });

    if (insertError) {
      upsertErrors.push(`${entry.line_item_code}: ${insertError.message}`);
    }
  }

  const insertedCount = rateEntries.filter((e) => e.sample_size > 0).length - upsertErrors.length;

  return NextResponse.json({
    success: true,
    data: {
      package_code: tender.package_code,
      entries_processed: rateEntries.length,
      entries_inserted: insertedCount,
      tender_cycle_date: today,
    },
    rates: rateEntries.filter((e) => e.sample_size > 0),
    upsert_errors: upsertErrors.length > 0 ? upsertErrors : undefined,
  });
}
