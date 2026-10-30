import fallback from './legal-fallback.json';

/**
 * Legal pages (Terms, Privacy, Refund, custom policies) are edited by admins
 * and served by the backend. Pages re-fetch at most once a minute. If the API
 * is unreachable the three built-in pages fall back to the copy bundled with
 * the site, so a legal page never renders blank.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export interface LegalSubsection {
  title: string;
  content: string;
}

export interface LegalSection {
  title: string;
  paragraphs: string[];
  subsections: LegalSubsection[];
}

export interface LegalDocument {
  slug: string;
  title: string;
  description: string;
  metaDescription: string | null;
  sections: LegalSection[];
  helpTitle: string;
  helpText: string;
  path: string;
}

export interface LegalLink {
  slug: string;
  title: string;
  path: string;
}

/** Built-in documents and the routes they have always had. */
export const SYSTEM_PATHS: Record<string, string> = {
  terms: '/terms',
  'privacy-policy': '/privacy-policy',
  'refund-cancellation-policy': '/refund-cancellation-policy',
};

const FALLBACK = fallback as Record<string, Omit<LegalDocument, 'path'>>;

const fromFallback = (slug: string): LegalDocument | null => {
  const doc = FALLBACK[slug];
  return doc ? { ...doc, path: SYSTEM_PATHS[slug] } : null;
};

const FETCH_OPTS = { next: { revalidate: 60, tags: ['legal'] } };

/**
 * Custom policies are always fetched fresh. When a cached entry revalidates to
 * a 404, Next keeps serving the last good copy, so an unpublished or deleted
 * custom policy would otherwise stay online indefinitely. Built-in pages only
 * ever go 200 -> 200 (or to the bundled fallback), so they can be cached.
 */
const CUSTOM_FETCH_OPTS = { cache: 'no-store' } as const;

/** One published document, or null when a custom policy doesn't exist. */
export async function getLegalDocument(slug: string): Promise<LegalDocument | null> {
  try {
    const res = await fetch(`${API_BASE}/legal/${encodeURIComponent(slug)}`, SYSTEM_PATHS[slug] ? FETCH_OPTS : CUSTOM_FETCH_OPTS);
    if (res.ok) return (await res.json()) as LegalDocument;
    if (res.status !== 404) console.error(`Legal API ${slug}: HTTP ${res.status}`);
  } catch (err) {
    console.error(`Legal API ${slug} unreachable:`, err);
  }
  // A built-in page must always render, even if the API is down or the
  // document was unpublished by mistake. Custom policies simply 404.
  return fromFallback(slug);
}

/** Published documents for "Related policies". */
export async function getLegalDocuments(): Promise<LegalLink[]> {
  try {
    const res = await fetch(`${API_BASE}/legal`, FETCH_OPTS);
    if (res.ok) {
      const docs = (await res.json()) as LegalLink[];
      return docs.map(({ slug, title, path }) => ({ slug, title, path }));
    }
    console.error(`Legal API list: HTTP ${res.status}`);
  } catch (err) {
    console.error('Legal API list unreachable:', err);
  }
  return Object.keys(SYSTEM_PATHS).map((slug) => ({ slug, title: FALLBACK[slug].title, path: SYSTEM_PATHS[slug] }));
}

/** "Terms & Conditions - Soul Paradise Travels" + description for <head>. */
export function legalMetadata(doc: LegalDocument | null) {
  if (!doc) return { title: 'Policy not found - Soul Paradise Travels' };
  return {
    title: `${doc.title} - Soul Paradise Travels`,
    description: doc.metaDescription || doc.description,
  };
}
