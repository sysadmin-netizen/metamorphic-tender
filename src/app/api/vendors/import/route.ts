import { NextResponse, type NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { ADMIN_SESSION_COOKIE } from '@/lib/constants';
import type { VendorTier } from '@/lib/types/database';

async function verifyAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.has(ADMIN_SESSION_COOKIE);
}

interface CsvVendorRow {
  company_name: string;
  trade_licence_number: string;
  contact_name: string;
  email: string;
  whatsapp: string;
  tier?: string;
  is_dda_approved?: string;
  metaforge_confirmed?: string;
}

interface SkippedVendor {
  company_name: string;
  reason: string;
}

function parseCsv(csvText: string): CsvVendorRow[] {
  const lines = csvText.split('\n').map((line) => line.trim()).filter((line) => line.length > 0);
  if (lines.length < 2) return [];

  const headerLine = lines[0];
  const headers = headerLine.split(',').map((h) => h.trim().toLowerCase().replace(/['"]/g, ''));

  const rows: CsvVendorRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''));
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] ?? '';
    }

    if (row.company_name && row.email) {
      rows.push({
        company_name: row.company_name,
        trade_licence_number: row.trade_licence_number ?? '',
        contact_name: row.contact_name ?? '',
        email: row.email,
        whatsapp: row.whatsapp ?? '',
        tier: row.tier,
        is_dda_approved: row.is_dda_approved,
        metaforge_confirmed: row.metaforge_confirmed,
      });
    }
  }

  return rows;
}

interface ImportRequestBody {
  csv: string;
}

function isImportRequestBody(body: unknown): body is ImportRequestBody {
  if (typeof body !== 'object' || body === null) return false;
  const record = body as Record<string, unknown>;
  return typeof record.csv === 'string';
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!(await verifyAdmin())) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  if (!isImportRequestBody(body)) {
    return NextResponse.json(
      { success: false, error: 'Missing required field: csv' },
      { status: 400 }
    );
  }

  const rows = parseCsv(body.csv);
  if (rows.length === 0) {
    return NextResponse.json(
      { success: false, error: 'No valid rows found in CSV (EC-13)' },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  // Fetch existing vendors for deduplication on (company_name, email)
  const { data: existingVendors, error: fetchError } = await supabase
    .from('vendors')
    .select('company_name, email');

  if (fetchError) {
    return NextResponse.json(
      { success: false, error: fetchError.message },
      { status: 500 }
    );
  }

  const existingSet = new Set(
    (existingVendors ?? []).map(
      (v) => `${v.company_name.toLowerCase()}|${v.email.toLowerCase()}`
    )
  );

  const validTiers: VendorTier[] = ['trial', 'preferred', 'strategic'];
  const toInsert: {
    company_name: string;
    trade_licence_number: string;
    contact_name: string;
    email: string;
    whatsapp: string;
    tier: VendorTier;
    is_dda_approved: boolean;
    metaforge_confirmed: boolean;
  }[] = [];
  const skipped: SkippedVendor[] = [];

  for (const row of rows) {
    const dedupeKey = `${row.company_name.toLowerCase()}|${row.email.toLowerCase()}`;

    if (existingSet.has(dedupeKey)) {
      skipped.push({
        company_name: row.company_name,
        reason: 'Duplicate: vendor with same company name and email already exists',
      });
      continue;
    }

    // Mark as existing to handle intra-batch duplicates
    existingSet.add(dedupeKey);

    const tier: VendorTier =
      row.tier && validTiers.includes(row.tier as VendorTier)
        ? (row.tier as VendorTier)
        : 'trial';

    toInsert.push({
      company_name: row.company_name.trim(),
      trade_licence_number: row.trade_licence_number.trim(),
      contact_name: row.contact_name.trim(),
      email: row.email.trim().toLowerCase(),
      whatsapp: row.whatsapp.trim(),
      tier,
      is_dda_approved: row.is_dda_approved === 'true',
      metaforge_confirmed: row.metaforge_confirmed === 'true',
    });
  }

  let inserted = 0;
  if (toInsert.length > 0) {
    const { error: insertError, count } = await supabase
      .from('vendors')
      .insert(toInsert, { count: 'exact' });

    if (insertError) {
      return NextResponse.json(
        { success: false, error: `Import failed: ${insertError.message}`, code: 'EC-13' },
        { status: 500 }
      );
    }

    inserted = count ?? toInsert.length;
  }

  return NextResponse.json({
    success: true,
    inserted,
    skipped,
  });
}
