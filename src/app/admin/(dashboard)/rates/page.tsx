import { createServiceClient } from '@/lib/supabase/server';

interface BoqRateRow {
  id: string;
  package_code: string;
  line_item_code: string;
  line_item_description: string;
  unit: string;
  rate_min: number;
  rate_median: number;
  rate_max: number;
  outlier_count: number;
  sample_size: number;
  tender_cycle_date: string;
}

export default async function RatesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = await searchParams;
  const filterPackage = typeof resolvedParams.package === 'string' ? resolvedParams.package : '';

  const supabase = createServiceClient();

  // Fetch all rates, optionally filtered by package_code
  let query = supabase
    .from('boq_rates')
    .select('*')
    .order('package_code', { ascending: true })
    .order('line_item_code', { ascending: true });

  if (filterPackage) {
    query = query.eq('package_code', filterPackage);
  }

  const { data: rates, error } = await query;

  // Get distinct package codes for filter
  const { data: allRates } = await supabase
    .from('boq_rates')
    .select('package_code');

  const packageCodes = [...new Set((allRates ?? []).map((r) => r.package_code))].sort();

  // Group rates by package code
  const groupedRates = new Map<string, BoqRateRow[]>();
  if (rates) {
    for (const rate of rates as BoqRateRow[]) {
      const existing = groupedRates.get(rate.package_code) ?? [];
      existing.push(rate);
      groupedRates.set(rate.package_code, existing);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-100">Rate Intelligence</h1>
        <p className="mt-1 text-sm text-stone-500">
          Aggregate rate analytics and benchmarking across tender submissions
        </p>
      </div>

      {/* Package filter */}
      <div className="flex items-center gap-3">
        <label htmlFor="pkg_filter" className="text-sm font-medium text-stone-400">
          Filter by Package:
        </label>
        <form method="GET" className="flex items-center gap-2">
          <select
            id="pkg_filter"
            name="package"
            defaultValue={filterPackage}
            className="rounded-md border border-stone-700 bg-stone-900 px-3 py-2 text-sm text-stone-200 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="">All Packages</option>
            {packageCodes.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-md bg-stone-700 px-3 py-2 text-sm font-medium text-stone-200 hover:bg-stone-600 transition-colors"
          >
            Apply
          </button>
        </form>
      </div>

      {/* Rate tables */}
      {error ? (
        <div className="rounded-md bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {error.message}
        </div>
      ) : groupedRates.size === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-stone-700 bg-stone-800/50 py-24 px-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-stone-800 border border-stone-700 mb-6">
            <svg className="h-8 w-8 text-stone-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-stone-300">No rate data available yet.</h2>
          <p className="mt-2 max-w-md text-center text-sm text-stone-500">
            Rate data is populated when you run the rate analysis from a tender&#39;s submissions page. Go to a tender with submissions and use the rate population feature.
          </p>
        </div>
      ) : (
        [...groupedRates.entries()].map(([pkgCode, items]) => (
          <section key={pkgCode} className="space-y-3">
            <h2 className="text-lg font-semibold text-amber-400">
              {pkgCode}
            </h2>
            <div className="overflow-x-auto rounded-lg border border-stone-700">
              <table className="w-full text-sm">
                <thead className="bg-stone-800/80 sticky top-0 z-10">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-stone-400 whitespace-nowrap">Line Item</th>
                    <th className="text-left px-4 py-3 font-medium text-stone-400 whitespace-nowrap">Unit</th>
                    <th className="text-right px-4 py-3 font-medium text-stone-400 whitespace-nowrap">Min (AED)</th>
                    <th className="text-right px-4 py-3 font-medium text-amber-400 whitespace-nowrap">Median (AED)</th>
                    <th className="text-right px-4 py-3 font-medium text-stone-400 whitespace-nowrap">Max (AED)</th>
                    <th className="text-right px-4 py-3 font-medium text-stone-400 whitespace-nowrap">Samples</th>
                    <th className="text-right px-4 py-3 font-medium text-stone-400 whitespace-nowrap">Outliers</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((rate, idx) => (
                    <tr
                      key={rate.id}
                      className={idx % 2 === 0 ? 'bg-stone-900' : 'bg-stone-900/50'}
                    >
                      <td className="px-4 py-2.5 text-stone-300 whitespace-nowrap">
                        <span className="font-mono text-xs text-stone-500 mr-2">{rate.line_item_code}</span>
                        {rate.line_item_description}
                      </td>
                      <td className="px-4 py-2.5 text-stone-400 whitespace-nowrap">{rate.unit}</td>
                      <td className="px-4 py-2.5 text-emerald-400 text-right tabular-nums">
                        {rate.rate_min.toLocaleString('en-AE', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-2.5 text-amber-400 text-right tabular-nums font-semibold">
                        {rate.rate_median.toLocaleString('en-AE', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-2.5 text-stone-300 text-right tabular-nums">
                        {rate.rate_max.toLocaleString('en-AE', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-2.5 text-stone-400 text-right tabular-nums">
                        {rate.sample_size}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">
                        {rate.outlier_count > 0 ? (
                          <span className="inline-flex items-center rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-400 border border-amber-500/30">
                            {rate.outlier_count}
                          </span>
                        ) : (
                          <span className="text-stone-500">0</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))
      )}
    </div>
  );
}
