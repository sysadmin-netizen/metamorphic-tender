import { NextResponse, type NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { ADMIN_SESSION_COOKIE } from '@/lib/constants';

async function verifyAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.has(ADMIN_SESSION_COOKIE);
}

interface VendorTenderWithVendor {
  token: string;
  vendors: {
    company_name: string;
    contact_name: string;
    email: string;
    whatsapp: string;
  };
}

function escapeCsvField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
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
      { success: false, error: 'Missing required query parameter: tender_config_id (EC-26)' },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('vendor_tenders')
    .select(
      `
      token,
      vendors (
        company_name,
        contact_name,
        email,
        whatsapp
      )
    `
    )
    .eq('tender_config_id', tenderConfigId);

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  const rows = data as unknown as VendorTenderWithVendor[];

  // Determine the base URL for tender links
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://tender.metamorphic.ae';

  // Build CSV
  const csvHeader = 'company_name,contact_name,email,whatsapp,tender_link';
  const csvRows = rows.map((row) => {
    const vendor = row.vendors;
    const tenderLink = `${baseUrl}/tender/${row.token}`;
    return [
      escapeCsvField(vendor.company_name),
      escapeCsvField(vendor.contact_name),
      escapeCsvField(vendor.email),
      escapeCsvField(vendor.whatsapp),
      escapeCsvField(tenderLink),
    ].join(',');
  });

  const csvContent = [csvHeader, ...csvRows].join('\n');

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="invites-${tenderConfigId}.csv"`,
    },
  });
}
