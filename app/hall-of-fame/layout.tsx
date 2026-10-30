import type { Metadata } from 'next';

// Title, description and the share image come from the CMS (page.tsx
// generateMetadata); only the fixed keywords live here.
export const metadata: Metadata = {
  keywords: 'travel gallery, customer reviews, travel photos, Soul Paradise testimonials, Dubai travel, Kerala tours, Rajasthan trips, Northeast India, travel memories',
};

export default function HallOfFameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
