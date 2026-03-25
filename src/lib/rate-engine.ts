/* ---------------------------------------------------------------
   Phase 7: Rate Intelligence Engine
   Builds a rate database from tender submissions by aggregating
   rates across vendors, detecting outliers, and computing benchmarks.
   --------------------------------------------------------------- */

/* ---------------------------------------------------------------
   Types
   --------------------------------------------------------------- */

export interface RateSubmissionInput {
  vendor_id: string;
  boq_data: { code: string; rate: number; total: number; quantity?: number }[];
}

export interface BoqTemplateItem {
  code: string;
  description: string;
  unit: string;
  quantity: number;
}

export interface RateEntry {
  line_item_code: string;
  line_item_description: string;
  unit: string;
  rate_min: number;
  rate_median: number;
  rate_max: number;
  outlier_count: number;
  sample_size: number;
}

/* ---------------------------------------------------------------
   Helpers
   --------------------------------------------------------------- */

/** Compute the median of a sorted array (must have at least 1 element). */
function computeMedian(sorted: number[]): number {
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

/* ---------------------------------------------------------------
   Main function
   --------------------------------------------------------------- */

/**
 * Build a rate database from a set of submissions against a BOQ template.
 *
 * For each BOQ line item:
 * 1. Collect all submitted rates (excluding zero rates)
 * 2. Compute the median of all rates
 * 3. Flag outliers: rates > 1.5x or < 0.5x the median
 * 4. Compute benchmark stats from non-outlier rates
 */
export function buildRateDatabase(
  submissions: RateSubmissionInput[],
  boqTemplate: BoqTemplateItem[],
): RateEntry[] {
  const results: RateEntry[] = [];

  for (const templateItem of boqTemplate) {
    // Collect all non-zero rates for this line item
    const allRates: number[] = [];
    for (const sub of submissions) {
      const boqEntry = sub.boq_data.find((item) => item.code === templateItem.code);
      if (boqEntry && boqEntry.rate > 0) {
        allRates.push(boqEntry.rate);
      }
    }

    if (allRates.length === 0) {
      // No valid rates submitted for this item
      results.push({
        line_item_code: templateItem.code,
        line_item_description: templateItem.description,
        unit: templateItem.unit,
        rate_min: 0,
        rate_median: 0,
        rate_max: 0,
        outlier_count: 0,
        sample_size: 0,
      });
      continue;
    }

    const sorted = [...allRates].sort((a, b) => a - b);
    const overallMedian = computeMedian(sorted);

    // Identify outliers: rates > 1.5x median or < 0.5x median
    const outlierLow = overallMedian * 0.5;
    const outlierHigh = overallMedian * 1.5;

    let outlierCount = 0;
    const nonOutlierRates: number[] = [];

    for (const rate of sorted) {
      if (rate < outlierLow || rate > outlierHigh) {
        outlierCount++;
      } else {
        nonOutlierRates.push(rate);
      }
    }

    // Compute benchmark stats from non-outlier rates
    // If all rates are outliers, fall back to all rates
    const benchmarkRates = nonOutlierRates.length > 0 ? nonOutlierRates : sorted;
    const benchmarkSorted = [...benchmarkRates].sort((a, b) => a - b);

    results.push({
      line_item_code: templateItem.code,
      line_item_description: templateItem.description,
      unit: templateItem.unit,
      rate_min: benchmarkSorted[0],
      rate_median: computeMedian(benchmarkSorted),
      rate_max: benchmarkSorted[benchmarkSorted.length - 1],
      outlier_count: outlierCount,
      sample_size: allRates.length,
    });
  }

  return results;
}
