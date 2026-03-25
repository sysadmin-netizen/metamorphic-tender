import { NextResponse, type NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { ADMIN_SESSION_COOKIE } from '@/lib/constants';

async function verifyAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.has(ADMIN_SESSION_COOKIE);
}

interface GenerateInvitesBody {
  tender_config_id: string;
  vendor_ids: string[];
}

function isGenerateInvitesBody(body: unknown): body is GenerateInvitesBody {
  if (typeof body !== 'object' || body === null) return false;
  const record = body as Record<string, unknown>;
  return (
    typeof record.tender_config_id === 'string' &&
    Array.isArray(record.vendor_ids) &&
    record.vendor_ids.every((id: unknown) => typeof id === 'string')
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

  if (!isGenerateInvitesBody(body)) {
    return NextResponse.json(
      { success: false, error: 'Missing required fields: tender_config_id, vendor_ids' },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  const { data, error } = await supabase.rpc('generate_vendor_invites', {
    p_tender_config_id: body.tender_config_id,
    p_vendor_ids: body.vendor_ids,
  });

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  const count = data ?? 0;

  return NextResponse.json({
    success: true,
    count,
  });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!(await verifyAdmin())) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const tenderConfigId = searchParams.get('tender_config_id');

  if (!tenderConfigId) {
    return NextResponse.json(
      { success: false, error: 'Missing required query parameter: tender_config_id' },
      { status: 400 }
    );
  }

  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get('per_page') ?? '50', 10)));
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const supabase = createServiceClient();

  const { data, error, count } = await supabase
    .from('vendor_tenders')
    .select(
      `
      id,
      vendor_id,
      tender_config_id,
      token,
      status,
      expires_at,
      invited_at,
      opened_at,
      submitted_at,
      reissue_count,
      vendors (
        id,
        company_name,
        contact_name,
        email,
        whatsapp,
        tier
      )
    `,
      { count: 'exact' }
    )
    .eq('tender_config_id', tenderConfigId)
    .order('invited_at', { ascending: false })
    .range(from, to);

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
