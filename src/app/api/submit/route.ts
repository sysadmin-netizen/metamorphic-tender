import { NextResponse, type NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { MAX_PAYLOAD_SIZE } from '@/lib/constants';
import { validateFormData } from '@/lib/validation';
import { hashObject } from '@/lib/hash';
import type {
  BoqTemplateJson,
  BoqSubmissionItemJson,
  FormSchemaJson,
  MaterialOption,
} from '@/lib/types/database';
import type { FormField } from '@/lib/types/form-schema';

interface SubmitRequestBody {
  token: string;
  form_data: Record<string, unknown>;
  boq_data: { code: string; rate: number | string; total: number | string }[];
  schema_hash: string;
}

function isSubmitRequestBody(body: unknown): body is SubmitRequestBody {
  if (typeof body !== 'object' || body === null) return false;
  const record = body as Record<string, unknown>;
  return (
    typeof record.token === 'string' &&
    typeof record.form_data === 'object' &&
    record.form_data !== null &&
    Array.isArray(record.boq_data) &&
    typeof record.schema_hash === 'string'
  );
}

interface VendorTenderRow {
  id: string;
  vendor_id: string;
  tender_config_id: string;
  token: string;
  status: string;
  expires_at: string;
  tender_configs: {
    id: string;
    closing_deadline: string;
    form_schema: FormSchemaJson;
    boq_template: BoqTemplateJson;
  };
  vendors: {
    id: string;
  };
}

async function auditLog(
  supabase: ReturnType<typeof createServiceClient>,
  eventType: string,
  metadata: Record<string, unknown>
): Promise<void> {
  await supabase.from('audit_log').insert({
    event_type: eventType,
    token: (metadata.token as string) ?? null,
    vendor_tender_id: (metadata.vendor_tender_id as string) ?? null,
    tender_config_id: (metadata.tender_config_id as string) ?? null,
    vendor_id: (metadata.vendor_id as string) ?? null,
    ip_address: (metadata.ip as string) ?? null,
    user_agent: (metadata.ua as string) ?? null,
    metadata,
  });
}

interface PostgrestError {
  code: string;
  message: string;
  details: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Check Content-Length > 256KB (EC-09)
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_SIZE) {
    return NextResponse.json(
      { success: false, error: 'Payload too large', code: 'EC-09' },
      { status: 413 }
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

  if (!isSubmitRequestBody(body)) {
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  const { token, form_data, boq_data, schema_hash } = body;

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const ua = request.headers.get('user-agent') ?? 'unknown';

  const supabase = createServiceClient();

  // GATE 1: Query vendor_tenders with token, join tender_configs and vendors
  const { data: vendorTender, error: vtError } = await supabase
    .from('vendor_tenders')
    .select(`
      id,
      vendor_id,
      tender_config_id,
      token,
      status,
      expires_at,
      tender_configs!inner (
        id,
        closing_deadline,
        form_schema,
        boq_template
      ),
      vendors!inner (
        id
      )
    `)
    .eq('token', token)
    .single();

  if (vtError || !vendorTender) {
    await auditLog(supabase, 'submission.token_not_found', {
      token,
      ip,
      ua,
      error: vtError?.message ?? 'Not found',
    });
    return NextResponse.json(
      { success: false, error: 'Invalid or unknown token' },
      { status: 404 }
    );
  }

  const vt = vendorTender as unknown as VendorTenderRow;
  const auditMeta = {
    token,
    vendor_tender_id: vt.id,
    tender_config_id: vt.tender_config_id,
    vendor_id: vt.vendor_id,
    ip,
    ua,
  };

  // GATE 2a: Check expires_at
  const now = new Date();
  if (new Date(vt.expires_at) < now) {
    await auditLog(supabase, 'submission.token_expired', auditMeta);
    return NextResponse.json(
      { success: false, error: 'This invitation link has expired' },
      { status: 403 }
    );
  }

  // GATE 2b: Check tender_configs.closing_deadline
  if (new Date(vt.tender_configs.closing_deadline) < now) {
    await auditLog(supabase, 'submission.tender_closed', auditMeta);
    return NextResponse.json(
      { success: false, error: 'The tender closing deadline has passed' },
      { status: 403 }
    );
  }

  // GATE 3: Check status === 'submitted'
  if (vt.status === 'submitted') {
    await auditLog(supabase, 'submission.already_submitted', auditMeta);
    return NextResponse.json(
      { success: false, error: 'This tender has already been submitted' },
      { status: 409 }
    );
  }

  // Schema drift check
  const currentSchemaHash = hashObject(vt.tender_configs.form_schema);
  if (currentSchemaHash !== schema_hash) {
    await auditLog(supabase, 'submission.schema_drift', {
      ...auditMeta,
      expected_hash: currentSchemaHash,
      received_hash: schema_hash,
    });
    return NextResponse.json(
      {
        success: false,
        error: 'The form structure has changed since you loaded the page. Please refresh and try again.',
        code: 'SCHEMA_DRIFT',
      },
      { status: 409 }
    );
  }

  // Validate form_data against schema
  const formSchema = vt.tender_configs.form_schema;
  const formErrors = validateFormData(form_data, {
    sections: formSchema.sections.map((s) => ({
      ...s,
      fields: s.fields.map((f) => ({
        ...f,
        type: f.type as FormField['type'],
      })),
    })),
  });
  if (formErrors.length > 0) {
    await auditLog(supabase, 'submission.validation_failed', {
      ...auditMeta,
      errors: formErrors,
    });
    return NextResponse.json(
      { success: false, error: 'Validation failed', details: formErrors },
      { status: 422 }
    );
  }

  // Validate & recalculate BOQ server-side
  const boqTemplate = vt.tender_configs.boq_template;
  const submittedBoqMap = new Map<string, { rate: number | string; total: number | string }>();
  for (const entry of boq_data) {
    if (typeof entry === 'object' && entry !== null && typeof entry.code === 'string') {
      submittedBoqMap.set(entry.code, entry);
    }
  }

  const serverBoqData: BoqSubmissionItemJson[] = [];
  const boqWarnings: string[] = [];
  const boqErrors: string[] = [];
  let serverTotal = 0;

  for (const templateItem of boqTemplate) {
    const vendorEntry = submittedBoqMap.get(templateItem.code);

    if (!vendorEntry) {
      // EC-22: Unknown/missing code
      boqWarnings.push(`Missing BOQ entry for code ${templateItem.code}`);
      serverBoqData.push({
        code: templateItem.code,
        rate: 0,
        total: 0,
      });
      continue;
    }

    const rate = Number(vendorEntry.rate);

    // EC-08: Reject NaN or negative rates
    if (isNaN(rate) || rate < 0) {
      boqErrors.push(`Invalid rate for item ${templateItem.code}: rate must be a non-negative number (EC-08)`);
      continue;
    }

    // Log zero rates as warnings
    if (rate === 0) {
      boqWarnings.push(`Zero rate submitted for code ${templateItem.code}`);
    }

    // Server calculates total using ORIGINAL template quantities
    const total = templateItem.quantity * rate;
    serverTotal += total;

    serverBoqData.push({
      code: templateItem.code,
      rate,
      total,
    });
  }

  // Check for unknown codes submitted by vendor (EC-22)
  for (const entry of boq_data) {
    if (typeof entry === 'object' && entry !== null && typeof entry.code === 'string') {
      const known = boqTemplate.some((t) => t.code === entry.code);
      if (!known) {
        boqWarnings.push(`Unknown BOQ code submitted: ${entry.code} (EC-22)`);
      }
    }
  }

  if (boqErrors.length > 0) {
    await auditLog(supabase, 'submission.boq_validation_failed', {
      ...auditMeta,
      errors: boqErrors,
    });
    return NextResponse.json(
      { success: false, error: 'BOQ validation failed', details: boqErrors, code: 'EC-08' },
      { status: 422 }
    );
  }

  // Extract form fields needed for the submission row
  const materialOption = (form_data.material_option as MaterialOption) ?? 'labour_only';
  const mobilisationDate = (form_data.mobilisation_date as string) ?? new Date().toISOString();
  const crewSize = typeof form_data.crew_size === 'number'
    ? form_data.crew_size
    : parseInt(String(form_data.crew_size ?? '0'), 10) || 0;
  const metaforgeConfirmed = form_data.metaforge_confirmed === true;
  const insuranceConfirmed = form_data.insurance_confirmed === true;

  // INSERT into submissions
  const { error: insertError } = await supabase.from('submissions').insert({
    vendor_tender_id: vt.id,
    vendor_id: vt.vendor_id,
    tender_config_id: vt.tender_config_id,
    form_data,
    boq_data: serverBoqData,
    total_quote_aed: serverTotal,
    material_option: materialOption,
    mobilisation_date: mobilisationDate,
    crew_size: crewSize,
    metaforge_confirmed: metaforgeConfirmed,
    insurance_confirmed: insuranceConfirmed,
    form_schema_snapshot: vt.tender_configs.form_schema,
    boq_template_snapshot: vt.tender_configs.boq_template,
  });

  if (insertError) {
    const pgError = insertError as unknown as PostgrestError;

    // Handle 23505 unique violation (EC-05)
    if (pgError.code === '23505') {
      await auditLog(supabase, 'submission.duplicate', auditMeta);
      return NextResponse.json(
        { success: false, error: 'Duplicate submission detected', code: 'EC-05' },
        { status: 409 }
      );
    }

    await auditLog(supabase, 'submission.insert_error', {
      ...auditMeta,
      error: insertError.message,
    });
    return NextResponse.json(
      { success: false, error: 'Failed to save submission' },
      { status: 500 }
    );
  }

  // UPDATE vendor_tenders status to 'submitted'
  const { error: updateError } = await supabase
    .from('vendor_tenders')
    .update({
      status: 'submitted' as const,
      submitted_at: new Date().toISOString(),
    })
    .eq('id', vt.id);

  if (updateError) {
    await auditLog(supabase, 'submission.status_update_failed', {
      ...auditMeta,
      error: updateError.message,
    });
    // Submission was saved, so still return success but log the issue
  }

  // Audit log success
  await auditLog(supabase, 'submission.success', {
    ...auditMeta,
    total_quote_aed: serverTotal,
    boq_warnings: boqWarnings.length > 0 ? boqWarnings : undefined,
  });

  return NextResponse.json({
    success: true,
    message: 'Submission received',
    total_quote_aed: serverTotal,
  });
}
