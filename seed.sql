-- SEED DATA: PKG-A Tender Config + 5 Vendors + Invites

-- 1. Insert PKG-A tender config
INSERT INTO tender_configs (
  id, package_code, package_name, project_name,
  form_schema, boq_template, closing_deadline, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'PKG-A',
  'Pool Shell Construction — Excavation to Waterproofing',
  'Pool Execution',
  '{
    "sections": [
      {
        "id": "company_info",
        "title": "Company Information",
        "description": "Verify your company details. Pre-filled fields can be corrected if needed.",
        "fields": [
          { "id": "company_name", "type": "text", "label": "Company Name", "required": true, "prefill_from_vendor": "company_name" },
          { "id": "trade_licence", "type": "text", "label": "Trade Licence Number", "required": true, "prefill_from_vendor": "trade_licence_number" },
          { "id": "contact_name", "type": "text", "label": "Contact Person", "required": true, "prefill_from_vendor": "contact_name" },
          { "id": "email", "type": "email", "label": "Email Address", "required": true, "prefill_from_vendor": "email" },
          { "id": "whatsapp", "type": "tel", "label": "WhatsApp Number", "required": true, "placeholder": "+971 XX XXX XXXX", "prefill_from_vendor": "whatsapp" }
        ]
      },
      {
        "id": "tender_details",
        "title": "Tender Submission Details",
        "fields": [
          {
            "id": "material_option", "type": "select", "label": "Material Supply Option", "required": true,
            "hint": "Select how you propose to handle material procurement for this package.",
            "options": [
              { "value": "labour_only", "label": "Labour Only — Metamorphic supplies all materials" },
              { "value": "labour_material", "label": "Labour + Material — Inclusive rate" }
            ]
          },
          { "id": "mobilisation_date", "type": "date", "label": "Proposed Mobilisation Date", "required": true, "hint": "Earliest date your crew can be on site." },
          { "id": "crew_size", "type": "number", "label": "Crew Size at Mobilisation", "required": true, "min": 1, "max": 200, "hint": "Number of workers on Day 1." }
        ]
      },
      {
        "id": "compliance",
        "title": "Compliance Declarations",
        "description": "Both declarations are mandatory for tender compliance.",
        "fields": [
          { "id": "metaforge_confirmed", "type": "checkbox", "label": "I confirm our company has active MetaForge portal access and will invoice exclusively through the portal.", "required": true },
          { "id": "insurance_confirmed", "type": "checkbox", "label": "I confirm our company holds valid Workers Compensation and Public Liability insurance with a minimum coverage of AED 2,000,000.", "required": true }
        ]
      }
    ]
  }'::jsonb,
  '[
    { "code": "A-001", "description": "Excavation — Bulk Cut to Pool Profile", "unit": "m³", "quantity": 120 },
    { "code": "A-002", "description": "Lean Concrete Blinding (75mm)", "unit": "m²", "quantity": 85 },
    { "code": "A-003", "description": "Steel Reinforcement — Supply, Cut & Fix", "unit": "kg", "quantity": 4200 },
    { "code": "A-004", "description": "Blockwork Walls to Pool Shell (200mm hollow)", "unit": "m²", "quantity": 95 },
    { "code": "A-005", "description": "Concrete Infill to Blockwork Cores", "unit": "m³", "quantity": 12 },
    { "code": "A-006", "description": "Waterproof Membrane — Supply & Apply", "unit": "m²", "quantity": 180 },
    { "code": "A-007", "description": "Backfill & Compaction", "unit": "m³", "quantity": 65 },
    { "code": "A-008", "description": "Site Clearance & Waste Removal", "unit": "LS", "quantity": 1 }
  ]'::jsonb,
  now() + interval '7 days',
  true
);

-- 2. Insert 5 vendors
INSERT INTO vendors (id, company_name, trade_licence_number, contact_name, email, whatsapp, tier, quality_score) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'Al Rashid Construction LLC', 'TL-DXB-2024-001', 'Ahmed Al Rashid', 'alrashid@test.com', '+971501234567', 'trial', 0.72),
  ('b0000000-0000-0000-0000-000000000002', 'Gulf Star Contracting', 'TL-DXB-2024-002', 'Faisal Khan', 'gulfstar@test.com', '+971502345678', 'preferred', 0.88),
  ('b0000000-0000-0000-0000-000000000003', 'Desert Palm Building Works', 'TL-DXB-2024-003', 'Omar Hassan', 'desertpalm@test.com', '+971503456789', 'strategic', 0.94),
  ('b0000000-0000-0000-0000-000000000004', 'Horizon Technical Services', 'TL-DXB-2024-004', 'Raj Patel', 'horizon@test.com', '+971504567890', 'trial', 0.65),
  ('b0000000-0000-0000-0000-000000000005', 'Atlas MEP Solutions', 'TL-DXB-2024-005', 'Samir Youssef', 'atlas@test.com', '+971505678901', 'preferred', 0.82);

-- 3. Generate invites for all 5 vendors
INSERT INTO vendor_tenders (vendor_id, tender_config_id, expires_at) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', now() + interval '24 hours'),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', now() + interval '24 hours'),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', now() + interval '24 hours'),
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', now() + interval '24 hours'),
  ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', now() + interval '24 hours');

-- 4. Output tokens
SELECT v.company_name, vt.token, vt.expires_at
FROM vendor_tenders vt
JOIN vendors v ON v.id = vt.vendor_id
WHERE vt.tender_config_id = 'a0000000-0000-0000-0000-000000000001'
ORDER BY v.company_name;
