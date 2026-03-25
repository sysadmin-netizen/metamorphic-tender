import { NextResponse, type NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { ADMIN_SESSION_COOKIE } from '@/lib/constants';
import type { VendorTier } from '@/lib/types/database';

async function verifyAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.has(ADMIN_SESSION_COOKIE);
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!(await verifyAdmin())) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get('search') ?? '';
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get('per_page') ?? '20', 10)));
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const supabase = createServiceClient();

  let query = supabase
    .from('vendors')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
    .order('company_name', { ascending: true });

  if (search.trim().length > 0) {
    query = query.or(
      `company_name.ilike.%${search}%,contact_name.ilike.%${search}%,email.ilike.%${search}%`
    );
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    data,
    pagination: {
      page,
      per_page: perPage,
      total: count ?? 0,
      total_pages: count ? Math.ceil(count / perPage) : 0,
    },
  });
}

interface CreateVendorBody {
  company_name: string;
  trade_licence_number: string;
  contact_name: string;
  email: string;
  whatsapp: string;
  tier?: VendorTier;
  is_dda_approved?: boolean;
  metaforge_confirmed?: boolean;
}

function isCreateVendorBody(body: unknown): body is CreateVendorBody {
  if (typeof body !== 'object' || body === null) return false;
  const record = body as Record<string, unknown>;
  return (
    typeof record.company_name === 'string' &&
    record.company_name.trim().length > 0 &&
    typeof record.trade_licence_number === 'string' &&
    typeof record.contact_name === 'string' &&
    typeof record.email === 'string' &&
    typeof record.whatsapp === 'string'
  );
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

  if (!isCreateVendorBody(body)) {
    return NextResponse.json(
      { success: false, error: 'Missing required fields: company_name, trade_licence_number, contact_name, email, whatsapp' },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  const validTiers: VendorTier[] = ['trial', 'preferred', 'strategic'];
  const tier: VendorTier = body.tier && validTiers.includes(body.tier) ? body.tier : 'trial';

  const { data, error } = await supabase
    .from('vendors')
    .insert({
      company_name: body.company_name.trim(),
      trade_licence_number: body.trade_licence_number.trim(),
      contact_name: body.contact_name.trim(),
      email: body.email.trim().toLowerCase(),
      whatsapp: body.whatsapp.trim(),
      tier,
      is_dda_approved: body.is_dda_approved ?? false,
      metaforge_confirmed: body.metaforge_confirmed ?? false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data }, { status: 201 });
}
