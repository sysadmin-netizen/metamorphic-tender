import { NextResponse, type NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { ADMIN_SESSION_COOKIE, TOKEN_EXPIRY_HOURS } from '@/lib/constants';
import crypto from 'crypto';

async function verifyAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.has(ADMIN_SESSION_COOKIE);
}

interface QuickInviteBody {
  tender_config_id: string;
  company_name?: string;
  contact_name?: string;
  email?: string;
  whatsapp?: string;
}

function isQuickInviteBody(body: unknown): body is QuickInviteBody {
  if (typeof body !== 'object' || body === null) return false;
  const record = body as Record<string, unknown>;
  return typeof record.tender_config_id === 'string' && record.tender_config_id.length > 0;
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

  if (!isQuickInviteBody(body)) {
    return NextResponse.json(
      { success: false, error: 'Missing required field: tender_config_id' },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  // Verify tender exists
  const { data: tender, error: tenderError } = await supabase
    .from('tender_configs')
    .select('id')
    .eq('id', body.tender_config_id)
    .single();

  if (tenderError || !tender) {
    return NextResponse.json(
      { success: false, error: 'Tender not found' },
      { status: 404 }
    );
  }

  // Create a vendor record on the fly
  const companyName = body.company_name?.trim() || `Quick Invite ${new Date().toISOString().slice(0, 19).replace('T', ' ')}`;
  const contactName = body.contact_name?.trim() || '';
  const email = body.email?.trim() || '';
  const whatsapp = body.whatsapp?.trim() || '';

  const { data: vendor, error: vendorError } = await supabase
    .from('vendors')
    .insert({
      company_name: companyName,
      contact_name: contactName,
      email: email,
      whatsapp: whatsapp,
      trade_licence_number: '',
      tier: 'trial',
      quality_score: 0,
      is_dda_approved: false,
      metaforge_confirmed: false,
      is_active: true,
    })
    .select('id')
    .single();

  if (vendorError || !vendor) {
    return NextResponse.json(
      { success: false, error: vendorError?.message ?? 'Failed to create vendor' },
      { status: 500 }
    );
  }

  // Generate a token and create vendor_tender record with 24h expiry
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000).toISOString();

  const { error: vtError } = await supabase
    .from('vendor_tenders')
    .insert({
      vendor_id: vendor.id,
      tender_config_id: body.tender_config_id,
      token: token,
      status: 'invited',
      expires_at: expiresAt,
    });

  if (vtError) {
    return NextResponse.json(
      { success: false, error: vtError.message },
      { status: 500 }
    );
  }

  // Build the link
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  const link = `${appUrl}/t/${token}`;

  return NextResponse.json({
    success: true,
    token,
    link,
    vendor_id: vendor.id,
  });
}
