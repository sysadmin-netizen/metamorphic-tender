/* ---------------------------------------------------------------
   Metamorphic Tender Portal  --  Domain type definitions
   --------------------------------------------------------------- */

import type {
  TableRow,
  VendorTier,
  VendorTenderStatus,
  MaterialOption,
  BoqTemplateJson,
  BoqSubmissionItemJson,
  FormSchemaJson,
  CommercialTermsJson,
} from '@/lib/types/database';

// Re-export DB enum types for convenience
export type { VendorTier, VendorTenderStatus, MaterialOption };

// ---- Tender configuration (matches DB row) ----

export type TenderConfig = TableRow<'tender_configs'>;

// ---- BOQ line item (extracted from template JSON) ----

export interface BoqLineItem {
  code: string;
  description: string;
  unit: string;
  quantity: number;
}

// ---- Vendor (matches DB row) ----

export type Vendor = TableRow<'vendors'>;

// ---- Submission (matches DB row) ----

export type Submission = TableRow<'submissions'>;

// ---- Invite / vendor-tender (matches DB row) ----

export type Invite = TableRow<'vendor_tenders'>;

// ---- Stat cards ----

export interface StatItem {
  label: string;
  value: string | number;
  color?: string;
}

// ---- Admin tender card props ----

export interface TenderCardData {
  id: string;
  package_code: string;
  package_name: string;
  project_name: string;
  closing_deadline: string;
  is_active: boolean;
  is_archived: boolean;
  archived_at?: string | null;
  submission_count: number;
  invite_count: number;
}

// ---- Submission comparison view ----

export interface SubmissionComparisonRow {
  boq_code: string;
  description: string;
  unit: string;
  quantity: number;
  rates: Record<string, number>; // vendor_id -> rate
}

// Re-export JSON column types
export type {
  BoqTemplateJson,
  BoqSubmissionItemJson,
  FormSchemaJson,
  CommercialTermsJson,
};
