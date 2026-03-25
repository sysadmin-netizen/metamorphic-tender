import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { ADMIN_SESSION_COOKIE } from '@/lib/constants';

async function verifyAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.has(ADMIN_SESSION_COOKIE);
}

interface ReminderInfo {
  tender_id: string;
  package_code: string;
  vendor_id: string;
  vendor_name: string;
  elapsed_pct: number;
  reminder_type: 'reminder_50pct' | 'reminder_90pct';
  already_sent: boolean;
}

/**
 * POST /api/reminders
 * Check all active tenders, compute elapsed %, and determine which
 * vendors need reminders. Logs reminders to audit_log to prevent duplicates.
 */
export async function POST(): Promise<NextResponse> {
  if (!(await verifyAdmin())) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 },
    );
  }

  const supabase = createServiceClient();
  const now = Date.now();

  // Fetch active tenders
  const { data: tenders, error: tenderError } = await supabase
    .from('tender_configs')
    .select('id, package_code, closing_deadline')
    .eq('is_active', true)
    .eq('is_archived', false);

  if (tenderError) {
    return NextResponse.json(
      { success: false, error: tenderError.message },
      { status: 500 },
    );
  }

  if (!tenders || tenders.length === 0) {
    return NextResponse.json({
      success: true,
      data: { reminders: [], message: 'No active tenders found' },
    });
  }

  const tenderIds = tenders.map((t) => t.id);

  // Fetch all vendor_tenders for active tenders that haven't submitted
  const { data: vendorTenders, error: vtError } = await supabase
    .from('vendor_tenders')
    .select('id, vendor_id, tender_config_id, invited_at, status')
    .in('tender_config_id', tenderIds)
    .in('status', ['invited', 'opened']);

  if (vtError) {
    return NextResponse.json(
      { success: false, error: vtError.message },
      { status: 500 },
    );
  }

  if (!vendorTenders || vendorTenders.length === 0) {
    return NextResponse.json({
      success: true,
      data: { reminders: [], message: 'All vendors have submitted or no invites pending' },
    });
  }

  // Get vendor names
  const vendorIds = [...new Set(vendorTenders.map((vt) => vt.vendor_id))];
  const { data: vendors } = await supabase
    .from('vendors')
    .select('id, company_name')
    .in('id', vendorIds);

  const vendorNameMap = new Map<string, string>();
  if (vendors) {
    for (const v of vendors) {
      vendorNameMap.set(v.id, v.company_name);
    }
  }

  // Check existing reminders in audit_log
  const { data: existingReminders } = await supabase
    .from('audit_log')
    .select('event_type, vendor_id, tender_config_id')
    .in('event_type', ['reminder_50pct', 'reminder_90pct'])
    .in('tender_config_id', tenderIds);

  const sentReminderKeys = new Set<string>();
  if (existingReminders) {
    for (const r of existingReminders) {
      sentReminderKeys.add(`${r.event_type}:${r.vendor_id}:${r.tender_config_id}`);
    }
  }

  // Build tender lookup
  const tenderMap = new Map<string, { package_code: string; closing_deadline: string }>();
  for (const t of tenders) {
    tenderMap.set(t.id, { package_code: t.package_code, closing_deadline: t.closing_deadline });
  }

  // Compute reminders
  const reminders: ReminderInfo[] = [];
  const newAuditEntries: Array<{
    event_type: string;
    vendor_id: string;
    tender_config_id: string;
    metadata: Record<string, unknown>;
  }> = [];

  for (const vt of vendorTenders) {
    const tender = tenderMap.get(vt.tender_config_id);
    if (!tender) continue;

    const invitedAt = new Date(vt.invited_at).getTime();
    const closingAt = new Date(tender.closing_deadline).getTime();
    const totalWindow = closingAt - invitedAt;

    if (totalWindow <= 0) continue;

    const elapsed = now - invitedAt;
    const elapsedPct = Math.min(100, Math.max(0, (elapsed / totalWindow) * 100));
    const vendorName = vendorNameMap.get(vt.vendor_id) ?? vt.vendor_id.slice(0, 8);

    // Check 50% threshold
    if (elapsedPct >= 50) {
      const key50 = `reminder_50pct:${vt.vendor_id}:${vt.tender_config_id}`;
      const alreadySent = sentReminderKeys.has(key50);

      reminders.push({
        tender_id: vt.tender_config_id,
        package_code: tender.package_code,
        vendor_id: vt.vendor_id,
        vendor_name: vendorName,
        elapsed_pct: Math.round(elapsedPct),
        reminder_type: 'reminder_50pct',
        already_sent: alreadySent,
      });

      if (!alreadySent) {
        newAuditEntries.push({
          event_type: 'reminder_50pct',
          vendor_id: vt.vendor_id,
          tender_config_id: vt.tender_config_id,
          metadata: { elapsed_pct: Math.round(elapsedPct), vendor_name: vendorName },
        });
        sentReminderKeys.add(key50);
      }
    }

    // Check 90% threshold
    if (elapsedPct >= 90) {
      const key90 = `reminder_90pct:${vt.vendor_id}:${vt.tender_config_id}`;
      const alreadySent = sentReminderKeys.has(key90);

      reminders.push({
        tender_id: vt.tender_config_id,
        package_code: tender.package_code,
        vendor_id: vt.vendor_id,
        vendor_name: vendorName,
        elapsed_pct: Math.round(elapsedPct),
        reminder_type: 'reminder_90pct',
        already_sent: alreadySent,
      });

      if (!alreadySent) {
        newAuditEntries.push({
          event_type: 'reminder_90pct',
          vendor_id: vt.vendor_id,
          tender_config_id: vt.tender_config_id,
          metadata: { elapsed_pct: Math.round(elapsedPct), vendor_name: vendorName },
        });
        sentReminderKeys.add(key90);
      }
    }
  }

  // Log new reminders to audit_log
  if (newAuditEntries.length > 0) {
    await supabase.from('audit_log').insert(newAuditEntries);
  }

  return NextResponse.json({
    success: true,
    data: {
      reminders,
      new_reminders_logged: newAuditEntries.length,
      total_pending_vendors: vendorTenders.length,
    },
  });
}
