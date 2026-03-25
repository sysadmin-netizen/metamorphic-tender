/**
 * Next.js loading UI for the admin dashboard route group.
 * Automatically shown during page transitions between admin pages.
 */
export default function AdminDashboardLoading() {
  return (
    <div className="flex flex-col gap-6 animate-pulse" aria-busy="true" aria-label="Loading page">
      {/* Title bar skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-7 w-48 rounded bg-stone-800" />
        <div className="h-9 w-28 rounded bg-stone-800" />
      </div>

      {/* Stats row skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="h-24 rounded-lg bg-stone-800" />
        <div className="h-24 rounded-lg bg-stone-800" />
        <div className="h-24 rounded-lg bg-stone-800" />
      </div>

      {/* Table / content skeleton */}
      <div className="rounded-lg border border-stone-800 bg-stone-900/50">
        {/* Table header */}
        <div className="border-b border-stone-800 px-5 py-3">
          <div className="h-4 w-32 rounded bg-stone-800" />
        </div>
        {/* Table rows */}
        <div className="flex flex-col divide-y divide-stone-800/50">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4">
              <div className="h-4 w-4 rounded bg-stone-800" />
              <div className="h-4 flex-1 rounded bg-stone-800" />
              <div className="h-4 w-24 rounded bg-stone-800" />
              <div className="h-4 w-16 rounded bg-stone-800" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
