/**
 * Next.js loading UI for the vendor tender form page.
 * Shows a dark header placeholder + form skeleton during page load.
 */
export default function VendorTenderLoading() {
  return (
    <div className="min-h-screen" aria-busy="true" aria-label="Loading tender form">
      {/* Dark header placeholder */}
      <header className="w-full bg-[var(--bg-primary)] px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1 animate-pulse">
            <div className="h-5 w-56 rounded bg-stone-700" />
            <div className="mt-2 h-3 w-36 rounded bg-stone-800" />
          </div>
          <div className="flex flex-col items-start sm:items-end animate-pulse">
            <div className="mb-1 h-3 w-24 rounded bg-stone-800" />
            <div className="h-8 w-40 rounded bg-stone-700" />
          </div>
        </div>
      </header>

      {/* Form skeleton */}
      <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8 animate-pulse">
        {/* Vendor greeting */}
        <div className="mb-6">
          <div className="h-4 w-44 rounded bg-stone-200" />
        </div>

        {/* Commercial terms accordion skeleton */}
        <div className="mb-6 rounded-lg border border-stone-200 bg-white px-5 py-4">
          <div className="h-4 w-52 rounded bg-stone-200" />
        </div>

        {/* Form fields skeleton */}
        <div className="flex flex-col gap-5 rounded-lg border border-stone-200 bg-white p-5">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="h-3.5 w-28 rounded bg-stone-200" />
              <div className="h-10 w-full rounded bg-stone-100" />
            </div>
          ))}

          {/* BOQ table skeleton */}
          <div className="mt-4 overflow-hidden rounded-md border border-stone-200">
            <div className="bg-stone-50 px-4 py-3">
              <div className="h-4 w-40 rounded bg-stone-200" />
            </div>
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="flex items-center gap-4 border-t border-stone-100 px-4 py-3">
                <div className="h-3.5 w-8 rounded bg-stone-200" />
                <div className="h-3.5 flex-1 rounded bg-stone-200" />
                <div className="h-3.5 w-16 rounded bg-stone-200" />
                <div className="h-3.5 w-20 rounded bg-stone-200" />
              </div>
            ))}
          </div>

          {/* Submit button skeleton */}
          <div className="mt-4 flex justify-end">
            <div className="h-11 w-36 rounded-md bg-stone-200" />
          </div>
        </div>
      </main>
    </div>
  );
}
