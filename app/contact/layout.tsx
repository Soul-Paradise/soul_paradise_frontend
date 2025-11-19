import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us - Soul Paradise Travels',
  description: 'Get in touch with Soul Paradise Travels. Contact us via phone, WhatsApp, email, or visit our office in Jalandhar, Punjab for all your travel needs.',
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
