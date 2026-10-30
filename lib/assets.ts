/**
 * Static media lives in Google Cloud Storage, one bucket per kind:
 *   static_hero_images    page hero / banner backgrounds
 *   customer_trip_images  customer trip photos (Hall of Fame, galleries) + IATA logo
 *   predefined_videos     looping videos on the auth pages
 *
 * Set NEXT_PUBLIC_ASSET_BASE to put a CDN or custom domain in front of the
 * buckets without touching the call sites.
 */
const ASSET_BASE = (process.env.NEXT_PUBLIC_ASSET_BASE || 'https://storage.googleapis.com').replace(/\/$/, '');

const inBucket = (bucket: string) => (file: string) => `${ASSET_BASE}/${bucket}/${file}`;

export const heroImage = inBucket('static_hero_images');
export const tripImage = inBucket('customer_trip_images');
export const videoUrl = inBucket('predefined_videos');
