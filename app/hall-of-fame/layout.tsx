import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hall of Fame - Soul Paradise Travels',
  description: 'Celebrating our valued customers and their unforgettable travel experiences. Browse through memories captured during amazing journeys with Soul Paradise across Dubai, Kerala, Rajasthan, Northeast India, and more destinations.',
  keywords: 'travel gallery, customer reviews, travel photos, Soul Paradise testimonials, Dubai travel, Kerala tours, Rajasthan trips, Northeast India, travel memories',
  openGraph: {
    title: 'Hall of Fame - Soul Paradise Travels',
    description: 'Celebrating our valued customers and their unforgettable travel experiences with Soul Paradise.',
    type: 'website',
    images: [
      {
        url: '/kerala_1.jpg',
        width: 1200,
        height: 630,
        alt: 'Soul Paradise Travel Gallery',
      },
    ],
  },
};

export default function HallOfFameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
