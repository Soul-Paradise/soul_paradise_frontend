/**
 * Server-side reader for the site-content CMS. Pages call
 * getSiteContent(page) and render only the sections present (hidden ones are
 * absent), in `order`. If the API can't be reached the bundled copy of the
 * seed text (lib/site-content-fallback.json, all sections visible, no image
 * URLs - images exist only in the media library) is used, so a page never
 * goes blank.
 */
import fallbackSeed from './site-content-fallback.json';
import type { GalleryImage, GlobalContent, HeroContent, SiteContent, SitePage } from './site-content-shared';

export * from './site-content-shared';
export { CmsIcon, RichText, iconFor as iconForName } from '@/components/SiteContent';
export { HeroSpacer } from '@/components/SiteContent/HeroSpacer';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
const FETCH_OPTS = { next: { revalidate: 60, tags: ['site-content'] } };

/** Page key in the API / seed ("hall_of_fame" -> "HALL_OF_FAME"). */
const SEED_PREFIX: Record<SitePage, string> = {
  home: 'HOME',
  about: 'ABOUT',
  services: 'SERVICES',
  contact: 'CONTACT',
  hall_of_fame: 'HALL_OF_FAME',
  global: 'GLOBAL',
};

const SEED = fallbackSeed as Record<string, unknown>;

function sectionsFromSeed(prefix: string) {
  const entries = Object.entries(SEED)
    .filter(([id]) => id.startsWith(`${prefix}.`))
    .map(([id, content]) => [id.slice(prefix.length + 1), content] as const);
  return { sections: Object.fromEntries(entries), order: entries.map(([k]) => k) };
}

function fallbackContent<P extends SitePage>(page: P): SiteContent<P> {
  const own = page === 'global' ? { sections: {}, order: [] } : sectionsFromSeed(SEED_PREFIX[page]);
  // No bundled photos: the gallery lives only in the media library.
  const gallery: GalleryImage[] | undefined = page === 'hall_of_fame' ? [] : undefined;
  return {
    page,
    sections: own.sections as SiteContent<P>['sections'],
    order: own.order,
    global: sectionsFromSeed('GLOBAL').sections as GlobalContent,
    gallery,
  };
}

export async function getSiteContent<P extends SitePage>(page: P): Promise<SiteContent<P>> {
  try {
    const res = await fetch(`${API_BASE}/site-content/${page}`, FETCH_OPTS);
    if (res.ok) {
      const data = (await res.json()) as SiteContent<P>;
      return { ...data, global: data.global ?? {}, order: data.order ?? Object.keys(data.sections ?? {}) };
    }
    console.error(`Site content API ${page}: HTTP ${res.status}`);
  } catch (err) {
    console.error(`Site content API ${page} unreachable:`, err);
  }
  return fallbackContent(page);
}

/** Page <title>/<meta description> from a hero section (falls back to the bundled copy). */
export function heroMetadata(hero: HeroContent | undefined, page: Exclude<SitePage, 'home' | 'global'>) {
  const h = hero ?? (SEED[`${SEED_PREFIX[page]}.hero`] as HeroContent);
  return { title: h.metaTitle, description: h.metaDescription };
}
