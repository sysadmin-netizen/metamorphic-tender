import { NextResponse, type NextRequest } from 'next/server';
import { PDFDocument, rgb, StandardFonts, type PDFPage, type PDFFont } from 'pdf-lib';
import { createServiceClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { ADMIN_SESSION_COOKIE, COMPANY_NAME } from '@/lib/constants';
import type {
  BoqTemplateJson,
  BoqSubmissionItemJson,
  CommercialTermsJson,
  MaterialOption,
  VendorTier,
} from '@/lib/types/database';

/* ---------------------------------------------------------------
   Auth
   --------------------------------------------------------------- */

async function verifyAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.has(ADMIN_SESSION_COOKIE);
}

/* ---------------------------------------------------------------
   Helpers
   --------------------------------------------------------------- */

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN_LEFT = 50;
const MARGIN_RIGHT = 50;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
const PAGE_BOTTOM = 60;

const GOLD = rgb(201 / 255, 168 / 255, 76 / 255);
const BLACK = rgb(0, 0, 0);
const DARK_GREY = rgb(0.25, 0.25, 0.25);
const MEDIUM_GREY = rgb(0.45, 0.45, 0.45);
const LIGHT_GREY = rgb(0.75, 0.75, 0.75);
const ROW_ALT_BG = rgb(0.96, 0.96, 0.96);

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

