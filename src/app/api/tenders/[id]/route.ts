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
  is_archived?: boolean;
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
  if (updateFields.is_archived !== undefined) {
    updatePayload.is_archived = updateFields.is_archived;
    // Clear archived_at when restoring from archive
    if (!updateFields.is_archived) {
      (updatePayload as Record<string, unknown>).archived_at = null;
    }
  }
  if (updateFields.commercial_terms !== undefined) updatePayload.commercial_terms = updateFields.commercial_terms;
  if (updateFields.location !== undefined) updatePayload.location = updateFields.location;
  if (updateFields.job_sequence !== undefined) updatePayload.job_sequence = updateFields.job_sequence;
  if (updateFields.dependencies !== undefined) updatePayload.dependencies = updateFields.dependencies;
  if (updateFields.mobilisation_requirement !== undefined) updatePayload.mobilisation_requirement = updateFields.mobilisation_requirement;
  if (updateFields.scope_items !== undefined) updatePayload.scope_items = updateFields.scope_items;
  if (updateFields.boq_qty_editable !== undefined) updatePayload.boq_qty_editable = updateFields.boq_qty_editable;
  if (updateFields.notes_enabled !== undefined) updatePayload.notes_enabled = updateFields.notes_enabled;

  const supabase = createServiceClient();

  // For archive/restore operations, skip optimistic concurrency (no conflict risk)
  const isArchiveToggle = updateFields.is_archived !== undefined
    && Object.keys(updatePayload).every(k => ['is_archived', 'is_active', 'archived_at'].includes(k));

  let query = supabase
    .from('tender_configs')
    .update(updatePayload)
    .eq('id', id);

  // OPTIMISTIC CONCURRENCY (EC-23) — only for content edits, not archive toggles
  if (!isArchiveToggle) {
    query = query.eq('updated_at', originalUpdatedAt);
  }

  const { data, error } = await query.select().single();

  if (error) {
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
      { success: false, error: 'Tender not found' },
      { status: 404 }
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

  // EC-20: Check submission count first
  const { count: subCount, error: countError } = await supabase
    .from('submissions')
    .select('id', { count: 'exact', head: true })
    .eq('tender_config_id', id);

  if (countError) {
    return NextResponse.json(
      { success: false, error: countError.message },
      { status: 500 }
    );
  }

  const hasSubmissions = subCount !== null && subCount > 0;

  if (hasSubmissions) {
    // Has submissions: archive instead of delete (EC-20)
    const { data, error } = await supabase
      .from('tender_configs')
      .update({ is_archived: true, is_active: false, archived_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: 'Tender not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      archived: true,
      message: `Tender archived (has ${subCount} submission(s))`,
    });
  }

  // No submissions: check for invites and clean up
  // Delete vendor_tenders (invites) first to avoid FK constraint
  await supabase
    .from('vendor_tenders')
    .delete()
    .eq('tender_config_id', id);

  // Now delete the tender config
  const { error: deleteError } = await supabase
    .from('tender_configs')
    .delete()
    .eq('id', id);

  if (deleteError) {
    // If real delete fails (FK or other), fall back to archive
    const { data: archived } = await supabase
      .from('tender_configs')
      .update({ is_archived: true, is_active: false, archived_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    return NextResponse.json({
      success: true,
      data: archived,
      archived: true,
      message: 'Tender archived (could not fully delete)',
    });
  }

  return NextResponse.json({ success: true, deleted: true });
}
