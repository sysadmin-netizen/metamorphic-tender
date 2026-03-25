/* ---------------------------------------------------------------
   Phase 5: AI Scoring Engine
   Calculates price, quality, and tier scores for tender submissions.
   --------------------------------------------------------------- */

import type { VendorTier } from '@/lib/types/database';

/* ---------------------------------------------------------------
   Types
   --------------------------------------------------------------- */

export interface ScoringSubmission {
  id: string;
  vendor_tender_id: string;
  vendor_id: string;
  total_quote_aed: number;
  metaforge_confirmed: boolean;
  insurance_confirmed: boolean;
  boq_data: { code: string; rate: number; total: number; quantity?: number }[];
}

export interface ScoringVendor {
  id: string;
  company_name: string;
  tier: VendorTier;
  quality_score: number;
  is_dda_approved: boolean;
  metaforge_confirmed: boolean;
}

export interface ScoredSubmission {
  vendor_tender_id: string;
  vendor_id: string;
  vendor_name: string;
  total_quote_aed: number;
  price_score: number;
  quality_score: number;
  tier_score: number;
  composite_score: number;
  flags: string[];
}

/* ---------------------------------------------------------------
   Helpers
   --------------------------------------------------------------- */

/** Compute the median of an array of numbers (must have at least 1 element). */
function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

/** Map vendor tier to a 0-100 score. */
function tierToScore(tier: VendorTier): number {
  switch (tier) {
    case 'trial':
      return 25;
    case 'preferred':
      return 65;
    case 'strategic':
      return 100;
    default:
      return 0;
  }
}

/* ---------------------------------------------------------------
   Main scoring function
   --------------------------------------------------------------- */

const PRICE_WEIGHT = 0.40;
const QUALITY_WEIGHT = 0.35;
const TIER_WEIGHT = 0.25;

export function calculateScores(
  submissions: ScoringSubmission[],
  vendors: ScoringVendor[],
): ScoredSubmission[] {
  if (submissions.length === 0) return [];

  const vendorMap = new Map<string, ScoringVendor>();
  for (const v of vendors) {
    vendorMap.set(v.id, v);
  }

  // ---- Price scoring ----
  const quotes = submissions.map((s) => s.total_quote_aed);
  const lowestQuote = Math.min(...quotes);
  const medianQuote = median(quotes);
  const outlierThreshold = medianQuote * 1.3; // 30% above median

  // ---- Build scored results ----
  const results: ScoredSubmission[] = [];

  for (const sub of submissions) {
    const vendor = vendorMap.get(sub.vendor_id);
    const vendorName = vendor?.company_name ?? sub.vendor_id.slice(0, 8);
    const flags: string[] = [];

    // --- Price score (0-100, 40% weight) ---
    let priceScore: number;
    if (sub.total_quote_aed <= 0) {
      priceScore = 0;
      flags.push('Zero or negative total quote');
    } else if (sub.total_quote_aed > outlierThreshold) {
      priceScore = Math.min(50, (lowestQuote / sub.total_quote_aed) * 100);
      flags.push('Above Market Rate (>30% above median)');
    } else {
      priceScore = (lowestQuote / sub.total_quote_aed) * 100;
    }

    // --- Quality score (0-100, 35% weight) ---
    let qualityScore = 0;

    // MetaForge confirmed: +15 pts
    if (sub.metaforge_confirmed) {
      qualityScore += 15;
    } else {
      flags.push('MetaForge Not Confirmed');
    }

    // Insurance confirmed: +15 pts
    if (sub.insurance_confirmed) {
      qualityScore += 15;
    } else {
      flags.push('Insurance Not Confirmed');
    }

    // Past quality_score from vendor record: scaled 0-50 pts
    if (vendor) {
      const vendorQuality = Math.max(0, Math.min(1, vendor.quality_score));
      qualityScore += vendorQuality * 50;
    }

    // DDA approved: +10 pts
    if (vendor?.is_dda_approved) {
      qualityScore += 10;
    }

    // Cap at 100
    qualityScore = Math.min(100, qualityScore);

    // --- Tier score (0-100, 25% weight) ---
    const tierScore = vendor ? tierToScore(vendor.tier) : 0;

    // --- Check for zero-rate BOQ items ---
    const zeroRateCodes: string[] = [];
    for (const item of sub.boq_data) {
      if (item.rate === 0) {
        zeroRateCodes.push(item.code);
      }
    }
    if (zeroRateCodes.length > 0) {
      flags.push(`Zero Rates: ${zeroRateCodes.join(', ')}`);
    }

    // --- Composite score ---
    const compositeScore =
      priceScore * PRICE_WEIGHT +
      qualityScore * QUALITY_WEIGHT +
      tierScore * TIER_WEIGHT;

    results.push({
      vendor_tender_id: sub.vendor_tender_id,
      vendor_id: sub.vendor_id,
      vendor_name: vendorName,
      total_quote_aed: sub.total_quote_aed,
      price_score: Math.round(priceScore * 100) / 100,
      quality_score: Math.round(qualityScore * 100) / 100,
      tier_score: tierScore,
      composite_score: Math.round(compositeScore * 100) / 100,
      flags,
    });
  }

  // Sort by composite score descending
  results.sort((a, b) => b.composite_score - a.composite_score);

  return results;
}
