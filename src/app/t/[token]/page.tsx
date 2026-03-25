import { createServiceClient } from '@/lib/supabase/server';
import { formatGST } from '@/lib/date';
import { hashObject } from '@/lib/hash';
import { APP_NAME, COMPANY_NAME } from '@/lib/constants';
import { Countdown } from '@/components/ui/countdown';
import { SubmissionForm } from './submission-form';
import type { Metadata } from 'next';
import type { TableRow } from '@/lib/types/database';

// ---------------------------------------------------------------------------
// Dead-end components (rendered when a gate fails)
// ---------------------------------------------------------------------------

function InvalidLink() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-900/30">
          <svg
            className="h-8 w-8 text-[var(--md-red)]"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-[var(--text-inverse)]">
          Invalid Link
        </h1>
        <p className="mt-3 text-sm text-[var(--md-grey)]">
          This tender link is not valid. Please check the URL or contact the
          procurement team for a new invitation.
        </p>
        <p className="mt-6 text-xs text-[var(--md-grey)]">
          {COMPANY_NAME}
        </p>
      </div>
    </div>
  );
}

function LinkExpired({
  expiredAt,
  closingDeadline,
  packageName,
}: {
  expiredAt: string;
  closingDeadline: string;
  packageName: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-900/30">
          <svg
            className="h-8 w-8 text-[var(--accent)]"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-[var(--text-inverse)]">
          Link Expired
        </h1>
        <p className="mt-3 text-sm text-[var(--md-grey)]">
          Your invitation link for <strong className="text-[var(--text-inverse)]">{packageName}</strong> expired on{' '}
          <strong className="text-[var(--text-inverse)]">{formatGST(expiredAt)}</strong>.
        </p>
        <p className="mt-2 text-sm text-[var(--md-grey)]">
          The tender closing deadline was{' '}
          <strong className="text-[var(--text-inverse)]">{formatGST(closingDeadline)}</strong>.
        </p>
        <p className="mt-6 text-xs text-[var(--md-grey)]">
          Please contact the procurement team if you need a new link.
        </p>
        <p className="mt-4 text-xs text-[var(--md-grey)]">
          {COMPANY_NAME}
        </p>
      </div>
    </div>
  );
}

function TenderClosed({
  closingDeadline,
  packageName,
}: {
  closingDeadline: string;
  packageName: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-stone-800">
          <svg
            className="h-8 w-8 text-[var(--md-grey)]"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
            />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-[var(--text-inverse)]">
          Tender Closed
        </h1>
        <p className="mt-3 text-sm text-[var(--md-grey)]">
          The submission window for <strong className="text-[var(--text-inverse)]">{packageName}</strong> closed on{' '}
          <strong className="text-[var(--text-inverse)]">{formatGST(closingDeadline)}</strong>.
        </p>
        <p className="mt-6 text-xs text-[var(--md-grey)]">
          {COMPANY_NAME}
        </p>
      </div>
    </div>
  );
}

function SubmissionReceipt({
  packageName,
  companyName,
  submittedAt,
  totalQuote,
  submissionId,
}: {
  packageName: string;
  companyName: string;
  submittedAt: string;
  totalQuote: number;
  submissionId: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-900/30">
          <svg
            className="h-8 w-8 text-[var(--md-green)]"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-[var(--md-green)]">
          TENDER SUBMITTED SUCCESSFULLY
        </h1>
        <p className="mt-3 text-sm text-[var(--md-grey)]">
          Your submission has been recorded. Reference will be emailed to you.
        </p>

        <div className="mt-6 border border-[#444] bg-[var(--md-dark)] p-4 text-left">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-[var(--md-grey)]">Package</dt>
              <dd className="font-medium text-[var(--text-inverse)]">
                {packageName}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--md-grey)]">Company</dt>
              <dd className="font-medium text-[var(--text-inverse)]">
                {companyName}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--md-grey)]">Submitted</dt>
              <dd className="font-medium text-[var(--text-inverse)]">
                {formatGST(submittedAt)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--md-grey)]">Total Quote</dt>
              <dd className="font-mono font-semibold text-[var(--accent)]">
                AED {totalQuote.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--md-grey)]">Reference</dt>
              <dd className="font-mono text-xs text-[var(--md-grey)]">
                {submissionId.slice(0, 8).toUpperCase()}
              </dd>
            </div>
          </dl>
        </div>

        <p className="mt-6 text-xs text-[var(--md-grey)]">
          A confirmation will be sent to your registered email. You may close
          this page.
        </p>
        <p className="mt-4 text-xs text-[var(--md-grey)]">
          {COMPANY_NAME}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Package header box (server-rendered)
