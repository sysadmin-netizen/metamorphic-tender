import { NextResponse, type NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { ADMIN_SESSION_COOKIE } from '@/lib/constants';
import type { TableInsert } from '@/lib/types/database';

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
  const isArchived = searchParams.get('is_archived') === 'true';
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get('per_page') ?? '20', 10)));
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const supabase = createServiceClient();

  const { data, error, count } = await supabase
    .from('tender_configs')
    .select('*', { count: 'exact' })
    .eq('is_archived', isArchived)
    .order('created_at', { ascending: false })
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

interface CreateTenderBody {
  package_code: string;
  package_name: string;
  project_name: string;
  form_schema: TableInsert<'tender_configs'>['form_schema'];
  boq_template: TableInsert<'tender_configs'>['boq_template'];
  closing_deadline: string;
  commercial_terms?: TableInsert<'tender_configs'>['commercial_terms'];
  location?: string | null;
  job_sequence?: string | null;
  dependencies?: string | null;
  mobilisation_requirement?: string | null;
  scope_items?: string[] | null;
  boq_qty_editable?: boolean;
  notes_enabled?: boolean;
}

function isCreateTenderBody(body: unknown): body is CreateTenderBody {
  if (typeof body !== 'object' || body === null) return false;
  const record = body as Record<string, unknown>;
  return (
    typeof record.package_code === 'string' &&
    record.package_code.trim().length > 0 &&
    typeof record.package_name === 'string' &&
    record.package_name.trim().length > 0 &&
    typeof record.project_name === 'string' &&
    typeof record.closing_deadline === 'string' &&
    typeof record.form_schema === 'object' &&
    record.form_schema !== null &&
    Array.isArray(record.boq_template)
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

  if (!isCreateTenderBody(body)) {
    return NextResponse.json(
      { success: false, error: 'Missing required fields: package_code, package_name, project_name, form_schema, boq_template, closing_deadline' },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('tender_configs')
    .insert({
      package_code: body.package_code.trim(),
      package_name: body.package_name.trim(),
      project_name: body.project_name.trim(),
      form_schema: body.form_schema,
      boq_template: body.boq_template,
      closing_deadline: body.closing_deadline,
      commercial_terms: body.commercial_terms ?? {},
      location: body.location ?? null,
      job_sequence: body.job_sequence ?? null,
      dependencies: body.dependencies ?? null,
      mobilisation_requirement: body.mobilisation_requirement ?? null,
      scope_items: body.scope_items ?? null,
      boq_qty_editable: body.boq_qty_editable ?? false,
      notes_enabled: body.notes_enabled ?? true,
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
