'use client';

import { usePathname } from 'next/navigation';
import { Footer } from './Footer';

export default function ConditionalFooter() {
  const pathname = usePathname();

  // Don't show footer on login and register pages
  const hideFooter = pathname === '/login' || pathname === '/register';

  if (hideFooter) {
    return null;
  }

  return <Footer />;
}
