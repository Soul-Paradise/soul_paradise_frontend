import type { Metadata } from 'next';
import { ContactView } from '@/components/Contact/ContactView';
import { getSiteContent, heroMetadata } from '@/lib/site-content';

// Copy, contact details and section visibility come from the admin panel
// (Site Content → Contact, and the site-wide Contact details).
export async function generateMetadata(): Promise<Metadata> {
  const { sections } = await getSiteContent('contact');
  return heroMetadata(sections.hero, 'contact');
}

export default async function ContactPage() {
  const content = await getSiteContent('contact');
  return <ContactView content={content} />;
}