// ---------------------------------------------------------------------------

function PackageHeader({
  tenderConfig,
}: {
  tenderConfig: TableRow<'tender_configs'>;
}) {
  const scopeItems = (tenderConfig.scope_items ?? []) as string[];

  return (
    <div className="border border-[var(--accent)] bg-[var(--md-dark)] p-7 mb-8">
      <h2 className="text-[var(--accent)] text-xl font-bold tracking-wide uppercase mb-4">
        {tenderConfig.package_code} — {tenderConfig.package_name}
      </h2>
      <div className="space-y-2 text-sm">
        <div className="text-[var(--md-grey)]">
          <strong className="text-[var(--text-inverse)]">Project:</strong>{' '}
          {tenderConfig.project_name}
        </div>
        {tenderConfig.location && (
          <div className="text-[var(--md-grey)]">
            <strong className="text-[var(--text-inverse)]">Location:</strong>{' '}
            {tenderConfig.location}
          </div>
        )}
        {tenderConfig.job_sequence && (
          <div className="text-[var(--md-grey)]">
            <strong className="text-[var(--text-inverse)]">Job Sequence:</strong>{' '}
            {tenderConfig.job_sequence}
          </div>
        )}
        {tenderConfig.dependencies && (
          <div className="text-[var(--md-grey)]">
            <strong className="text-[var(--text-inverse)]">Dependencies:</strong>{' '}
            {tenderConfig.dependencies}
          </div>
        )}
        {tenderConfig.mobilisation_requirement && (
          <div className="text-[var(--md-grey)]">
            <strong className="text-[var(--text-inverse)]">Mobilisation Requirement:</strong>{' '}
            {tenderConfig.mobilisation_requirement}
          </div>
        )}
      </div>
      {scopeItems.length > 0 && (
        <ul className="mt-4 list-disc pl-5 space-y-1.5">
          {scopeItems.map((item, idx) => (
            <li key={idx} className="text-sm text-[var(--text-inverse)] leading-relaxed">
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: `Submit Tender | ${APP_NAME}`,
  robots: { index: false, follow: false },
};

// ---------------------------------------------------------------------------
// Page component (Server Component - 3-gate check)
// ---------------------------------------------------------------------------

export default async function VendorTenderPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = createServiceClient();

  // -----------------------------------------------------------------------
  // Fetch vendor_tender with joined tender_configs and vendors
  // -----------------------------------------------------------------------
  const { data: vendorTender, error } = await supabase
    .from('vendor_tenders')
    .select('*, tender_configs(*), vendors(*)')
    .eq('token', token)
    .single();

  // -----------------------------------------------------------------------
  // GATE 1: Not found
  // -----------------------------------------------------------------------
  if (error || !vendorTender) {
    return <InvalidLink />;
  }

  const tenderConfig = vendorTender.tender_configs as unknown as
    | TableRow<'tender_configs'>
    | null;
  const vendor = vendorTender.vendors as unknown as
    | TableRow<'vendors'>
    | null;

  if (!tenderConfig || !vendor) {
    return <InvalidLink />;
  }

  // -----------------------------------------------------------------------
  // GATE 2: Expiry checks (whichever is earlier)
  // -----------------------------------------------------------------------
  const now = new Date();
  const expiresAt = new Date(vendorTender.expires_at);
  const closingDeadline = new Date(tenderConfig.closing_deadline);

  // Determine which deadline comes first
  const linkExpired = expiresAt <= now;
  const tenderClosed = closingDeadline <= now;

  if (linkExpired || tenderClosed) {
    // Whichever is earlier determines the error shown
    if (linkExpired && (!tenderClosed || expiresAt <= closingDeadline)) {
      return (
        <LinkExpired
          expiredAt={vendorTender.expires_at}
          closingDeadline={tenderConfig.closing_deadline}
          packageName={tenderConfig.package_name}
        />
      );
    }
    return (
      <TenderClosed
        closingDeadline={tenderConfig.closing_deadline}
        packageName={tenderConfig.package_name}
      />
    );
  }

  // -----------------------------------------------------------------------
  // GATE 3: Already submitted
  // -----------------------------------------------------------------------
  if (vendorTender.status === 'submitted') {
    const { data: submission } = await supabase
      .from('submissions')
      .select('id, submitted_at, total_quote_aed')
      .eq('vendor_tender_id', vendorTender.id)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .single();

    return (
      <SubmissionReceipt
        packageName={tenderConfig.package_name}
        companyName={vendor.company_name}
        submittedAt={submission?.submitted_at ?? vendorTender.submitted_at ?? ''}
        totalQuote={submission?.total_quote_aed ?? 0}
        submissionId={submission?.id ?? vendorTender.id}
      />
    );
  }

  // -----------------------------------------------------------------------
  // ALL GATES PASS: Update status to 'opened' if still 'invited'
  // -----------------------------------------------------------------------
  if (vendorTender.status === 'invited') {
    await supabase
      .from('vendor_tenders')
      .update({
        status: 'opened',
        opened_at: new Date().toISOString(),
      })
      .eq('id', vendorTender.id);
  }

  // -----------------------------------------------------------------------
  // Compute schema hash for drift detection
  // -----------------------------------------------------------------------
  const schemaHash = hashObject(tenderConfig.form_schema);

  // Determine effective deadline (whichever is earlier)
  const effectiveDeadline =
    expiresAt < closingDeadline
      ? vendorTender.expires_at
      : tenderConfig.closing_deadline;

  // -----------------------------------------------------------------------
  // Render the form page — gold+black theme matching reference HTML
  // -----------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-inverse)]">
      <head>
        <meta name="referrer" content="no-referrer" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />
      </head>

      {/* Dark header with gold border */}
      <header className="w-full bg-[var(--md-dark)] border-b-[3px] border-[var(--accent)] px-6 py-6 sm:px-10">
        <div className="mx-auto flex max-w-[900px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-[3px] text-[var(--accent)] uppercase sm:text-[28px]">
              Metamorphic Design
            </h1>
            <p className="mt-1 text-xs tracking-[2px] text-[var(--md-grey)] uppercase">
              Subcontractor Tender Submission Portal
            </p>
          </div>
          <div className="flex flex-col items-start sm:items-end sm:shrink-0 sm:text-right">
            <span className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-[var(--md-grey)]">
              Tender Closes In
            </span>
            <Countdown deadline={effectiveDeadline} />
            <span className="mt-1 text-[13px] text-[var(--md-grey)]">
              {formatGST(effectiveDeadline)}
            </span>
          </div>
        </div>
      </header>

      {/* Status bar */}
      <div className="w-full bg-[var(--md-green)] text-center py-2.5 text-sm font-semibold tracking-wider uppercase text-white">
        TENDER OPEN — ACCEPTING SUBMISSIONS
      </div>

      {/* Main content */}
      <main className="mx-auto w-full max-w-[900px] px-6 py-10 sm:px-6">
        {/* Package header box */}
        <PackageHeader tenderConfig={tenderConfig} />

        {/* Submission form (client component) */}
        <SubmissionForm
          token={token}
          tenderConfig={{
            form_schema: tenderConfig.form_schema,
            boq_template: tenderConfig.boq_template,
            closing_deadline: tenderConfig.closing_deadline,
            package_name: tenderConfig.package_name,
            package_code: tenderConfig.package_code,
            commercial_terms: tenderConfig.commercial_terms as Record<string, unknown>,
            boq_qty_editable: tenderConfig.boq_qty_editable ?? false,
            notes_enabled: tenderConfig.notes_enabled ?? true,
          }}
          vendorData={{
            company_name: vendor.company_name,
            contact_name: vendor.contact_name,
            email: vendor.email,
            whatsapp: vendor.whatsapp,
            trade_licence_number: vendor.trade_licence_number,
            is_dda_approved: vendor.is_dda_approved,
            metaforge_confirmed: vendor.metaforge_confirmed,
          }}
          schemaHash={schemaHash}
        />
      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-xs text-[var(--md-grey)] border-t border-[#333] mt-10">
        {COMPANY_NAME} | Dubai, UAE | Subcontractor Tender Portal
        <br />
        This form is confidential. Submissions are final and binding upon the terms stated above.
      </footer>
    </div>
  );
}
