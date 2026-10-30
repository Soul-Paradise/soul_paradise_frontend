'use client';

import { createContext, useContext } from 'react';
import { hasImage, type SiteImages } from '@/lib/site-content-shared';

/**
 * GLOBAL.images (admin panel → Site Content → Site-wide images), provided by
 * the root layout so client components (navbar, auth screens, profile,
 * bookings) can use the logo and page heroes without fetching.
 */
const SiteImagesContext = createContext<SiteImages>({});

export function SiteImagesProvider({ images, children }: { images?: SiteImages; children: React.ReactNode }) {
  return <SiteImagesContext.Provider value={images ?? {}}>{children}</SiteImagesContext.Provider>;
}

export const useSiteImages = () => useContext(SiteImagesContext);

/**
 * The brand logo from the media library, or a text wordmark when none is set
 * (the code bundles no logo file). `tone` is the background it sits on.
 */
export function BrandLogo({
  className = 'h-12 w-auto',
  tone = 'light',
  draggable,
}: {
  /** Height classes apply to both the image and the wordmark. */
  className?: string;
  tone?: 'light' | 'dark';
  draggable?: boolean;
}) {
  const { logo } = useSiteImages();
  if (hasImage(logo)) {
    // eslint-disable-next-line @next/next/no-img-element -- admin-managed URL from any bucket path
    return <img src={logo} alt="Soul Paradise" draggable={draggable} className={className} />;
  }
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap font-extrabold leading-none tracking-tight ${
        tone === 'dark' ? 'text-white' : 'text-(--color-ink)'
      } ${className.replace(/\bw-auto\b/, '')}`}
      style={{ fontSize: '1.35rem' }}
      aria-label="Soul Paradise"
    >
      Soul<span className={tone === 'dark' ? 'text-sky-300' : 'text-(--color-links)'}>&nbsp;Paradise</span>
    </span>
  );
}
