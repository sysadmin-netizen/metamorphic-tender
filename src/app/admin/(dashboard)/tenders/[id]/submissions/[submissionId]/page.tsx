import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/server';
import { formatGST, formatDateOnly } from '@/lib/date';
import { COMPANY_NAME } from '@/lib/constants';
import type {
  BoqTemplateJson,
  BoqSubmissionItemJson,
  CommercialTermsJson,
  MaterialOption,
  VendorTier,
} from '@/lib/types/database';
import { SubmissionDetailActions } from './actions';

/* ---------------------------------------------------------------
   Helpers
   --------------------------------------------------------------- */

function formatAED(value: number): string {
  return value.toLocaleString('en-AE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function materialLabel(opt: MaterialOption): string {
  switch (opt) {
    case 'labour_material':
      return 'Labour + Material';
    case 'split_rate':
      return 'Split Rate';
    default:
      return 'Labour Only';
  }
}

function tierLabel(tier: VendorTier): string {
  switch (tier) {
    case 'preferred':
      return 'Preferred';
    case 'strategic':
      return 'Strategic';
    default:
      return 'Trial';
  }
}

/* ---------------------------------------------------------------
   Page
   --------------------------------------------------------------- */

export default async function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string; submissionId: string }>;
}) {
  const { id: tenderId, submissionId } = await params;
  const supabase = createServiceClient();

  // Fetch submission
  const { data: submission, error: subError } = await supabase
    .from('submissions')
    .select(
      'id, vendor_id, tender_config_id, form_data, boq_data, total_quote_aed, material_option, mobilisation_date, crew_size, metaforge_confirmed, insurance_confirmed, submitted_at, form_schema_snapshot, boq_template_snapshot',
    )
    .eq('id', submissionId)
    .eq('tender_config_id', tenderId)
    .single();

  if (subError || !submission) {
    notFound();
  }

  // Fetch vendor
  const { data: vendor } = await supabase
    .from('vendors')
    .select('company_name, contact_name, email, whatsapp, trade_licence_number, tier, quality_score')
    .eq('id', submission.vendor_id)
    .single();

  // Fetch tender config
  const { data: tender } = await supabase
    .from('tender_configs')
    .select('package_code, package_name, project_name, location, commercial_terms')
    .eq('id', tenderId)
    .single();

  if (!vendor || !tender) {
    notFound();
  }

  const boqTemplate = submission.boq_template_snapshot as BoqTemplateJson;
  const boqData = submission.boq_data as BoqSubmissionItemJson[];
  const commercialTerms = (tender.commercial_terms ?? {}) as CommercialTermsJson;
  const commercialEntries = Object.entries(commercialTerms);

  // Build a lookup for BOQ template descriptions
  const templateLookup = new Map(
    boqTemplate.map((item) => [item.code, item]),
  );

  return (
    <>
      <SubmissionDetailActions tenderId={tenderId} />

      {/* ---- Print-ready document ---- */}
      <div className="submission-document mx-auto max-w-[820px] bg-white text-stone-900 shadow-xl print:shadow-none print:max-w-none print:mx-0">
        {/* Header */}
        <header className="border-b-2 border-[#c9a84c] px-8 py-6 print:px-6 print:py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-stone-900 uppercase">
                Metamorphic Design
              </h1>
              <p className="mt-1 text-sm font-medium text-[#c9a84c]">
                Subcontractor Tender Submission
              </p>
            </div>
            <img
              src="/logo-icon.png"
              alt="Metamorphic Design"
              className="h-12 w-12 object-contain print:h-10 print:w-10"
            />
          </div>

          <div className="mt-5 grid grid-cols-1 gap-1 text-sm sm:grid-cols-2">
            <div>
              <span className="text-stone-500">Package:</span>{' '}
              <span className="font-semibold">
                {tender.package_code} &mdash; {tender.package_name}
              </span>
            </div>
            <div>
              <span className="text-stone-500">Project:</span>{' '}
              <span className="font-semibold">{tender.project_name}</span>
            </div>
            <div>
              <span className="text-stone-500">Submission Date:</span>{' '}
              <span className="font-semibold">
                {formatGST(submission.submitted_at)}
              </span>
            </div>
            {tender.location && (
              <div>
                <span className="text-stone-500">Location:</span>{' '}
                <span className="font-semibold">{tender.location}</span>
              </div>
            )}
            <div>
              <span className="text-stone-500">Reference:</span>{' '}
              <span className="font-mono text-xs font-semibold">
                {submission.id.slice(0, 8).toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        {/* Vendor Details */}
        <section className="border-b border-stone-200 px-8 py-5 print:px-6 print:py-4">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-[#c9a84c]">
            Vendor Details
          </h2>
          <div className="grid grid-cols-1 gap-x-8 gap-y-1.5 text-sm sm:grid-cols-2">
            <div>
              <span className="text-stone-500">Company:</span>{' '}
              <span className="font-semibold">{vendor.company_name}</span>
            </div>
            <div>
              <span className="text-stone-500">Trade Licence:</span>{' '}
              <span className="font-semibold">{vendor.trade_licence_number}</span>
            </div>
            <div>
              <span className="text-stone-500">Contact:</span>{' '}
              <span className="font-semibold">{vendor.contact_name}</span>
            </div>
            <div>
              <span className="text-stone-500">Email:</span>{' '}
              <span className="font-semibold">{vendor.email}</span>
            </div>
            <div>
              <span className="text-stone-500">WhatsApp:</span>{' '}
              <span className="font-semibold">{vendor.whatsapp}</span>
            </div>
            <div>
              <span className="text-stone-500">Vendor Tier:</span>{' '}
              <span className="font-semibold">{tierLabel(vendor.tier)}</span>
            </div>
          </div>
        </section>

        {/* Bill of Quantities */}
        <section className="border-b border-stone-200 px-8 py-5 print:px-6 print:py-4 print:break-before-auto">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-[#c9a84c]">
            Bill of Quantities
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-[#c9a84c]">
                  <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Code
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Description
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Unit
                  </th>
                  <th className="px-2 py-2 text-right text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Qty
                  </th>
                  <th className="px-2 py-2 text-right text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Rate (AED)
                  </th>
                  <th className="px-2 py-2 text-right text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Total (AED)
                  </th>
                </tr>
              </thead>
              <tbody>
                {boqData.map((item, idx) => {
                  const template = templateLookup.get(item.code);
                  return (
                    <tr
                      key={item.code}
                      className={
                        idx % 2 === 0
                          ? 'bg-white'
                          : 'bg-stone-50 print:bg-stone-50'
                      }
                    >
                      <td className="px-2 py-1.5 font-mono text-xs text-stone-600">
                        {item.code}
                      </td>
                      <td className="px-2 py-1.5 text-stone-800">
                        {template?.description ?? '\u2014'}
                      </td>
                      <td className="px-2 py-1.5 text-stone-600">
                        {template?.unit ?? '\u2014'}
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono tabular-nums text-stone-600">
                        {item.quantity ?? template?.quantity ?? '\u2014'}
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono tabular-nums text-stone-900">
                        {formatAED(item.rate)}
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono tabular-nums font-medium text-stone-900">
                        {formatAED(item.total)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[#c9a84c]">
                  <td
                    colSpan={5}
                    className="px-2 py-2 text-right text-sm font-bold uppercase text-stone-700"
                  >
                    Total (AED)
                  </td>
                  <td className="px-2 py-2 text-right font-mono tabular-nums text-base font-bold text-stone-900">
                    {formatAED(submission.total_quote_aed)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        {/* Submission Details */}
        <section className="border-b border-stone-200 px-8 py-5 print:px-6 print:py-4">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-[#c9a84c]">
            Submission Details
          </h2>
          <div className="grid grid-cols-1 gap-x-8 gap-y-1.5 text-sm sm:grid-cols-2">
            <div>
              <span className="text-stone-500">Material Option:</span>{' '}
              <span className="font-semibold">
                {materialLabel(submission.material_option)}
              </span>
            </div>
            <div>
              <span className="text-stone-500">Mobilisation Date:</span>{' '}
              <span className="font-semibold">
                {formatDateOnly(submission.mobilisation_date)}
              </span>
            </div>
            <div>
              <span className="text-stone-500">Crew Size:</span>{' '}
              <span className="font-semibold">{submission.crew_size}</span>
            </div>
          </div>
        </section>

        {/* Compliance */}
        <section className="border-b border-stone-200 px-8 py-5 print:px-6 print:py-4">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-[#c9a84c]">
            Compliance
          </h2>
          <div className="grid grid-cols-1 gap-y-1.5 text-sm sm:grid-cols-2 sm:gap-x-8">
            <div className="flex items-center gap-2">
              <span className="text-stone-500">MetaForge Portal:</span>
              {submission.metaforge_confirmed ? (
                <span className="font-semibold text-emerald-700">
                  &#10003; Confirmed
                </span>
              ) : (
                <span className="font-semibold text-red-600">
                  &#10007; Not Confirmed
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-stone-500">Insurance (AED 2M):</span>
              {submission.insurance_confirmed ? (
                <span className="font-semibold text-emerald-700">
                  &#10003; Confirmed
                </span>
              ) : (
                <span className="font-semibold text-red-600">
                  &#10007; Not Confirmed
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Commercial Terms */}
        {commercialEntries.length > 0 && (
          <section className="border-b border-stone-200 px-8 py-5 print:px-6 print:py-4 print:break-before-auto">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-[#c9a84c]">
              Commercial Terms
            </h2>
            <ol className="list-decimal list-inside space-y-1 text-sm text-stone-700">
              {commercialEntries.map(([key, value]) => (
                <li key={key}>
                  <span className="font-semibold text-stone-900">
                    {key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </span>
                  {' \u2014 '}
                  {String(value)}
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Footer */}
        <footer className="px-8 py-5 print:px-6 print:py-4">
          <div className="border-t border-stone-300 pt-4 text-center text-xs text-stone-400">
            <p>
              This document was generated from the Metamorphic Tender Portal.
            </p>
            <p className="mt-0.5">
              Submission is final and binding.
            </p>
            <p className="mt-1 font-semibold text-stone-500">
              {COMPANY_NAME} &middot; Dubai, UAE
            </p>
          </div>
        </footer>
      </div>

      {/* Print styles — scoped via global stylesheet approach using Tailwind @media print */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              /* Hide admin chrome */
              aside, nav, .admin-sidebar, .submission-actions-bar {
                display: none !important;
              }
              /* Reset main content area */
              main {
                margin-left: 0 !important;
                padding: 0 !important;
              }
              body {
                background: white !important;
                color: black !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .submission-document {
                max-width: 100% !important;
                margin: 0 !important;
                box-shadow: none !important;
                border-radius: 0 !important;
              }
              /* Ensure alternating row backgrounds print */
              tr { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
              /* Avoid page breaks inside tables */
              table { page-break-inside: auto; }
              tr { page-break-inside: avoid; }
              thead { display: table-header-group; }
            }
          `,
        }}
      />
    </>
  );
}
