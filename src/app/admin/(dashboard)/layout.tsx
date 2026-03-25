import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_SESSION_COOKIE } from '@/lib/constants';
import { AdminSidebar } from '@/components/admin/sidebar';

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
      <main className="ml-0 lg:ml-[260px] min-h-screen p-6">
        {children}
      </main>
    </div>
  );
}
