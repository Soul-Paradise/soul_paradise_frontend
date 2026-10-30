import type { Metadata } from 'next';
import { Lock } from 'lucide-react';
import { LegalPage } from '@/components/Page';
import { getLegalDocument, getLegalDocuments, legalMetadata } from '@/lib/legal-api';
import { getSiteContent } from '@/lib/site-content';

// Copy lives in the database (admin panel → Policies); see lib/legal-api.ts.
const SLUG = 'privacy-policy';

export async function generateMetadata(): Promise<Metadata> {
  return legalMetadata(await getLegalDocument(SLUG));
}

export default async function PrivacyPolicyPage() {
  const [doc, related, site] = await Promise.all([getLegalDocument(SLUG), getLegalDocuments(), getSiteContent('global')]);
  // getLegalDocument always returns the bundled copy for built-in pages.
  return <LegalPage doc={doc!} related={related} contact={site.global.contact} heroImage={site.global.images?.pageHeroes?.policies} icon={Lock} />;
}
