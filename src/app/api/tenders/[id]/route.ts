import { NextResponse, type NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { ADMIN_SESSION_COOKIE } from '@/lib/constants';
import type { TableUpdate } from '@/lib/types/database';

async function verifyAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.has(ADMIN_SESSION_COOKIE);
}

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  if (!(await verifyAdmin())) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { id } = await params;
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('tender_configs')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { success: false, error: 'Tender config not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data });
}

interface PatchTenderBody {
  updated_at: string;
  package_code?: string;
  package_name?: string;
  project_name?: string;
  form_schema?: TableUpdate<'tender_configs'>['form_schema'];
  boq_template?: TableUpdate<'tender_configs'>['boq_template'];
  closing_deadline?: string;
  is_active?: boolean;
  commercial_terms?: TableUpdate<'tender_configs'>['commercial_terms'];
  location?: string | null;
  job_sequence?: string | null;
  dependencies?: string | null;
  mobilisation_requirement?: string | null;
  scope_items?: string[] | null;
  boq_qty_editable?: boolean;
  notes_enabled?: boolean;
}

function isPatchTenderBody(body: unknown): body is PatchTenderBody {
  if (typeof body !== 'object' || body === null) return false;
  const record = body as Record<string, unknown>;
  return typeof record.updated_at === 'string';
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  if (!(await verifyAdmin())) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  if (!isPatchTenderBody(body)) {
    return NextResponse.json(
      { success: false, error: 'Missing required field: updated_at for optimistic concurrency (EC-23)' },
      { status: 400 }
    );
  }

  const { updated_at: originalUpdatedAt, ...updateFields } = body;

  // Build the update payload, excluding the concurrency field
  const updatePayload: TableUpdate<'tender_configs'> = {};
  if (updateFields.package_code !== undefined) updatePayload.package_code = updateFields.package_code;
  if (updateFields.package_name !== undefined) updatePayload.package_name = updateFields.package_name;
  if (updateFields.project_name !== undefined) updatePayload.project_name = updateFields.project_name;
  if (updateFields.form_schema !== undefined) updatePayload.form_schema = updateFields.form_schema;
  if (updateFields.boq_template !== undefined) updatePayload.boq_template = updateFields.boq_template;
  if (updateFields.closing_deadline !== undefined) updatePayload.closing_deadline = updateFields.closing_deadline;
  if (updateFields.is_active !== undefined) updatePayload.is_active = updateFields.is_active;
  if (updateFields.commercial_terms !== undefined) updatePayload.commercial_terms = updateFields.commercial_terms;
  if (updateFields.location !== undefined) updatePayload.location = updateFields.location;
  if (updateFields.job_sequence !== undefined) updatePayload.job_sequence = updateFields.job_sequence;
  if (updateFields.dependencies !== undefined) updatePayload.dependencies = updateFields.dependencies;
  if (updateFields.mobilisation_requirement !== undefined) updatePayload.mobilisation_requirement = updateFields.mobilisation_requirement;
  if (updateFields.scope_items !== undefined) updatePayload.scope_items = updateFields.scope_items;
  if (updateFields.boq_qty_editable !== undefined) updatePayload.boq_qty_editable = updateFields.boq_qty_editable;
  if (updateFields.notes_enabled !== undefined) updatePayload.notes_enabled = updateFields.notes_enabled;

  const supabase = createServiceClient();

  // OPTIMISTIC CONCURRENCY (EC-23):
  // UPDATE ... WHERE id = $1 AND updated_at = $original
  const { data, error } = await supabase
    .from('tender_configs')
    .update(updatePayload)
    .eq('id', id)
    .eq('updated_at', originalUpdatedAt)
    .select()
    .single();

  if (error) {
    // If no rows matched, it means updated_at changed (another user modified it)
    if (error.code === 'PGRST116') {
      return NextResponse.json(
        { success: false, error: 'Modified by another user. Please refresh and try again.', code: 'EC-23' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { success: false, error: 'Modified by another user. Please refresh and try again.', code: 'EC-23' },
      { status: 409 }
    );
  }

  return NextResponse.json({ success: true, data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  if (!(await verifyAdmin())) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { id } = await params;
  const supabase = createServiceClient();

  // Soft delete (EC-20): Check submission count first
  const { count, error: countError } = await supabase
    .from('submissions')
    .select('id', { count: 'exact', head: true })
    .eq('tender_config_id', id);

  if (countError) {
    return NextResponse.json(
      { success: false, error: countError.message },
      { status: 500 }
    );
  }

  if (count !== null && count > 0) {
    return NextResponse.json(
      {
        success: false,
        error: `Cannot delete tender with ${count} submission(s). Archive it instead.`,
        code: 'EC-20',
        submission_count: count,
      },
      { status: 409 }
    );
  }

  // No submissions: soft-delete by setting is_archived = true
  const { data, error } = await supabase
    .from('tender_configs')
    .update({ is_archived: true })
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { success: false, error: 'Tender config not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data });
}
