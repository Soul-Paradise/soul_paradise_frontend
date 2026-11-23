/**
 * Deployment flags, read at build time (NEXT_PUBLIC_* values are inlined).
 *
 * NEXT_PUBLIC_APP_ENV=staging marks the staging copy of the site: no indexing
 * (robots meta, X-Robots-Tag, robots.txt) and a visible environment banner.
 * NEXT_PUBLIC_SITE_URL is the public origin used for canonical/og:url.
 *
 * next.config.ts repeats the staging check inline because it runs before the
 * app is compiled; keep the two in step.
 */

export const IS_STAGING = process.env.NEXT_PUBLIC_APP_ENV?.trim().toLowerCase() === 'staging';

const DEFAULT_SITE_URL = 'https://soulparadisetravels.com';

function siteOrigin(raw: string | undefined): string {
  if (!raw?.trim()) return DEFAULT_SITE_URL;
  try {
    return new URL(raw.trim()).origin;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

/** Public origin of this deployment, without a trailing slash. */
export const SITE_URL = siteOrigin(process.env.NEXT_PUBLIC_SITE_URL);

/** Height the staging banner reserves at the top (the --staging-h CSS variable). */
export const STAGING_BANNER_HEIGHT = '1.75rem';
