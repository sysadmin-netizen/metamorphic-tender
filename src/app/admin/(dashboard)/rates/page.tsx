export default function RatesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-100">Rate Intelligence</h1>
        <p className="mt-1 text-sm text-stone-500">Phase 7 feature</p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-lg border border-stone-700 bg-stone-800/50 py-24 px-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-stone-800 border border-stone-700 mb-6">
          <svg className="h-8 w-8 text-stone-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-stone-300">Rate intelligence coming soon.</h2>
        <p className="mt-2 max-w-md text-center text-sm text-stone-500">
          Aggregate rate analytics, benchmarking, and trend analysis across all tender submissions will be available in a future release.
        </p>
      </div>
    </div>
  );
}
