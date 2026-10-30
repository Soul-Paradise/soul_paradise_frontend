import type { Metadata } from 'next';
import { RotateCcw } from 'lucide-react';
import { LegalPage } from '@/components/Page';
import { getLegalDocument, getLegalDocuments, legalMetadata } from '@/lib/legal-api';

// Copy lives in the database (admin panel → Policies); see lib/legal-api.ts.
const SLUG = 'refund-cancellation-policy';

export async function generateMetadata(): Promise<Metadata> {
  return legalMetadata(await getLegalDocument(SLUG));
}

export default async function RefundCancellationPolicyPage() {
  const [doc, related] = await Promise.all([getLegalDocument(SLUG), getLegalDocuments()]);
  // getLegalDocument always returns the bundled copy for built-in pages.
  return <LegalPage doc={doc!} related={related} icon={RotateCcw} />;
}
