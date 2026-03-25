export const APP_NAME = 'Metamorphic Tender Portal';
export const COMPANY_NAME = 'Metamorphic Design FZ';
export const TIMEZONE = 'Asia/Dubai';
export const TIMEZONE_LABEL = 'GST';
export const MAX_PAYLOAD_SIZE = 262144; // 256KB
export const TOKEN_EXPIRY_HOURS = 24;
export const RATE_LIMIT_WINDOW_MS = 60000;
export const RATE_LIMIT_MAX_INVALID = 20;
export const ADMIN_SESSION_COOKIE = 'admin_session';
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24; // 24 hours

export const STATUS_COLORS = {
  invited: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  opened: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  submitted: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  expired: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
} as const;

export const TIER_COLORS = {
  trial: { bg: 'bg-stone-50', text: 'text-stone-700' },
  preferred: { bg: 'bg-amber-50', text: 'text-amber-700' },
  strategic: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
} as const;

export const PAGE_SIZE = 20;

export const NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin', icon: 'grid' },
  { label: 'Tenders', href: '/admin/tenders', icon: 'file-text' },
  { label: 'Vendors', href: '/admin/vendors', icon: 'users' },
  { label: 'Rates', href: '/admin/rates', icon: 'bar-chart' },
] as const;

export const DEFAULT_COMMERCIAL_TERMS = JSON.stringify(
  {
    payment_terms: 'Net 60 days from invoice date',
    retention: '10% until practical completion',
    performance_bond: '10% of contract value',
    advance_payment_guarantee: '100% of advance amount',
    defects_liability_period: '12 months from practical completion',
    price_validity: '90 days from submission deadline',
    currency: 'AED',
    tax: 'Exclusive of VAT (5%)',
  },
  null,
  2,
);
