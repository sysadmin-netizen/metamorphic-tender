import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { ADMIN_SESSION_COOKIE } from '@/lib/constants';

async function verifyAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.has(ADMIN_SESSION_COOKIE);
}

/**
 * POST /api/cleanup
 * Runs the cleanup_archived_tenders() function to delete
 * archived tenders older than 30 days.
 * Can also be called via Vercel Cron.
 */
export async function POST(request: Request): Promise<NextResponse> {
  // Allow cron calls with a secret, or admin calls with cookie
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const isCron = cronSecret && authHeader === `Bearer ${cronSecret}`;

  if (!isCron && !(await verifyAdmin())) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const supabase = createServiceClient();

  // Delete invites for old archived tenders first (FK constraint)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: oldTenders } = await supabase
    .from('tender_configs')
    .select('id')
    .eq('is_archived', true)
    .lt('archived_at', thirtyDaysAgo);

  if (!oldTenders || oldTenders.length === 0) {
    return NextResponse.json({
      success: true,
      deleted_count: 0,
      message: 'No archived tenders older than 30 days',
    });
  }

  const oldIds = oldTenders.map((t) => t.id);

  // Clean up related records
  await supabase.from('vendor_tenders').delete().in('tender_config_id', oldIds);
  await supabase.from('submissions').delete().in('tender_config_id', oldIds);

  // Delete the tenders
  const { error } = await supabase.from('tender_configs').delete().in('id', oldIds);

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    deleted_count: oldIds.length,
    message: `Cleaned up ${oldIds.length} archived tender(s) older than 30 days`,
  });
}