function formatGST(date: string | Date): string {
  const d = new Date(date);
  const raw = d.toLocaleString('en-GB', {
    timeZone: 'Asia/Dubai',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return raw.replace(/\//g, '.').replace(',', '') + ' GST';
}

function formatDateOnly(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-GB', {
    timeZone: 'Asia/Dubai',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/* ---------------------------------------------------------------
   PDF Drawing Helpers
   --------------------------------------------------------------- */

interface DrawContext {
  doc: PDFDocument;
  page: PDFPage;
  y: number;
  font: PDFFont;
  boldFont: PDFFont;
}

function ensureSpace(ctx: DrawContext, needed: number): DrawContext {
  if (ctx.y - needed < PAGE_BOTTOM) {
    const newPage = ctx.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    return { ...ctx, page: newPage, y: PAGE_HEIGHT - 50 };
  }
  return ctx;
}

function drawHorizontalLine(ctx: DrawContext, color: typeof GOLD, thickness: number): void {
  ctx.page.drawRectangle({
    x: MARGIN_LEFT,
    y: ctx.y,
    width: CONTENT_WIDTH,
    height: thickness,
    color,
  });
}

function drawSectionTitle(ctx: DrawContext, title: string): DrawContext {
  let c = ensureSpace(ctx, 30);
  c.page.drawText(title, {
    x: MARGIN_LEFT,
    y: c.y,
    size: 9,
    font: c.boldFont,
    color: GOLD,
  });
  c.y -= 16;
  return c;
}

function drawLabelValue(
  ctx: DrawContext,
  label: string,
  value: string,
  x: number,
  labelWidth: number
): void {
  ctx.page.drawText(label, {
    x,
    y: ctx.y,
    size: 8,
    font: ctx.font,
    color: MEDIUM_GREY,
  });
  ctx.page.drawText(value, {
    x: x + labelWidth,
    y: ctx.y,
    size: 8,
    font: ctx.boldFont,
    color: DARK_GREY,
  });
}

/** Draw text truncated to fit within maxWidth */
function drawTruncated(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  size: number,
  pdfFont: PDFFont,
  color: typeof BLACK
): void {
  let display = text;
  while (display.length > 0 && pdfFont.widthOfTextAtSize(display, size) > maxWidth) {
    display = display.slice(0, -1);
  }
  if (display.length < text.length && display.length > 3) {
    display = display.slice(0, -3) + '...';
  }
  page.drawText(display, { x, y, size, font: pdfFont, color });
}

/** Draw right-aligned text */
function drawRight(
  page: PDFPage,
  text: string,
  rightX: number,
  y: number,
  size: number,
  pdfFont: PDFFont,
  color: typeof BLACK
): void {
  const w = pdfFont.widthOfTextAtSize(text, size);
  page.drawText(text, { x: rightX - w, y, size, font: pdfFont, color });
}

/* ---------------------------------------------------------------
   Route params type
   --------------------------------------------------------------- */

type RouteParams = { params: Promise<{ id: string }> };

/* ---------------------------------------------------------------
   GET /api/submissions/[id]/pdf
   --------------------------------------------------------------- */

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse | Response> {
  if (!(await verifyAdmin())) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { id } = await params;
  const supabase = createServiceClient();

  // Fetch submission
  const { data: submission, error: subError } = await supabase
    .from('submissions')
    .select(
      'id, vendor_id, tender_config_id, boq_data, total_quote_aed, material_option, mobilisation_date, crew_size, metaforge_confirmed, insurance_confirmed, submitted_at, boq_template_snapshot'
    )
    .eq('id', id)
    .single();

  if (subError || !submission) {
    return NextResponse.json(
      { success: false, error: 'Submission not found' },
      { status: 404 }
    );
  }

  // Fetch vendor
  const { data: vendor, error: vendorError } = await supabase
    .from('vendors')
    .select('company_name, contact_name, email, whatsapp, trade_licence_number, tier')
    .eq('id', submission.vendor_id)
    .single();

  if (vendorError || !vendor) {
    return NextResponse.json(
      { success: false, error: 'Vendor not found' },
      { status: 404 }
    );
  }

  // Fetch tender config
  const { data: tender, error: tenderError } = await supabase
    .from('tender_configs')
    .select('package_code, package_name, project_name, location, commercial_terms')
    .eq('id', submission.tender_config_id)
    .single();

  if (tenderError || !tender) {
    return NextResponse.json(
      { success: false, error: 'Tender config not found' },
      { status: 404 }
    );
  }

  const boqTemplate = submission.boq_template_snapshot as BoqTemplateJson;
  const boqData = submission.boq_data as BoqSubmissionItemJson[];
  const commercialTerms = (tender.commercial_terms ?? {}) as CommercialTermsJson;
  const commercialEntries = Object.entries(commercialTerms);

  // Build lookup for BOQ template
  const templateLookup = new Map(
    boqTemplate.map((item) => [item.code, item])
  );

  /* ---------------------------------------------------------------
     Build PDF
     --------------------------------------------------------------- */

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const firstPage = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  let ctx: DrawContext = { doc, page: firstPage, y: PAGE_HEIGHT - 45, font, boldFont };

  // ---- HEADER ----
  ctx.page.drawText('METAMORPHIC DESIGN', {
    x: MARGIN_LEFT,
    y: ctx.y,
    size: 18,
    font: boldFont,
    color: DARK_GREY,
  });
  ctx.y -= 16;

  ctx.page.drawText('Subcontractor Tender Submission', {
    x: MARGIN_LEFT,
    y: ctx.y,
    size: 10,
    font: boldFont,
    color: GOLD,
  });
  ctx.y -= 16;

  // Gold line under header
  drawHorizontalLine(ctx, GOLD, 2);
  ctx.y -= 20;

  // ---- PACKAGE INFO ----
  const col2X = MARGIN_LEFT + CONTENT_WIDTH / 2;
  const pkgLabelW = 105;

  drawLabelValue(ctx, 'Package:', `${tender.package_code} \u2014 ${tender.package_name}`, MARGIN_LEFT, pkgLabelW);
  drawLabelValue(ctx, 'Project:', tender.project_name, col2X, pkgLabelW);
  ctx.y -= 14;

  drawLabelValue(ctx, 'Submission Date:', formatGST(submission.submitted_at), MARGIN_LEFT, pkgLabelW);
  if (tender.location) {
    drawLabelValue(ctx, 'Location:', tender.location, col2X, pkgLabelW);
  }
  ctx.y -= 14;

  drawLabelValue(ctx, 'Reference:', submission.id.slice(0, 8).toUpperCase(), MARGIN_LEFT, pkgLabelW);
  ctx.y -= 22;

  // Thin grey line
  drawHorizontalLine(ctx, LIGHT_GREY, 0.5);
  ctx.y -= 18;

  // ---- VENDOR DETAILS ----
  ctx = drawSectionTitle(ctx, 'VENDOR DETAILS');

  drawLabelValue(ctx, 'Company:', vendor.company_name, MARGIN_LEFT, pkgLabelW);
  drawLabelValue(ctx, 'Trade Licence:', vendor.trade_licence_number, col2X, pkgLabelW);
  ctx.y -= 14;

  drawLabelValue(ctx, 'Contact:', vendor.contact_name, MARGIN_LEFT, pkgLabelW);
  drawLabelValue(ctx, 'Email:', vendor.email, col2X, pkgLabelW);
  ctx.y -= 14;

  drawLabelValue(ctx, 'WhatsApp:', vendor.whatsapp, MARGIN_LEFT, pkgLabelW);
  drawLabelValue(ctx, 'Vendor Tier:', tierLabel(vendor.tier), col2X, pkgLabelW);
  ctx.y -= 22;

  // Thin grey line
  drawHorizontalLine(ctx, LIGHT_GREY, 0.5);
  ctx.y -= 18;

  // ---- BILL OF QUANTITIES ----
  ctx = drawSectionTitle(ctx, 'BILL OF QUANTITIES');

  // Table column positions
  const colCode = MARGIN_LEFT;
  const colDesc = MARGIN_LEFT + 55;
  const colUnit = MARGIN_LEFT + 255;
  const colQty = MARGIN_LEFT + 310;
  const colRate = MARGIN_LEFT + 370;
  const colTotal = MARGIN_LEFT + CONTENT_WIDTH;

  // Table header
  ctx = ensureSpace(ctx, 20);
  const headerSize = 7;
  ctx.page.drawText('CODE', { x: colCode, y: ctx.y, size: headerSize, font: boldFont, color: MEDIUM_GREY });
  ctx.page.drawText('DESCRIPTION', { x: colDesc, y: ctx.y, size: headerSize, font: boldFont, color: MEDIUM_GREY });
  ctx.page.drawText('UNIT', { x: colUnit, y: ctx.y, size: headerSize, font: boldFont, color: MEDIUM_GREY });
  drawRight(ctx.page, 'QTY', colQty + 40, ctx.y, headerSize, boldFont, MEDIUM_GREY);
  drawRight(ctx.page, 'RATE (AED)', colRate + 60, ctx.y, headerSize, boldFont, MEDIUM_GREY);
  drawRight(ctx.page, 'TOTAL (AED)', colTotal, ctx.y, headerSize, boldFont, MEDIUM_GREY);
  ctx.y -= 6;

  // Gold line under table header
  drawHorizontalLine(ctx, GOLD, 1.5);
  ctx.y -= 12;

  // Table rows
  const rowSize = 7.5;
  boqData.forEach((item, idx) => {
    ctx = ensureSpace(ctx, 16);
    const template = templateLookup.get(item.code);

    // Alternating row background
    if (idx % 2 === 1) {
      ctx.page.drawRectangle({
        x: MARGIN_LEFT - 4,
        y: ctx.y - 4,
        width: CONTENT_WIDTH + 8,
        height: 14,
        color: ROW_ALT_BG,
      });
    }

    ctx.page.drawText(item.code, { x: colCode, y: ctx.y, size: rowSize, font, color: MEDIUM_GREY });
    drawTruncated(ctx.page, template?.description ?? '\u2014', colDesc, ctx.y, 195, rowSize, font, DARK_GREY);
    ctx.page.drawText(template?.unit ?? '\u2014', { x: colUnit, y: ctx.y, size: rowSize, font, color: MEDIUM_GREY });

    const qty = item.quantity ?? template?.quantity ?? 0;
    drawRight(ctx.page, String(qty), colQty + 40, ctx.y, rowSize, font, MEDIUM_GREY);
    drawRight(ctx.page, formatAED(item.rate), colRate + 60, ctx.y, rowSize, font, DARK_GREY);
    drawRight(ctx.page, formatAED(item.total), colTotal, ctx.y, rowSize, boldFont, BLACK);

    ctx.y -= 14;
  });

  // Gold line above total
  ctx = ensureSpace(ctx, 24);
  drawHorizontalLine(ctx, GOLD, 1.5);
  ctx.y -= 14;

  // Grand total row
  drawRight(ctx.page, 'TOTAL (AED)', colRate + 60, ctx.y, 9, boldFont, DARK_GREY);
  drawRight(ctx.page, formatAED(submission.total_quote_aed), colTotal, ctx.y, 10, boldFont, BLACK);
  ctx.y -= 24;

  // Thin grey line
  drawHorizontalLine(ctx, LIGHT_GREY, 0.5);
  ctx.y -= 18;

  // ---- SUBMISSION DETAILS ----
  ctx = ensureSpace(ctx, 60);
  ctx = drawSectionTitle(ctx, 'SUBMISSION DETAILS');

  drawLabelValue(ctx, 'Material Option:', materialLabel(submission.material_option), MARGIN_LEFT, pkgLabelW);
  drawLabelValue(ctx, 'Mobilisation Date:', formatDateOnly(submission.mobilisation_date), col2X, pkgLabelW);
  ctx.y -= 14;

  drawLabelValue(ctx, 'Crew Size:', String(submission.crew_size), MARGIN_LEFT, pkgLabelW);
  ctx.y -= 22;

  // Thin grey line
  drawHorizontalLine(ctx, LIGHT_GREY, 0.5);
  ctx.y -= 18;

  // ---- COMPLIANCE ----
  ctx = ensureSpace(ctx, 50);
  ctx = drawSectionTitle(ctx, 'COMPLIANCE');

  const yesStr = '\u2713 Confirmed';
  const noStr = '\u2717 Not Confirmed';

  drawLabelValue(ctx, 'MetaForge Portal:', submission.metaforge_confirmed ? yesStr : noStr, MARGIN_LEFT, pkgLabelW);
  drawLabelValue(ctx, 'Insurance (AED 2M):', submission.insurance_confirmed ? yesStr : noStr, col2X, pkgLabelW);
  ctx.y -= 22;

  // Thin grey line
  drawHorizontalLine(ctx, LIGHT_GREY, 0.5);
  ctx.y -= 18;

  // ---- COMMERCIAL TERMS ----
  if (commercialEntries.length > 0) {
    ctx = ensureSpace(ctx, 30 + commercialEntries.length * 14);
    ctx = drawSectionTitle(ctx, 'COMMERCIAL TERMS');

    commercialEntries.forEach(([key, value], idx) => {
      ctx = ensureSpace(ctx, 16);
      const num = `${idx + 1}. `;
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      const termText = `${num}${label} \u2014 ${String(value)}`;

      drawTruncated(ctx.page, termText, MARGIN_LEFT + 4, ctx.y, CONTENT_WIDTH - 8, 8, font, DARK_GREY);
      ctx.y -= 14;
    });

    ctx.y -= 8;
    drawHorizontalLine(ctx, LIGHT_GREY, 0.5);
    ctx.y -= 18;
  }

  // ---- FOOTER ----
  ctx = ensureSpace(ctx, 50);
  drawHorizontalLine(ctx, LIGHT_GREY, 0.5);
  ctx.y -= 14;

  const footerText1 = 'This document was generated from the Metamorphic Tender Portal.';
  const footerText2 = 'Submission is final and binding.';
  const footerText3 = `${COMPANY_NAME} \u00B7 Dubai, UAE`;

  const ft1w = font.widthOfTextAtSize(footerText1, 7);
  ctx.page.drawText(footerText1, {
    x: MARGIN_LEFT + (CONTENT_WIDTH - ft1w) / 2,
    y: ctx.y,
    size: 7,
    font,
    color: LIGHT_GREY,
  });
  ctx.y -= 11;

  const ft2w = font.widthOfTextAtSize(footerText2, 7);
  ctx.page.drawText(footerText2, {
    x: MARGIN_LEFT + (CONTENT_WIDTH - ft2w) / 2,
    y: ctx.y,
    size: 7,
    font,
    color: LIGHT_GREY,
  });
  ctx.y -= 13;

  const ft3w = boldFont.widthOfTextAtSize(footerText3, 7.5);
  ctx.page.drawText(footerText3, {
    x: MARGIN_LEFT + (CONTENT_WIDTH - ft3w) / 2,
    y: ctx.y,
    size: 7.5,
    font: boldFont,
    color: MEDIUM_GREY,
  });

  /* ---------------------------------------------------------------
     Serialize and return
     --------------------------------------------------------------- */

  const pdfBytes = await doc.save();
  const buffer = Buffer.from(pdfBytes);

  // Build filename: Submission-PKG-CODE-VendorName.pdf
  const safeVendorName = vendor.company_name.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '-');
  const filename = `Submission-${tender.package_code}-${safeVendorName}`;

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}.pdf"`,
    },
  });
}
