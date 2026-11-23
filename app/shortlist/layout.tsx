import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Shortlist - Soul Paradise Travels',
  description: 'Hotels you shortlisted on your Soul Paradise Travels account.',
  robots: { index: false, follow: false },
};

export default function ShortlistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
