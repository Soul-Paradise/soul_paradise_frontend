import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";
// Same check as lib/app-env.ts IS_STAGING (kept inline: this file runs before the app is compiled).
const IS_STAGING = process.env.NEXT_PUBLIC_APP_ENV?.trim().toLowerCase() === "staging";

function originOf(url: string | undefined, fallback: string): string {
  try {
    return new URL(url || fallback).origin;
  } catch {
    return new URL(fallback).origin;
  }
}

// Evaluated at build time (`next build`), so NEXT_PUBLIC_API_URL must be set
// in the build environment (it already is: the client bundle inlines it too).
const API_ORIGIN = originOf(process.env.NEXT_PUBLIC_API_URL, "http://localhost:8080/api/v1");
const ASSET_ORIGIN = originOf(process.env.NEXT_PUBLIC_ASSET_BASE, "https://storage.googleapis.com");
const GCS = "https://storage.googleapis.com";
const GOOGLE_ACCOUNTS = "https://accounts.google.com";

const unique = (xs: string[]) => [...new Set(xs)].join(" ");

/**
 * Content-Security-Policy.
 *
 * script-src uses 'unsafe-inline' rather than nonces: almost every page is
 * statically prerendered, and nonces require a proxy/middleware plus dynamic
 * rendering of every page (no static HTML / CDN caching). The remaining
 * directives still block framing, plugins, <base> hijacking, foreign form
 * posts and calls to unknown APIs. 'unsafe-eval' is only added for `next dev`.
 *
 * img-src allows any https: origin because hotel photos are hotlinked from
 * whichever supplier CDN the aggregator returns (travelapi, webbeds,
 * hyperguest, agoda, worldota, S3, ... - an open-ended set), plus Brandfetch
 * airline logos, GCS and OSM map tiles.
 */
const csp = [
  `default-src 'self'`,
  `script-src ${unique(["'self'", "'unsafe-inline'", GOOGLE_ACCOUNTS, ...(isDev ? ["'unsafe-eval'"] : [])])}`,
  `style-src 'self' 'unsafe-inline' ${GOOGLE_ACCOUNTS}`,
  `img-src 'self' data: blob: https:`,
  `media-src ${unique(["'self'", "blob:", GCS, ASSET_ORIGIN])}`,
  `font-src 'self' data:`,
  `connect-src ${unique([
    "'self'",
    API_ORIGIN,
    GOOGLE_ACCOUNTS,
    "https://nominatim.openstreetmap.org",
    ...(isDev ? ["ws:", "wss:"] : []),
  ])}`,
  `frame-src ${GOOGLE_ACCOUNTS} https://www.google.com https://maps.google.com https://www.openstreetmap.org`,
  `worker-src 'self' blob:`,
  `form-action 'self'`,
  `frame-ancestors 'none'`,
  `object-src 'none'`,
  `base-uri 'self'`,
  // Only when the API is https: on a local http API it would break fetches.
  ...(API_ORIGIN.startsWith("https://") ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" },
  // The staging copy is public but must stay out of search engines (see also
  // the robots meta in app/layout.tsx and app/robots.ts; lib/app-env.ts).
  ...(IS_STAGING ? [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] : []),
];

/**
 * NEXT_PUBLIC_MEDIA_BUCKET: the GCS bucket the backend uploads CMS media to
 * when it is not the prod one (staging: soul-paradise-staging-media). Accepts
 * "name" or "gs://name"; anything that is not a valid bucket name is ignored.
 */
function mediaBucket(raw: string | undefined): string | null {
  const name = (raw || "").trim().replace(/^gs:\/\//, "").replace(/\/+$/, "");
  return /^[a-z0-9][a-z0-9._-]{1,220}[a-z0-9]$/.test(name) ? name : null;
}

const MEDIA_BUCKET = mediaBucket(process.env.NEXT_PUBLIC_MEDIA_BUCKET);

// GCS buckets whose images go through next/image: the CMS media library
// (customer_trip_images, or NEXT_PUBLIC_MEDIA_BUCKET's bucket as well when set),
// legacy hero shots and stored airline logos.
// Videos (predefined_videos) and docs (guidelines-doc) never use the optimiser.
const IMAGE_BUCKETS = [
  ...new Set(["customer_trip_images", "static_hero_images", "airline_logos", ...(MEDIA_BUCKET ? [MEDIA_BUCKET] : [])]),
];

const assetHost = new URL(ASSET_ORIGIN);

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      ...IMAGE_BUCKETS.map((bucket) => ({
        protocol: "https" as const,
        hostname: "storage.googleapis.com",
        pathname: `/${bucket}/**`,
      })),
      // A CDN/custom domain in front of the buckets (NEXT_PUBLIC_ASSET_BASE).
      ...(assetHost.hostname !== "storage.googleapis.com"
        ? [{ protocol: assetHost.protocol === "http:" ? ("http" as const) : ("https" as const), hostname: assetHost.hostname }]
        : []),
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
