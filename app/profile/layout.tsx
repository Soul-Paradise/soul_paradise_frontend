import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Profile - Soul Paradise Travels',
  description: 'Manage your Soul Paradise Travels account details and security settings.',
  robots: { index: false, follow: false },
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
