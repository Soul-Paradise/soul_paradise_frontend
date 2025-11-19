'use client';

import { usePathname } from 'next/navigation';
import { Navbar, NAV_ITEMS } from '@/components/Navbar';

/**
 * ConditionalNavbar Component
 *
 * Renders the navbar only on non-auth pages and adds appropriate padding
 * Auth pages include: login, register, forgot-password, reset-password, verify-email, verification-pending
 */
export default function ConditionalNavbar() {
  const pathname = usePathname();

  // Routes where navbar should NOT be displayed
  const authRoutes = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/verification-pending',
  ];

  // Check if current route is an auth route
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  if (isAuthRoute) {
    return null;
  }

  return (
    <>
      <Navbar items={NAV_ITEMS} />
      <div className="h-16" />
    </>
  );
}
