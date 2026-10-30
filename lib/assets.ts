/**
 * Looping videos on the auth pages, kept in the `predefined_videos` GCS
 * bucket. Images are NOT referenced from code: every image is managed in the
 * admin panel's Media Library and reaches the site through the site-content
 * API (GLOBAL.images and each page's sections).
 *
 * Set NEXT_PUBLIC_ASSET_BASE to put a CDN or custom domain in front of the
 * bucket without touching the call sites.
 */
const ASSET_BASE = (process.env.NEXT_PUBLIC_ASSET_BASE || 'https://storage.googleapis.com').replace(/\/$/, '');

export const videoUrl = (file: string) => `${ASSET_BASE}/predefined_videos/${file}`;
