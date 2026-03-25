'use client';

import Link from 'next/link';
import { useCallback } from 'react';

interface SubmissionDetailActionsProps {
  tenderId: string;
  pdfFilename?: string;
}

export { type PdfData } from './pdf-types';

export function SubmissionDetailActions({ tenderId, pdfFilename }: SubmissionDetailActionsProps) {
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleDownloadPdf = useCallback(() => {
    // Same print mechanism that works perfectly — but in a clean popup
    // so the main page stays responsive. User selects "Save as PDF" as destination.
    const docEl = document.querySelector('.submission-document');
    if (!docEl) return;

    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((s) => s.outerHTML)
      .join('\n');

    const popup = window.open('', '_blank');
    if (!popup) return;

    popup.document.write(`<!DOCTYPE html>
<html><head>
<title>${pdfFilename ?? 'Tender-Submission'}</title>
${styles}
<style>
  body { margin: 0; padding: 0; background: white; }
  @page { size: A4; margin: 8mm 10mm; }
  @media print {
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    .submission-document { max-width: 100% !important; margin: 0 !important; box-shadow: none !important; border: none !important; }
    .submission-document section, .submission-document > div { page-break-inside: avoid; break-inside: avoid; }
    table { page-break-inside: auto; }
    tr { page-break-inside: avoid; break-inside: avoid; }
  }
</style>
</head><body>
<div class="submission-document" style="max-width:820px;margin:0 auto;background:white;color:#1a1a1a;">
${docEl.innerHTML}
</div>
<script>window.onload=function(){window.print();}<\/script>
</body></html>`);
    popup.document.close();
  }, [pdfFilename]);

  return (
    <div className="submission-actions-bar sticky top-0 z-50 -mx-4 -mt-4 mb-6 flex items-center justify-between gap-3 border-b border-stone-700 bg-stone-900/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:-mt-6 sm:px-6 lg:-mt-6 print:hidden">
      <Link
        href={`/admin/tenders/${tenderId}/submissions`}
        className="inline-flex items-center gap-2 rounded-md bg-stone-800 px-3 py-2 text-sm font-medium text-stone-300 hover:bg-stone-700 hover:text-stone-100 transition-colors"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Back
      </Link>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-2 rounded-md bg-stone-800 px-3 py-2 text-sm font-medium text-stone-300 hover:bg-stone-700 hover:text-stone-100 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18.25 7.034V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659" />
          </svg>
          Print
        </button>

        <button
          type="button"
          onClick={handleDownloadPdf}
          className="inline-flex items-center gap-2 rounded-md bg-amber-600 px-3 py-2 text-sm font-semibold text-stone-900 hover:bg-amber-500 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Save as PDF
        </button>
      </div>
    </div>
  );
}
