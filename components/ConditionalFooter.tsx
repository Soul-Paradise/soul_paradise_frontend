'use client';

import { usePathname } from 'next/navigation';
import { Footer } from './Footer';
import type { GlobalContent } from '@/lib/site-content-shared';

/**
 * Auth and onboarding routes are full-height, self-contained screens - a marketing
 * footer below them just adds a scrollbar to a page that should not scroll.
 *
 * Prefix-matched, not exact: these routes have children (/register/agent), and an
 * exact match silently let the footer back in on every nested one.
 */
const FOOTERLESS_ROUTES = [
  '/login',
  '/register', // covers /register/agent
  '/agent', // covers /agent/resubmit
  '/forgot-password',
  '/reset-password',
];

/** `global` is fetched by the root layout (site-wide footer copy + contact details). */
export default function ConditionalFooter({ global }: { global: GlobalContent }) {
  const pathname = usePathname();

  const hideFooter = FOOTERLESS_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (hideFooter) {
    return null;
  }

  return <Footer footer={global.footer} contact={global.contact} />;
}
