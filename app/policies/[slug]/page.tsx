import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { FileText } from 'lucide-react';
import { LegalPage } from '@/components/Page';
import { SYSTEM_PATHS, getLegalDocument, getLegalDocuments, legalMetadata } from '@/lib/legal-api';

/**
 * Rendered per request: a page cached as 200 would outlive the policy being
 * unpublished or deleted in the admin panel (see CUSTOM_FETCH_OPTS).
 */
export const dynamic = 'force-dynamic';

/** Custom policies an admin adds in the admin panel, served at /policies/<slug>. */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return legalMetadata(SYSTEM_PATHS[slug] ? null : await getLegalDocument(slug));
}

export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Built-in policies keep their own routes.
  if (SYSTEM_PATHS[slug]) redirect(SYSTEM_PATHS[slug]);

  const [doc, related] = await Promise.all([getLegalDocument(slug), getLegalDocuments()]);
  if (!doc) notFound();
  return <LegalPage doc={doc} related={related} icon={FileText} />;
}
