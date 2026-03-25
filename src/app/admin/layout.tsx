import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin | Metamorphic Tender Portal',
};

/**
 * Shared admin layout shell.
 * Authentication gating lives in the (dashboard) route group layout
 * so that /admin/login remains accessible without a session.
 */
export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
