/* ---------------------------------------------------------------
   Package Presets — Predefined PKG-A through PKG-D
   Used by the "New Tender" form for auto-fill and by the
   vendor submission forms for scope / BOQ structure.
   --------------------------------------------------------------- */

export interface PackagePresetBoqItem {
  code: string;
  description: string;
  unit: string;
  quantity: number;
}

export interface PackagePreset {
  code: string;
  name: string;
  job_sequence: string;
  scope_items: string[];
  default_boq: PackagePresetBoqItem[];
  dependencies: string;
  mobilisation_requirement: string;
  boq_qty_editable: boolean;
}

export const PACKAGE_PRESETS: readonly PackagePreset[] = [
  {
    code: 'PKG-A',
    name: 'Civil Base: Blockwork & Steel',
    job_sequence: 'JS01 \u2192 JS04',
    scope_items: [
      'Blockwork \u2014 pool shell walls, planter walls, raised beam walls',
      'Steel reinforcement \u2014 rebar tying, BRC mesh, starter bars, column cages',
      'Formwork & shuttering (all structural elements)',
      'Waterproofing membrane \u2014 pool shell & planter beds',
    ],
    default_boq: [
      { code: 'A-001', description: 'Blockwork \u2014 Pool Shell Walls', unit: 'SQM', quantity: 0 },
      { code: 'A-002', description: 'Blockwork \u2014 Planter Walls', unit: 'SQM', quantity: 0 },
      { code: 'A-003', description: 'Blockwork \u2014 Raised Beam Walls', unit: 'SQM', quantity: 0 },
      { code: 'A-004', description: 'Steel Reinforcement \u2014 Rebar Tying', unit: 'KG', quantity: 0 },
      { code: 'A-005', description: 'Steel Reinforcement \u2014 BRC Mesh Supply & Fix', unit: 'SQM', quantity: 0 },
      { code: 'A-006', description: 'Steel Reinforcement \u2014 Starter Bars & Column Cages', unit: 'KG', quantity: 0 },
      { code: 'A-007', description: 'Formwork & Shuttering', unit: 'SQM', quantity: 0 },
      { code: 'A-008', description: 'Waterproofing Membrane \u2014 Pool Shell', unit: 'SQM', quantity: 0 },
      { code: 'A-009', description: 'Waterproofing Membrane \u2014 Planter Beds', unit: 'SQM', quantity: 0 },
    ],
    dependencies: 'Excavation & PCC complete (JS01-JS02)',
    mobilisation_requirement: 'Within 24 hours of award',
    boq_qty_editable: true,
  },
  {
    code: 'PKG-B',
    name: 'Gunite & MEP Rough-In',
    job_sequence: 'JS05',
    scope_items: [
      'Gunite / shotcrete application \u2014 pool shell, spa, water features',
      'MEP rough-in \u2014 pipework, conduits, niches, embedded fittings',
      'Suction lines, return fittings, skimmer housings',
      'Pressure testing of all embedded lines (pre-gunite and post-gunite)',
      'Conduit runs for pool lighting and automation cabling',
    ],
    default_boq: [
      { code: 'B-001', description: 'Gunite / Shotcrete \u2014 Pool Shell', unit: 'SQM', quantity: 0 },
      { code: 'B-002', description: 'Gunite / Shotcrete \u2014 Spa', unit: 'SQM', quantity: 0 },
      { code: 'B-003', description: 'Gunite / Shotcrete \u2014 Water Features', unit: 'SQM', quantity: 0 },
      { code: 'B-004', description: 'MEP Rough-In \u2014 Pipework (Supply & Fix)', unit: 'LM', quantity: 0 },
      { code: 'B-005', description: 'MEP Rough-In \u2014 Conduits & Niches', unit: 'NOS', quantity: 0 },
      { code: 'B-006', description: 'Suction Lines & Return Fittings', unit: 'NOS', quantity: 0 },
      { code: 'B-007', description: 'Skimmer Housings (Supply & Install)', unit: 'NOS', quantity: 0 },
      { code: 'B-008', description: 'Pressure Testing \u2014 Pre-Gunite', unit: 'LS', quantity: 1 },
      { code: 'B-009', description: 'Pressure Testing \u2014 Post-Gunite', unit: 'LS', quantity: 1 },
      { code: 'B-010', description: 'Conduit Runs \u2014 Pool Lighting & Automation', unit: 'LM', quantity: 0 },
    ],
    dependencies: 'PKG-A waterproofing sign-off required before gunite commencement',
    mobilisation_requirement: 'Within 24 hours of award',
    boq_qty_editable: true,
  },
  {
    code: 'PKG-C',
    name: 'Pool Tiling & Water Feature Finishing',
    job_sequence: 'JS06',
    scope_items: [
      'Pool tile supply and installation \u2014 shell, coping, waterline',
      'Mosaic tiling \u2014 water features, spa, decorative elements',
      'Grouting and joint sealing',
      'Coping stone supply and installation',
      'Water feature finishing \u2014 spillways, weirs, scuppers',
    ],
    default_boq: [
      { code: 'C-001', description: 'Pool Tile \u2014 Shell (Supply & Fix)', unit: 'SQM', quantity: 0 },
      { code: 'C-002', description: 'Pool Tile \u2014 Waterline Band', unit: 'LM', quantity: 0 },
      { code: 'C-003', description: 'Mosaic Tiling \u2014 Water Features', unit: 'SQM', quantity: 0 },
      { code: 'C-004', description: 'Mosaic Tiling \u2014 Spa', unit: 'SQM', quantity: 0 },
      { code: 'C-005', description: 'Coping Stone \u2014 Supply & Install', unit: 'LM', quantity: 0 },
      { code: 'C-006', description: 'Grouting & Joint Sealing', unit: 'SQM', quantity: 0 },
      { code: 'C-007', description: 'Water Feature Finishing \u2014 Spillways', unit: 'NOS', quantity: 0 },
      { code: 'C-008', description: 'Water Feature Finishing \u2014 Weirs & Scuppers', unit: 'NOS', quantity: 0 },
    ],
    dependencies: 'PKG-B gunite curing complete (min 28 days)',
    mobilisation_requirement: 'Within 48 hours of award',
    boq_qty_editable: true,
  },
  {
    code: 'PKG-D',
    name: 'Pumproom MEP & Commissioning',
    job_sequence: 'JS07 \u2192 JS14',
    scope_items: [
      'Pumproom equipment installation \u2014 pumps, filters, heaters, chemical dosing',
      'Pipework connection \u2014 pumproom to pool shell',
      'Electrical connection \u2014 panels, VFDs, automation controllers',
      'Control system programming and integration',
      'Pressure testing and leak detection',
      'Chemical balance and water treatment setup',
      'System commissioning and handover',
    ],
    default_boq: [
      { code: 'D-001', description: 'Pump Installation (Supply & Fix)', unit: 'NOS', quantity: 0 },
      { code: 'D-002', description: 'Filter Installation (Supply & Fix)', unit: 'NOS', quantity: 0 },
      { code: 'D-003', description: 'Heater Installation', unit: 'NOS', quantity: 0 },
      { code: 'D-004', description: 'Chemical Dosing System', unit: 'LS', quantity: 1 },
      { code: 'D-005', description: 'Pumproom Pipework', unit: 'LM', quantity: 0 },
      { code: 'D-006', description: 'Electrical Panel & VFDs', unit: 'LS', quantity: 1 },
      { code: 'D-007', description: 'Automation Controller & Programming', unit: 'LS', quantity: 1 },
      { code: 'D-008', description: 'Pressure Testing & Leak Detection', unit: 'LS', quantity: 1 },
      { code: 'D-009', description: 'Chemical Balance & Water Treatment', unit: 'LS', quantity: 1 },
      { code: 'D-010', description: 'System Commissioning & Handover', unit: 'LS', quantity: 1 },
    ],
    dependencies: 'PKG-C tiling complete, pool filled and cured',
    mobilisation_requirement: 'Within 72 hours of award',
    boq_qty_editable: false,
  },
] as const;

export type PackageCode = typeof PACKAGE_PRESETS[number]['code'];

/** Find a preset by its package code. Returns undefined for custom packages. */
export function findPreset(code: string): PackagePreset | undefined {
  return PACKAGE_PRESETS.find((p) => p.code === code);
}
