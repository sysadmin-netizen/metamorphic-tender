'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';

interface SubmissionDetailActionsProps {
  tenderId: string;
  pdfFilename?: string;
}

export { type PdfData } from './pdf-types';

export function SubmissionDetailActions({ tenderId, pdfFilename }: SubmissionDetailActionsProps) {
  const [downloading, setDownloading] = useState(false);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  /**
   * Download PDF — captures on-screen document as image,
   * then splits into proper A4 pages.
   */
  const handleDownloadPdf = useCallback(async () => {
    const el = document.querySelector('.submission-document') as HTMLElement | null;
    if (!el) return;

    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas-pro')).default;
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const imgW = canvas.width;
      const imgH = canvas.height;

      // Scale to fit entire document on A4 width with margins
      const a4W = 210;
      const a4H = 297;
      const m = 5; // margin mm
      const contentW = a4W - m * 2;
      const contentH = (imgH * contentW) / imgW;

      // Create PDF sized to fit — if taller than A4, use custom height
      const pageH = Math.max(a4H, contentH + m * 2);
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: contentH + m * 2 <= a4H ? 'a4' : [a4W, pageH],
      });

      doc.addImage(imgData, 'PNG', m, m, contentW, contentH);

      doc.save(`${pdfFilename ?? 'Tender-Submission'}.pdf`);
    } catch (err) {
      console.error('PDF download failed:', err);
    } finally {
      setDownloading(false);
    }
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
          disabled={downloading}
          className="inline-flex items-center gap-2 rounded-md bg-amber-600 px-3 py-2 text-sm font-semibold text-stone-900 hover:bg-amber-500 transition-colors disabled:opacity-50"
        >
          {downloading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-stone-800 border-t-transparent" />
              Generating...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Download PDF
            </>
          )}
        </button>
      </div>
    </div>
  );
}
