'use client';

import { usePathname } from 'next/navigation';
import { Footer } from './Footer';

/**
 * Auth and onboarding routes are full-height, self-contained screens — a marketing
 * footer below them just adds a scrollbar to a page that should not scroll.
 *
 * Prefix-matched, not exact: these routes have children (/register/agent), and an
 * exact match silently let the footer back in on every nested one.
 */
const FOOTERLESS_ROUTES = [
  '/login',
  '/register', // covers /register/agent
  '/agent', // covers /agent/resubmit
];

export default function ConditionalFooter() {
  const pathname = usePathname();

  const hideFooter = FOOTERLESS_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (hideFooter) {
    return null;
  }

  return <Footer />;
}
