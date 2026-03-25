import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_SESSION_COOKIE } from '@/lib/constants';
import { AdminSidebar } from '@/components/admin/sidebar';

/** Inline skeleton shown while page content streams in via Suspense. */
function PageFallback() {
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
      {/* Table skeleton */}
      <div className="flex flex-col gap-3">
        <div className="h-10 w-full rounded bg-stone-800" />
        <div className="h-10 w-full rounded bg-stone-800" />
        <div className="h-10 w-full rounded bg-stone-800" />
        <div className="h-10 w-4/5 rounded bg-stone-800" />
      </div>
    </div>
  );
}

/**
 * Authenticated admin layout.
 * Checks for the admin_session cookie; redirects to login if absent.
 * Renders the sidebar + main content area.
 */
export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_SESSION_COOKIE);

  if (!session) {
    redirect('/admin/login');
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-200">
      <AdminSidebar />
      <main className="ml-0 lg:ml-[260px] min-h-screen p-4 pt-[72px] sm:p-6 sm:pt-[72px] lg:pt-6">
        <Suspense fallback={<PageFallback />}>
          {children}
        </Suspense>
      </main>
    </div>
  );
}
