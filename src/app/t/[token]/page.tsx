import { createServiceClient } from '@/lib/supabase/server';
import { formatGST } from '@/lib/date';
import { hashObject } from '@/lib/hash';
import { APP_NAME, COMPANY_NAME } from '@/lib/constants';
import { Countdown } from '@/components/ui/countdown';
import { SubmissionForm } from './submission-form';
import type { Metadata } from 'next';

// ---------------------------------------------------------------------------
// Dead-end components (rendered when a gate fails)
// ---------------------------------------------------------------------------

function InvalidLink() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-surface)] px-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <svg
            className="h-8 w-8 text-red-600"
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
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">
          Invalid Link
        </h1>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          This tender link is not valid. Please check the URL or contact the
          procurement team for a new invitation.
        </p>
        <p className="mt-6 text-xs text-[var(--text-secondary)]">
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
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-surface)] px-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
          <svg
            className="h-8 w-8 text-amber-600"
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
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">
          Link Expired
        </h1>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          Your invitation link for <strong>{packageName}</strong> expired on{' '}
          <strong>{formatGST(expiredAt)}</strong>.
        </p>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          The tender closing deadline was{' '}
          <strong>{formatGST(closingDeadline)}</strong>.
        </p>
        <p className="mt-6 text-xs text-[var(--text-secondary)]">
          Please contact the procurement team if you need a new link.
        </p>
        <p className="mt-4 text-xs text-[var(--text-secondary)]">
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
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-surface)] px-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-stone-100">
          <svg
            className="h-8 w-8 text-stone-500"
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
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">
          Tender Closed
        </h1>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          The submission window for <strong>{packageName}</strong> closed on{' '}
          <strong>{formatGST(closingDeadline)}</strong>.
        </p>
        <p className="mt-6 text-xs text-[var(--text-secondary)]">
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
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-surface)] px-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
          <svg
            className="h-8 w-8 text-green-600"
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
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">
          Submission Received
        </h1>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          Thank you! Your tender submission for <strong>{packageName}</strong>{' '}
          has been received and recorded.
        </p>

        <div className="mt-6 rounded-lg border border-stone-200 bg-white p-4 text-left">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-[var(--text-secondary)]">Company</dt>
              <dd className="font-medium text-[var(--text-primary)]">
                {companyName}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--text-secondary)]">Submitted</dt>
              <dd className="font-medium text-[var(--text-primary)]">
                {formatGST(submittedAt)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--text-secondary)]">Total Quote</dt>
              <dd className="font-mono font-semibold text-[var(--text-primary)]">
                AED {totalQuote.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--text-secondary)]">Reference</dt>
              <dd className="font-mono text-xs text-[var(--text-secondary)]">
                {submissionId.slice(0, 8).toUpperCase()}
              </dd>
            </div>
          </dl>
        </div>

        <p className="mt-6 text-xs text-[var(--text-secondary)]">
          A confirmation will be sent to your registered email. You may close
          this page.
        </p>
        <p className="mt-4 text-xs text-[var(--text-secondary)]">
          {COMPANY_NAME}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Commercial terms accordion (server-rendered)
// ---------------------------------------------------------------------------

function CommercialTermsAccordion({
  terms,
}: {
  terms: Record<string, unknown>;
}) {
  const entries = Object.entries(terms);
  if (entries.length === 0) return null;

  return (
    <details className="group rounded-lg border border-stone-200 bg-white">
      <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-medium text-[var(--text-primary)] [&::-webkit-details-marker]:hidden">
        <span>Commercial Terms &amp; Conditions</span>
        <svg
          className="h-4 w-4 shrink-0 text-stone-400 transition-transform group-open:rotate-180"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 8.25l-7.5 7.5-7.5-7.5"
          />
        </svg>
      </summary>
      <div className="border-t border-stone-100 px-5 py-4">
        <dl className="space-y-3 text-sm">
          {entries.map(([key, value]) => (
            <div key={key}>
              <dt className="font-medium text-[var(--text-primary)]">
                {key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </dt>
              <dd className="mt-0.5 text-[var(--text-secondary)]">
                {String(value)}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </details>
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
    | import('@/lib/types/database').TableRow<'tender_configs'>
    | null;
  const vendor = vendorTender.vendors as unknown as
    | import('@/lib/types/database').TableRow<'vendors'>
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
  // Render the form page
  // -----------------------------------------------------------------------
  return (
    <>
      <head>
        <meta name="referrer" content="no-referrer" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />
      </head>

      {/* Dark full-width header */}
      <header className="w-full bg-[var(--bg-primary)] px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold text-[var(--text-inverse)] sm:text-lg">
              {tenderConfig.package_name}
            </h1>
            <p className="mt-0.5 text-xs text-stone-400">
              {tenderConfig.project_name} &middot; {tenderConfig.package_code}
            </p>
          </div>
          <div className="ml-4 flex flex-col items-end">
            <span className="text-xs text-stone-400">Time remaining</span>
            <Countdown deadline={effectiveDeadline} />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Vendor greeting */}
        <div className="mb-6">
          <p className="text-sm text-[var(--text-secondary)]">
            Submitting as{' '}
            <strong className="text-[var(--text-primary)]">
              {vendor.company_name}
            </strong>
          </p>
        </div>

        {/* Commercial terms accordion */}
        {tenderConfig.commercial_terms &&
          typeof tenderConfig.commercial_terms === 'object' &&
          Object.keys(tenderConfig.commercial_terms).length > 0 && (
            <div className="mb-6">
              <CommercialTermsAccordion
                terms={tenderConfig.commercial_terms as Record<string, unknown>}
              />
            </div>
          )}

        {/* Submission form (client component) */}
        <SubmissionForm
          token={token}
          tenderConfig={{
            form_schema: tenderConfig.form_schema,
            boq_template: tenderConfig.boq_template,
            closing_deadline: tenderConfig.closing_deadline,
            package_name: tenderConfig.package_name,
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
      <footer className="mt-auto border-t border-stone-200 py-6 text-center text-xs text-[var(--text-secondary)]">
        {COMPANY_NAME} &middot; {APP_NAME}
      </footer>
    </>
  );
}
