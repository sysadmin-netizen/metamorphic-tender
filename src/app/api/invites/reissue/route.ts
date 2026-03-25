import { NextResponse, type NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { ADMIN_SESSION_COOKIE } from '@/lib/constants';

async function verifyAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.has(ADMIN_SESSION_COOKIE);
}

interface ReissueBody {
  vendor_tender_id: string;
}

function isReissueBody(body: unknown): body is ReissueBody {
  if (typeof body !== 'object' || body === null) return false;
  const record = body as Record<string, unknown>;
  return typeof record.vendor_tender_id === 'string';
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

  if (!isReissueBody(body)) {
    return NextResponse.json(
      { success: false, error: 'Missing required field: vendor_tender_id (EC-25)' },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  // Look up vendor_id and tender_config_id from the vendor_tender record
  const { data: vt, error: vtError } = await supabase
    .from('vendor_tenders')
    .select('vendor_id, tender_config_id, status')
    .eq('id', body.vendor_tender_id)
    .single();

  if (vtError || !vt) {
    return NextResponse.json(
      { success: false, error: 'Invite not found' },
      { status: 404 }
    );
  }

  if (vt.status === 'submitted') {
    return NextResponse.json(
      { success: false, error: 'Cannot re-issue: vendor has already submitted' },
      { status: 409 }
    );
  }

  const { data, error } = await supabase.rpc('reissue_vendor_invite', {
    p_vendor_id: vt.vendor_id,
    p_tender_id: vt.tender_config_id,
  });

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  const newToken = typeof data === 'string' ? data : String(data);

  return NextResponse.json({
    success: true,
    token: newToken,
  });
}
