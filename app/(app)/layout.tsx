import { redirect } from 'next/navigation';

import { getSession } from '@/lib/auth';
import { Navbar } from '@/components/layout/Navbar';

// Single authenticated shell. One route group for all roles — Next.js forbids
// duplicate paths across route groups, and the Navbar adapts links by role.
// Per-path role access is enforced in middleware.ts.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/');

  return (
    <>
      <Navbar name={session.name} role={session.role} />
      <main className="mx-auto max-w-[1200px] px-4 py-6">{children}</main>
    </>
  );
}
