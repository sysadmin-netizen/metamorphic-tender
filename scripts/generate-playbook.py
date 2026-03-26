#!/usr/bin/env python3
"""
Metamorphic Tender Portal — User Playbook PDF Generator
Brand colours: Gold (#c9a84c), Dark (#1a1a1a), Stone (#fafaf9), Text (#1c1917)
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, HRFlowable, Image
)
from reportlab.pdfgen import canvas
from reportlab.lib import colors
import os
import datetime

# ═══════════════════════════════════════════
# BRAND COLOURS
# ═══════════════════════════════════════════
GOLD = HexColor("#c9a84c")
GOLD_LIGHT = HexColor("#fef3c7")
GOLD_HOVER = HexColor("#e0c872")
DARK = HexColor("#1a1a1a")
DARK_SURFACE = HexColor("#2a2a2a")
STONE = HexColor("#fafaf9")
TEXT_PRIMARY = HexColor("#1c1917")
TEXT_SECONDARY = HexColor("#78716c")
SUCCESS = HexColor("#166534")
SUCCESS_LIGHT = HexColor("#dcfce7")
WARNING = HexColor("#854d0e")
WARNING_LIGHT = HexColor("#fef9c3")
DANGER = HexColor("#991b1b")
DANGER_LIGHT = HexColor("#fee2e2")
BORDER = HexColor("#e7e5e4")
WHITE = HexColor("#ffffff")

PAGE_W, PAGE_H = A4
MARGIN = 20 * mm

# ═══════════════════════════════════════════
# STYLES
# ═══════════════════════════════════════════

style_cover_title = ParagraphStyle(
    "CoverTitle", fontName="Helvetica-Bold", fontSize=32,
    textColor=GOLD, alignment=TA_LEFT, leading=38, spaceAfter=8
)
style_cover_subtitle = ParagraphStyle(
    "CoverSubtitle", fontName="Helvetica", fontSize=14,
    textColor=white, alignment=TA_LEFT, leading=20, spaceAfter=4
)
style_cover_detail = ParagraphStyle(
    "CoverDetail", fontName="Helvetica", fontSize=10,
    textColor=HexColor("#a8a29e"), alignment=TA_LEFT, leading=14
)

style_h1 = ParagraphStyle(
    "H1", fontName="Helvetica-Bold", fontSize=22,
    textColor=GOLD, spaceAfter=10, spaceBefore=20, leading=28
)
style_h2 = ParagraphStyle(
    "H2", fontName="Helvetica-Bold", fontSize=16,
    textColor=TEXT_PRIMARY, spaceAfter=8, spaceBefore=14, leading=22
)
style_h3 = ParagraphStyle(
    "H3", fontName="Helvetica-Bold", fontSize=12,
    textColor=GOLD, spaceAfter=6, spaceBefore=10, leading=16
)
style_body = ParagraphStyle(
    "Body", fontName="Helvetica", fontSize=10,
    textColor=TEXT_PRIMARY, spaceAfter=6, leading=15
)
style_body_bold = ParagraphStyle(
    "BodyBold", fontName="Helvetica-Bold", fontSize=10,
    textColor=TEXT_PRIMARY, spaceAfter=6, leading=15
)
style_bullet = ParagraphStyle(
    "Bullet", fontName="Helvetica", fontSize=10,
    textColor=TEXT_PRIMARY, leftIndent=15, spaceAfter=4, leading=14,
    bulletIndent=5, bulletFontName="Helvetica-Bold", bulletColor=GOLD
)
style_note = ParagraphStyle(
    "Note", fontName="Helvetica-Oblique", fontSize=9,
    textColor=TEXT_SECONDARY, leftIndent=10, spaceAfter=6, leading=13
)
style_code = ParagraphStyle(
    "Code", fontName="Courier", fontSize=9,
    textColor=TEXT_PRIMARY, backColor=HexColor("#f5f5f4"),
    leftIndent=10, spaceAfter=6, leading=13, borderPadding=6
)
style_footer = ParagraphStyle(
    "Footer", fontName="Helvetica", fontSize=8,
    textColor=TEXT_SECONDARY, alignment=TA_CENTER
)
style_toc = ParagraphStyle(
    "TOC", fontName="Helvetica", fontSize=11,
    textColor=TEXT_PRIMARY, spaceAfter=8, leading=16, leftIndent=10
)
style_toc_section = ParagraphStyle(
    "TOCSection", fontName="Helvetica-Bold", fontSize=12,
    textColor=GOLD, spaceAfter=4, leading=18
)
style_callout = ParagraphStyle(
    "Callout", fontName="Helvetica-Bold", fontSize=10,
    textColor=DARK, spaceAfter=6, leading=14
)

# ═══════════════════════════════════════════
# CUSTOM PAGE TEMPLATES
# ═══════════════════════════════════════════

def draw_page_bg(canvas_obj, doc):
    """Standard page with dark header strip and gold accent line."""
    c = canvas_obj
    w, h = PAGE_W, PAGE_H

    # Top header strip
    c.setFillColor(DARK)
    c.rect(0, h - 18 * mm, w, 18 * mm, fill=1, stroke=0)

    # Gold accent line below header
    c.setStrokeColor(GOLD)
    c.setLineWidth(1.5)
    c.line(MARGIN, h - 18 * mm, w - MARGIN, h - 18 * mm)

    # Header text
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(MARGIN, h - 12 * mm, "METAMORPHIC DESIGN")

    c.setFillColor(HexColor("#a8a29e"))
    c.setFont("Helvetica", 8)
    c.drawRightString(w - MARGIN, h - 12 * mm, "Tender Portal - User Playbook")

    # Footer
    c.setStrokeColor(BORDER)
    c.setLineWidth(0.5)
    c.line(MARGIN, 12 * mm, w - MARGIN, 12 * mm)

    c.setFillColor(TEXT_SECONDARY)
    c.setFont("Helvetica", 7)
    c.drawString(MARGIN, 8 * mm, "Metamorphic Design FZ | Dubai, UAE")
    c.drawRightString(w - MARGIN, 8 * mm, f"Page {doc.page}")

    # Gold bottom accent
    c.setFillColor(GOLD)
    c.rect(0, 0, w, 2 * mm, fill=1, stroke=0)


def draw_cover_bg(canvas_obj, doc):
    """Full dark cover page."""
    c = canvas_obj
    w, h = PAGE_W, PAGE_H

    # Full dark background
    c.setFillColor(DARK)
    c.rect(0, 0, w, h, fill=1, stroke=0)

    # Gold accent strip at bottom
    c.setFillColor(GOLD)
    c.rect(0, 0, w, 4 * mm, fill=1, stroke=0)

    # Gold vertical line left accent
    c.setStrokeColor(GOLD)
    c.setLineWidth(3)
    c.line(MARGIN, 50 * mm, MARGIN, h - 40 * mm)

    # Company name top right
    c.setFillColor(HexColor("#78716c"))
    c.setFont("Helvetica", 8)
    c.drawRightString(w - MARGIN, h - 20 * mm, "METAMORPHIC DESIGN FZ")
    c.drawRightString(w - MARGIN, h - 25 * mm, "Ecstasy Holding L.L.C-FZ, Dubai")

    # Date bottom right
    c.setFillColor(HexColor("#a8a29e"))
    c.setFont("Helvetica", 9)
    today = datetime.date.today().strftime("%d.%m.%Y")
    c.drawRightString(w - MARGIN, 15 * mm, f"Version 1.0  |  {today}")
    c.drawString(MARGIN + 5 * mm, 15 * mm, "CONFIDENTIAL")


# ═══════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════

def gold_hr():
    return HRFlowable(width="100%", thickness=1, color=GOLD, spaceAfter=8, spaceBefore=8)

def thin_hr():
    return HRFlowable(width="100%", thickness=0.5, color=BORDER, spaceAfter=6, spaceBefore=6)

def callout_box(title, body_text, bg_color=GOLD_LIGHT, border_color=GOLD):
    """Create a highlighted callout box."""
    data = [[Paragraph(f"<b>{title}</b>", style_callout),
             Paragraph(body_text, style_body)]]
    t = Table(data, colWidths=[80, PAGE_W - 2 * MARGIN - 90])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg_color),
        ("BOX", (0, 0), (-1, -1), 1.5, border_color),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ]))
    return t

def info_table(rows, col_widths=None):
    """Create a styled data table."""
    if col_widths is None:
        col_widths = [PAGE_W - 2 * MARGIN]

    styled_rows = []
    for i, row in enumerate(rows):
        styled_row = []
        for cell in row:
            if i == 0:
                styled_row.append(Paragraph(f"<b>{cell}</b>",
                    ParagraphStyle("TH", fontName="Helvetica-Bold", fontSize=9,
                                   textColor=white, leading=13)))
            else:
                styled_row.append(Paragraph(str(cell),
                    ParagraphStyle("TD", fontName="Helvetica", fontSize=9,
                                   textColor=TEXT_PRIMARY, leading=13)))
        styled_rows.append(styled_row)

    t = Table(styled_rows, colWidths=col_widths, repeatRows=1)
    style_cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), DARK),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
        ("TOPPADDING", (0, 0), (-1, 0), 8),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 1), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]
    # Alternate row colours
    for i in range(1, len(rows)):
        if i % 2 == 0:
            style_cmds.append(("BACKGROUND", (0, i), (-1, i), HexColor("#f5f5f4")))
        else:
            style_cmds.append(("BACKGROUND", (0, i), (-1, i), WHITE))

    t.setStyle(TableStyle(style_cmds))
    return t

def step_box(number, title, description):
    """Numbered step with gold circle."""
    num_style = ParagraphStyle("StepNum", fontName="Helvetica-Bold", fontSize=14,
                                textColor=white, alignment=TA_CENTER, leading=18)
    title_style = ParagraphStyle("StepTitle", fontName="Helvetica-Bold", fontSize=11,
                                  textColor=TEXT_PRIMARY, leading=15)
    desc_style = ParagraphStyle("StepDesc", fontName="Helvetica", fontSize=9,
                                 textColor=TEXT_SECONDARY, leading=13)

    data = [[
        Paragraph(str(number), num_style),
        Paragraph(f"<b>{title}</b><br/>{description}", ParagraphStyle(
            "StepContent", fontName="Helvetica", fontSize=10,
            textColor=TEXT_PRIMARY, leading=14
        ))
    ]]
    t = Table(data, colWidths=[35, PAGE_W - 2 * MARGIN - 45])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, 0), GOLD),
        ("ROUNDEDCORNERS", [5, 5, 5, 5]),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (0, 0), 8),
        ("LEFTPADDING", (1, 0), (1, 0), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER),
    ]))
    return t


# ═══════════════════════════════════════════
# BUILD THE DOCUMENT
# ═══════════════════════════════════════════

def build_playbook():
    output_path = os.path.join(os.path.dirname(__file__), "..", "Metamorphic-Tender-Portal-Playbook.pdf")
    output_path = os.path.abspath(output_path)

    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=MARGIN,
        rightMargin=MARGIN,
        topMargin=28 * mm,
        bottomMargin=20 * mm,
    )

    story = []

    # ═══════════════════════════════════════
    # COVER PAGE
    # ═══════════════════════════════════════
    story.append(Spacer(1, 60 * mm))
    story.append(Paragraph("METAMORPHIC<br/>TENDER PORTAL", style_cover_title))
    story.append(Spacer(1, 8 * mm))
    story.append(Paragraph("User Playbook", ParagraphStyle(
        "CoverPlay", fontName="Helvetica", fontSize=20,
        textColor=GOLD_HOVER, leading=26
    )))
    story.append(Spacer(1, 6 * mm))
    story.append(Paragraph(
        "Complete guide for Admin users and Vendor operators.<br/>"
        "Covers tender creation, vendor management, form submission,<br/>"
        "AI scoring, rate intelligence, and system administration.",
        style_cover_subtitle
    ))
    story.append(Spacer(1, 15 * mm))
    story.append(Paragraph(
        "Prepared for: Metamorphic Design FZ (Ecstasy Holding L.L.C-FZ)<br/>"
        "System: MetaForge ERP Ecosystem<br/>"
        "Active Sites: 17+ across UAE",
        style_cover_detail
    ))
    story.append(PageBreak())

    # ═══════════════════════════════════════
    # TABLE OF CONTENTS
    # ═══════════════════════════════════════
    story.append(Paragraph("TABLE OF CONTENTS", style_h1))
    story.append(gold_hr())

    toc_items = [
        ("1", "System Overview", "Architecture, users, and access model"),
        ("2", "Getting Started", "Login, dashboard navigation, and first steps"),
        ("3", "Creating a Tender", "Package selection, form builder, BOQ setup"),
        ("4", "Managing Invitations", "Quick links, bulk invites, re-issue, CSV export"),
        ("5", "Vendor Form Experience", "What vendors see, how they submit, edge cases"),
        ("6", "Reviewing Submissions", "Comparison table, individual viewer, print/PDF"),
        ("7", "AI Scoring Engine", "How scoring works, running scores, awarding"),
        ("8", "Rate Intelligence", "BOQ rate database, benchmarks, outlier detection"),
        ("9", "Vendor Management", "Vendor list, search, CSV import, tiers"),
        ("10", "Security & Access Control", "Three-gate model, token security, audit log"),
        ("11", "Commercial Terms Reference", "Standard terms applied to all tenders"),
        ("12", "Troubleshooting", "Common issues and solutions"),
        ("A", "Appendix: Package Reference", "PKG-A through PKG-D specifications"),
    ]

    for num, title, desc in toc_items:
        story.append(Paragraph(
            f"<b>{num}.</b>&nbsp;&nbsp;&nbsp;<b>{title}</b> &mdash; <i>{desc}</i>",
            style_toc
        ))

    story.append(PageBreak())

    # ═══════════════════════════════════════
    # SECTION 1: SYSTEM OVERVIEW
    # ═══════════════════════════════════════
    story.append(Paragraph("1. SYSTEM OVERVIEW", style_h1))
    story.append(gold_hr())
    story.append(Paragraph(
        "The Metamorphic Tender Portal is a web-based procurement system designed for "
        "Metamorphic Design FZ. It manages the complete vendor tender pipeline for pool "
        "and landscape construction across 17+ active sites in the UAE.",
        style_body
    ))
    story.append(Spacer(1, 4 * mm))

    story.append(Paragraph("Two User Types", style_h2))
    story.append(info_table([
        ["User", "Access Method", "Capabilities"],
        ["Admin (Internal)", "Password login at /admin", "Create tenders, manage vendors, review submissions, run AI scoring, export data"],
        ["Vendor (External)", "Unique token link (/t/xxx)", "Fill tender form, submit BOQ rates, view receipt. No login required."],
    ], [60, 90, PAGE_W - 2 * MARGIN - 160]))

    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph("Technology Stack", style_h2))
    story.append(info_table([
        ["Component", "Technology", "Purpose"],
        ["Frontend", "Next.js 15 + TypeScript", "Server-rendered pages, fast load times"],
        ["Database", "Supabase (PostgreSQL)", "Managed database with row-level security"],
        ["Styling", "Tailwind CSS v4", "Gold + dark theme, mobile-first responsive"],
        ["Hosting", "Vercel", "Global CDN, automatic deployments"],
        ["PDF Generation", "pdf-lib (server-side)", "Direct PDF download, no browser dependency"],
    ], [70, 90, PAGE_W - 2 * MARGIN - 170]))

    story.append(PageBreak())

    # ═══════════════════════════════════════
    # SECTION 2: GETTING STARTED
    # ═══════════════════════════════════════
    story.append(Paragraph("2. GETTING STARTED", style_h1))
    story.append(gold_hr())

    story.append(Paragraph("Admin Login", style_h2))
    story.append(step_box(1, "Navigate to the portal",
        "Open your browser and go to the portal URL. You will be automatically redirected to the login page."))
    story.append(Spacer(1, 3 * mm))
    story.append(step_box(2, "Enter the admin password",
        "Type the shared admin password and click Sign In. The session lasts 24 hours."))
    story.append(Spacer(1, 3 * mm))
    story.append(step_box(3, "Explore the dashboard",
        "The dashboard shows active tenders, submission counts, vendor stats, and quick actions."))
    story.append(Spacer(1, 4 * mm))

    story.append(Paragraph("Dashboard Layout", style_h2))
    story.append(Paragraph(
        "The admin panel has a fixed sidebar on the left with four main sections:",
        style_body
    ))
    story.append(info_table([
        ["Menu Item", "Purpose"],
        ["Dashboard", "Overview stats: total tenders, vendors, submissions, active packages"],
        ["Tenders", "Create/edit tender packages, view submissions, manage invitations"],
        ["Vendors", "View vendor list, search, import via CSV, manage tiers"],
        ["Rates", "BOQ rate intelligence database with Min/Median/Max benchmarks"],
    ], [80, PAGE_W - 2 * MARGIN - 90]))

    story.append(Spacer(1, 4 * mm))
    story.append(callout_box("TIP",
        "On mobile or tablet, the sidebar collapses into a hamburger menu. "
        "Tap the menu icon in the top-left to access navigation."))

    story.append(PageBreak())

    # ═══════════════════════════════════════
    # SECTION 3: CREATING A TENDER
    # ═══════════════════════════════════════
    story.append(Paragraph("3. CREATING A TENDER", style_h1))
    story.append(gold_hr())

    story.append(Paragraph("Package Selection", style_h2))
    story.append(Paragraph(
        "When creating a new tender, you start by selecting a predefined package from the dropdown. "
        "This auto-fills all fields including scope, BOQ template, job sequence, and project details.",
        style_body
    ))
    story.append(Spacer(1, 2 * mm))
    story.append(info_table([
        ["Package", "Name", "Job Sequence", "Scope"],
        ["PKG-A", "Civil Base: Blockwork & Steel", "JS01 - JS04", "Excavation, blockwork, reinforcement, waterproofing"],
        ["PKG-B", "Gunite & MEP Rough-In", "JS05", "Gunite spray, MEP rough-in, curing"],
        ["PKG-C", "Pool Tiling & Water Feature", "JS06", "Tiling, mosaic, water features, coping"],
        ["PKG-D", "Pumproom MEP & Commissioning", "JS07 - JS14", "Pumproom install, pipework, commissioning"],
        ["Custom", "User-defined package", "Custom", "Blank template for custom packages"],
    ], [50, 100, 60, PAGE_W - 2 * MARGIN - 220]))

    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph("Form Builder", style_h2))
    story.append(Paragraph(
        "The visual form builder lets you configure the vendor submission form without any JSON or code. "
        "Each section contains fields that vendors will fill out.",
        style_body
    ))
    story.append(Spacer(1, 2 * mm))
    story.append(Paragraph("<bullet>&bull;</bullet> <b>Add Section</b> - Create a new form section (e.g., Company Info, Compliance)", style_bullet))
    story.append(Paragraph("<bullet>&bull;</bullet> <b>Add Field</b> - Add fields within a section (text, email, number, date, select, checkbox)", style_bullet))
    story.append(Paragraph("<bullet>&bull;</bullet> <b>Reorder</b> - Use up/down arrows to rearrange fields", style_bullet))
    story.append(Paragraph("<bullet>&bull;</bullet> <b>Required toggle</b> - Mark fields as mandatory for submission", style_bullet))
    story.append(Paragraph("<bullet>&bull;</bullet> <b>Prefill from vendor</b> - Auto-populate from vendor database", style_bullet))

    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph("BOQ Template", style_h2))
    story.append(Paragraph(
        "The BOQ (Bill of Quantities) table defines the line items that vendors will price. "
        "Each row has a code, description, unit, and quantity. Units are selectable from a "
        "dropdown (m2, m3, kg, LS, nr, LM, ton, etc.).",
        style_body
    ))
    story.append(Spacer(1, 2 * mm))
    story.append(callout_box("IMPORTANT",
        "Quantities can be locked (admin sets them) or vendor-editable (vendor assesses on site). "
        "Toggle this in Project Details when creating the tender."))

    story.append(PageBreak())

    # ═══════════════════════════════════════
    # SECTION 4: MANAGING INVITATIONS
    # ═══════════════════════════════════════
    story.append(Paragraph("4. MANAGING INVITATIONS", style_h1))
    story.append(gold_hr())

    story.append(Paragraph("Quick Link Generation", style_h2))
    story.append(Paragraph(
        "The fastest way to get a tender link to a vendor. No vendor pre-registration needed.",
        style_body
    ))
    story.append(step_box(1, "Go to Invite Management",
        "Open a tender and click 'Manage Invites'."))
    story.append(Spacer(1, 3 * mm))
    story.append(step_box(2, "Fill optional fields",
        "Enter company name, contact name, and WhatsApp number. All fields are optional."))
    story.append(Spacer(1, 3 * mm))
    story.append(step_box(3, "Click Generate Link",
        "A unique tender URL is created instantly. The link is auto-copied to your clipboard."))
    story.append(Spacer(1, 3 * mm))
    story.append(step_box(4, "Share via WhatsApp or email",
        "Paste the link directly into a WhatsApp chat, email, or any messaging app."))

    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph("Bulk Invites (Registered Vendors)", style_h2))
    story.append(Paragraph(
        "Click 'Generate Invites (All Vendors)' to create links for all active vendors in the database. "
        "Each vendor gets a unique token link with a 24-hour expiry.",
        style_body
    ))

    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph("Actions Available", style_h2))
    story.append(info_table([
        ["Action", "Description", "When to Use"],
        ["Copy Link", "Copies vendor's tender URL to clipboard", "Anytime you need to re-share a link"],
        ["Re-issue", "Generates new token, new 24h expiry", "When a link has expired or been opened but not submitted"],
        ["Download CSV", "Exports all invites with links", "For bulk distribution via WhatsApp/email tools"],
    ], [70, 130, PAGE_W - 2 * MARGIN - 210]))

    story.append(Spacer(1, 4 * mm))
    story.append(callout_box("NOTE",
        "Re-issue is only available for 'expired' or 'opened' status invites. "
        "Submitted invites cannot be re-issued - the vendor has already submitted."))

    story.append(PageBreak())

    # ═══════════════════════════════════════
    # SECTION 5: VENDOR FORM EXPERIENCE
    # ═══════════════════════════════════════
    story.append(Paragraph("5. VENDOR FORM EXPERIENCE", style_h1))
    story.append(gold_hr())

    story.append(Paragraph(
        "This section describes what vendors see when they open a tender link. "
        "Understanding this helps you guide vendors through the process.",
        style_body
    ))

    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph("Three-Gate Access Control", style_h2))
    story.append(Paragraph(
        "Every vendor link passes through three security checks before showing the form:",
        style_body
    ))
    story.append(info_table([
        ["Gate", "Check", "If Failed"],
        ["Gate 1", "Is the token valid?", "Shows 'Invalid Link' page"],
        ["Gate 2", "Is the link expired? Is the tender closed?", "Shows 'Link Expired' or 'Tender Closed' page"],
        ["Gate 3", "Has the vendor already submitted?", "Shows read-only submission receipt"],
    ], [50, 120, PAGE_W - 2 * MARGIN - 180]))

    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph("What Vendors See", style_h2))
    story.append(Paragraph("<bullet>&bull;</bullet> <b>Dark header</b> with package name, project details, and live countdown timer", style_bullet))
    story.append(Paragraph("<bullet>&bull;</bullet> <b>Commercial terms</b> in a collapsible accordion (collapsed on mobile)", style_bullet))
    story.append(Paragraph("<bullet>&bull;</bullet> <b>Pre-filled company info</b> from vendor database (if registered)", style_bullet))
    story.append(Paragraph("<bullet>&bull;</bullet> <b>BOQ table</b> where they enter rates per line item", style_bullet))
    story.append(Paragraph("<bullet>&bull;</bullet> <b>Running total</b> that updates as they type (sticky on mobile)", style_bullet))
    story.append(Paragraph("<bullet>&bull;</bullet> <b>Compliance checkboxes</b> for MetaForge portal and insurance", style_bullet))
    story.append(Paragraph("<bullet>&bull;</bullet> <b>Submit button</b> with loading state and one-click protection", style_bullet))

    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph("Auto-Save & Recovery", style_h2))
    story.append(Paragraph(
        "The form automatically saves progress to the browser every 500ms. If a vendor accidentally "
        "closes the tab, their progress is restored when they reopen the link. A toast notification "
        "confirms: 'Your progress has been restored.'",
        style_body
    ))

    story.append(Spacer(1, 4 * mm))
    story.append(callout_box("MOBILE",
        "Vendors on construction sites will typically use phones. The form is fully mobile-optimised: "
        "single column, 44px touch targets, BOQ renders as cards (not table), sticky total bar."))

    story.append(PageBreak())

    # ═══════════════════════════════════════
    # SECTION 6: REVIEWING SUBMISSIONS
    # ═══════════════════════════════════════
    story.append(Paragraph("6. REVIEWING SUBMISSIONS", style_h1))
    story.append(gold_hr())

    story.append(Paragraph("Comparison Table", style_h2))
    story.append(Paragraph(
        "Navigate to a tender's Submissions page to see all vendors side-by-side. "
        "The comparison table shows each BOQ line item with vendor rates, plus totals, "
        "material options, and compliance flags.",
        style_body
    ))

    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph("Individual Submission Viewer", style_h2))
    story.append(Paragraph(
        "Click on any vendor name in the submissions list to view their full submission document. "
        "This shows the branded Metamorphic Design letterhead with all details.",
        style_body
    ))

    story.append(Spacer(1, 3 * mm))
    story.append(Paragraph("Print & Download", style_h2))
    story.append(info_table([
        ["Button", "Action", "Output"],
        ["Print", "Opens browser print dialog", "Sends to printer or Save as PDF via browser"],
        ["Download PDF", "Server generates PDF file", "Direct .pdf download to your computer"],
        ["Export CSV", "Downloads comparison data", "Spreadsheet-ready .csv file"],
    ], [70, 120, PAGE_W - 2 * MARGIN - 200]))

    story.append(Spacer(1, 4 * mm))
    story.append(callout_box("TIP",
        "The Print and Download PDF both produce the exact same document layout. "
        "Use Print for quick office copies, Download PDF for sharing via email or archiving."))

    story.append(PageBreak())

    # ═══════════════════════════════════════
    # SECTION 7: AI SCORING ENGINE
    # ═══════════════════════════════════════
    story.append(Paragraph("7. AI SCORING ENGINE", style_h1))
    story.append(gold_hr())

    story.append(Paragraph(
        "The scoring engine is a weighted mathematical algorithm (no external AI service required). "
        "It ranks vendors based on three dimensions:",
        style_body
    ))

    story.append(Spacer(1, 3 * mm))
    story.append(info_table([
        ["Dimension", "Weight", "Formula", "Max Score"],
        ["Price Score", "40%", "Lowest quote / Vendor quote x 100", "100"],
        ["Quality Score", "35%", "MetaForge(+15) + Insurance(+15) + Quality(x50) + DDA(+10)", "100"],
        ["Tier Score", "25%", "Trial=25, Preferred=65, Strategic=100", "100"],
    ], [70, 45, 170, PAGE_W - 2 * MARGIN - 295]))

    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph("Composite Score = (Price x 0.40) + (Quality x 0.35) + (Tier x 0.25)",
        style_code))

    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph("How to Run Scoring", style_h2))
    story.append(step_box(1, "Open Submissions page",
        "Navigate to the tender's submissions page."))
    story.append(Spacer(1, 3 * mm))
    story.append(step_box(2, "Click 'Run AI Scoring'",
        "The system calculates scores for all submissions instantly."))
    story.append(Spacer(1, 3 * mm))
    story.append(step_box(3, "Review ranked shortlist",
        "Vendors are ranked by composite score. The top vendor shows 'RECOMMENDED' badge."))
    story.append(Spacer(1, 3 * mm))
    story.append(step_box(4, "Click 'Award' to confirm",
        "Award button appears next to each vendor. Click to confirm the winning vendor."))

    story.append(Spacer(1, 4 * mm))
    story.append(callout_box("RULE",
        "If fewer than 2 compliant submissions are received, do not score. "
        "Consider re-tendering or direct negotiation. Awards above AED 500,000 require "
        "explicit sign-off from management.",
        WARNING_LIGHT, HexColor("#854d0e")))

    story.append(PageBreak())

    # ═══════════════════════════════════════
    # SECTION 8: RATE INTELLIGENCE
    # ═══════════════════════════════════════
    story.append(Paragraph("8. RATE INTELLIGENCE", style_h1))
    story.append(gold_hr())

    story.append(Paragraph(
        "The Rate Intelligence module builds a rolling database of BOQ rates from all tender submissions. "
        "This data improves cost estimation accuracy over time.",
        style_body
    ))

    story.append(Spacer(1, 3 * mm))
    story.append(Paragraph("How Rates are Calculated", style_h2))
    story.append(Paragraph("<bullet>&bull;</bullet> <b>Extract</b> - All line-item rates from all submissions are collected", style_bullet))
    story.append(Paragraph("<bullet>&bull;</bullet> <b>Outlier Detection</b> - Rates above 1.5x or below 0.5x the median are flagged", style_bullet))
    story.append(Paragraph("<bullet>&bull;</bullet> <b>Benchmark</b> - Median of non-outlier rates becomes the benchmark", style_bullet))
    story.append(Paragraph("<bullet>&bull;</bullet> <b>Band Construction</b> - Min / Median / Max recorded per line item", style_bullet))

    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph("Viewing Rate Data", style_h2))
    story.append(Paragraph(
        "Navigate to the Rates page from the sidebar. Filter by package code to see "
        "benchmarks for specific trade packages. The table shows each BOQ line item with "
        "its rate band (Min, Median, Max), sample size, and outlier count.",
        style_body
    ))

    story.append(Spacer(1, 4 * mm))
    story.append(callout_box("NOTE",
        "Rate data is populated when you run AI scoring from a tender's submissions page. "
        "Each tender cycle updates the database, building intelligence over time."))

    story.append(PageBreak())

    # ═══════════════════════════════════════
    # SECTION 9: VENDOR MANAGEMENT
    # ═══════════════════════════════════════
    story.append(Paragraph("9. VENDOR MANAGEMENT", style_h1))
    story.append(gold_hr())

    story.append(Paragraph("Vendor Tiers", style_h2))
    story.append(info_table([
        ["Tier", "Description", "Scoring Bonus"],
        ["Trial", "New vendor, first engagement", "Base (25 pts)"],
        ["Preferred", "Proven track record, reliable", "+40 pts (65 total)"],
        ["Strategic", "Top-tier partner, priority allocation", "+75 pts (100 total)"],
    ], [70, 160, PAGE_W - 2 * MARGIN - 240]))

    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph("CSV Import", style_h2))
    story.append(Paragraph(
        "Bulk-import vendors via CSV upload. Required columns: company_name, contact_name. "
        "Optional: email, whatsapp, trade_licence_number, tier. "
        "The system auto-deduplicates on (company_name + email) pairs.",
        style_body
    ))

    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph("Search & Filter", style_h2))
    story.append(Paragraph(
        "The vendor list supports real-time search across company name, contact name, and email. "
        "Results are paginated for performance with 10,000+ vendor databases.",
        style_body
    ))

    story.append(PageBreak())

    # ═══════════════════════════════════════
    # SECTION 10: SECURITY
    # ═══════════════════════════════════════
    story.append(Paragraph("10. SECURITY & ACCESS CONTROL", style_h1))
    story.append(gold_hr())

    story.append(Paragraph(
        "The system is designed with security-first principles. Vendor pages never expose "
        "internal data, and all sensitive operations happen server-side.",
        style_body
    ))

    story.append(Spacer(1, 3 * mm))
    story.append(Paragraph("Key Security Features", style_h2))
    story.append(Paragraph("<bullet>&bull;</bullet> <b>128-bit token entropy</b> - Links are computationally impossible to guess", style_bullet))
    story.append(Paragraph("<bullet>&bull;</bullet> <b>Server-side rendering</b> - Vendor pages use service_role; browser never talks to database", style_bullet))
    story.append(Paragraph("<bullet>&bull;</bullet> <b>No referrer leaks</b> - Vendor pages set no-referrer policy to prevent token exposure", style_bullet))
    story.append(Paragraph("<bullet>&bull;</bullet> <b>Server-side BOQ recalculation</b> - All totals verified on server; client values ignored", style_bullet))
    story.append(Paragraph("<bullet>&bull;</bullet> <b>One submission only</b> - Database constraint prevents duplicate submissions", style_bullet))
    story.append(Paragraph("<bullet>&bull;</bullet> <b>Full audit trail</b> - Every action logged: opens, submissions, rejections, errors", style_bullet))
    story.append(Paragraph("<bullet>&bull;</bullet> <b>Schema snapshots</b> - Each submission stores the exact form/BOQ at time of submission", style_bullet))
    story.append(Paragraph("<bullet>&bull;</bullet> <b>HTTP security headers</b> - X-Frame-Options DENY, nosniff, strict referrer policy", style_bullet))

    story.append(PageBreak())

    # ═══════════════════════════════════════
    # SECTION 11: COMMERCIAL TERMS
    # ═══════════════════════════════════════
    story.append(Paragraph("11. COMMERCIAL TERMS REFERENCE", style_h1))
    story.append(gold_hr())

    story.append(Paragraph(
        "The following commercial terms are applied to ALL tenders by default. "
        "They are displayed to vendors on the tender form and included in every submission document.",
        style_body
    ))

    story.append(Spacer(1, 3 * mm))
    story.append(info_table([
        ["Term", "Value", "Notes"],
        ["Payment Terms", "Net-7 from client receipt", "Milestone-based only"],
        ["Retention", "10%", "Held until snag sign-off"],
        ["Liquidated Damages", "AED 500/day", "Referenced in all award notifications"],
        ["Cash Advance", "Zero - no exceptions", "Hard rule, never override"],
        ["Insurance Minimum", "AED 2,000,000", "WC + Public Liability"],
        ["Defect Liability", "12 months", "From practical completion"],
        ["Invoicing", "MetaForge portal only", "Paper invoices rejected"],
        ["Quality Min Score", "0.85", "To remain on preferred roster"],
        ["Site Access", "MetaForge task unlock only", "Communicated to every vendor"],
    ], [85, 95, PAGE_W - 2 * MARGIN - 190]))

    story.append(PageBreak())

    # ═══════════════════════════════════════
    # SECTION 12: TROUBLESHOOTING
    # ═══════════════════════════════════════
    story.append(Paragraph("12. TROUBLESHOOTING", style_h1))
    story.append(gold_hr())

    story.append(info_table([
        ["Issue", "Cause", "Solution"],
        ["Vendor says link expired", "24h token expiry passed", "Go to Invite Management, click Re-issue for that vendor"],
        ["Vendor says 'Already Submitted'", "They submitted and revisited the link", "This is correct. Show them the receipt page with their data."],
        ["Vendor can't see the form on mobile", "Browser zoom or old browser", "Ensure they use Chrome/Safari. Form is mobile-optimised."],
        ["'Tender Closed' showing early", "Closing deadline has passed", "Check tender deadline in admin. Extend if needed."],
        ["Scores show 0 for quality", "Vendor didn't check compliance boxes", "Quality score depends on MetaForge + Insurance confirmations"],
        ["Download PDF shows error", "Server-side generation failed", "Try again. If persistent, check Vercel function logs."],
        ["Admin login not working", "Wrong password or expired session", "Use the correct admin password. Sessions last 24h."],
        ["CSV import shows duplicates", "Same company_name + email exists", "Duplicates are auto-detected and skipped with a badge."],
        ["Countdown shows wrong time", "Timezone mismatch", "All times are in GST (UTC+4). Verify your deadline."],
    ], [85, 85, PAGE_W - 2 * MARGIN - 180]))

    story.append(PageBreak())

    # ═══════════════════════════════════════
    # APPENDIX A: PACKAGE REFERENCE
    # ═══════════════════════════════════════
    story.append(Paragraph("APPENDIX A: PACKAGE REFERENCE", style_h1))
    story.append(gold_hr())

    packages = [
        ("PKG-A", "Civil Base: Blockwork & Steel", "JS01 - JS04", "None (first package)",
         [
             "Excavation - bulk cut to pool profile",
             "Lean concrete blinding (75mm)",
             "Steel reinforcement - supply, cut & fix",
             "Blockwork walls to pool shell (200mm hollow)",
             "Concrete infill to blockwork cores",
             "Waterproof membrane - supply & apply",
             "Backfill and compaction",
             "Site clearance and waste removal",
         ]),
        ("PKG-B", "Gunite & MEP Rough-In", "JS05", "PKG-A waterproofing complete",
         [
             "Gunite application to pool shell",
             "MEP rough-in coordination",
             "Pipe penetrations and sleeves",
             "Curing and surface preparation",
         ]),
        ("PKG-C", "Pool Tiling & Water Feature Finishing", "JS06", "PKG-B gunite complete and cured",
         [
             "Pool tiling - supply and install",
             "Mosaic and feature tiling",
             "Water feature finishing",
             "Coping stone installation",
             "Grouting and sealant application",
         ]),
        ("PKG-D", "Pumproom MEP & Commissioning", "JS07 - JS14", "PKG-C tiling complete, pool filled",
         [
             "Pumproom equipment installation",
             "Pipework connection - pumproom to pool shell",
             "Electrical connection - panels, VFDs, automation",
             "Control system programming and integration",
             "Pressure testing and leak detection",
             "Chemical balance and water treatment setup",
             "Final commissioning and handover",
         ]),
    ]

    for code, name, js, deps, scope in packages:
        story.append(Paragraph(f"{code} - {name}", style_h2))
        story.append(Paragraph(f"<b>Job Sequence:</b> {js}&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;<b>Dependencies:</b> {deps}", style_body))
        story.append(Paragraph("<b>Scope Items:</b>", style_body_bold))
        for item in scope:
            story.append(Paragraph(f"<bullet>&bull;</bullet> {item}", style_bullet))
        story.append(thin_hr())
        story.append(Spacer(1, 2 * mm))

    # ═══════════════════════════════════════
    # FINAL PAGE
    # ═══════════════════════════════════════
    story.append(PageBreak())
    story.append(Spacer(1, 80 * mm))
    story.append(Paragraph("END OF PLAYBOOK", ParagraphStyle(
        "EndTitle", fontName="Helvetica-Bold", fontSize=20,
        textColor=GOLD, alignment=TA_CENTER, leading=28
    )))
    story.append(Spacer(1, 8 * mm))
    story.append(Paragraph(
        "For support, contact the Metamorphic Design accounts team.<br/>"
        "System issues: check Vercel deployment logs and Supabase dashboard.",
        ParagraphStyle("EndBody", fontName="Helvetica", fontSize=10,
                       textColor=TEXT_SECONDARY, alignment=TA_CENTER, leading=14)
    ))
    story.append(Spacer(1, 15 * mm))
    story.append(HRFlowable(width="40%", thickness=2, color=GOLD, spaceAfter=8, spaceBefore=8))
    story.append(Paragraph(
        "Metamorphic Design FZ | Ecstasy Holding L.L.C-FZ | Dubai, UAE",
        ParagraphStyle("EndFooter", fontName="Helvetica", fontSize=8,
                       textColor=TEXT_SECONDARY, alignment=TA_CENTER, leading=12)
    ))

    # ═══════════════════════════════════════
    # BUILD
    # ═══════════════════════════════════════
    doc.build(
        story,
        onFirstPage=draw_cover_bg,
        onLaterPages=draw_page_bg,
    )

    print(f"\nPlaybook generated: {output_path}")
    print(f"Pages: {doc.page}")
    return output_path


if __name__ == "__main__":
    path = build_playbook()
