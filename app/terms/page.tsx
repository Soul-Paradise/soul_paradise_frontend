import type { Metadata } from 'next';
import { Scale } from 'lucide-react';
import { LegalPage } from '@/components/Page';
import { getLegalDocument, getLegalDocuments, legalMetadata } from '@/lib/legal-api';

// Copy lives in the database (admin panel → Policies); see lib/legal-api.ts.
const SLUG = 'terms';

export async function generateMetadata(): Promise<Metadata> {
  return legalMetadata(await getLegalDocument(SLUG));
}

export default async function TermsPage() {
  const [doc, related] = await Promise.all([getLegalDocument(SLUG), getLegalDocuments()]);
  // getLegalDocument always returns the bundled copy for built-in pages.
  return <LegalPage doc={doc!} related={related} icon={Scale} />;
}
