'use client';

import { useState } from 'react';
import { forgetAirlineLogos, useAirlineLogos } from '@/lib/airline-logos';

interface AirlineLogoProps {
  /** IATA airline code, e.g. "6E". */
  code: string;
  /** Airline name, for the image's alt text. */
  name?: string;
  /** Box height in px; wide logos get up to 2.25x that in width. */
  size: number;
  /** Shown when no logo source works for this airline (the code badge). */
  fallback: React.ReactNode;
  /** Widest a logo may be, relative to `size` (wordmarks are very wide). */
  maxAspect?: number;
  className?: string;
}

/**
 * Logo URLs that failed this visit (e.g. a brand Brandfetch doesn't have), so
 * the next card for the same airline goes straight to its fallback instead of
 * flashing through a failed request again.
 */
const failedThisVisit = new Set<string>();

/**
 * The airline's logo, sized to fit a `size`-tall box without distortion.
 * Sources are tried in order - Brandfetch hotlink, then our stored copy - and
 * the fallback badge shows when none of them loads.
 */
export function AirlineLogo({ code, name, size, fallback, maxAspect = 2.25, className = '' }: AirlineLogoProps) {
  const logos = useAirlineLogos();
  // Bumped on each failure so the component re-picks its source.
  const [, setFailures] = useState(0);
  const logo = logos?.[code?.toUpperCase()];

  // Map still loading: hold the badge's space so nothing jumps.
  if (!logos) return <div aria-hidden="true" className="flex-shrink-0" style={{ width: size, height: size }} />;
  if (!logo) return <>{fallback}</>;

  const src = [logo.bf, logo.url].find((u): u is string => !!u && !failedThisVisit.has(u));
  if (!src) return <>{fallback}</>;

  // Our stored logo has a known size: reserve the exact box. A Brandfetch
  // hotlink doesn't: fixed height, natural width up to maxAspect once loaded.
  const isStored = src === logo.url;
  const known = isStored && logo.w > 0 && logo.h > 0;
  const width = known ? Math.round(size * Math.min(Math.max(logo.w / logo.h, 1), maxAspect)) : undefined;
  return (
    <div
      className={`flex flex-shrink-0 items-center justify-center ${className}`}
      style={{ width, minWidth: known ? undefined : size, maxWidth: Math.round(size * maxAspect), height: size }}
      title={name}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- small logos, cached by URL; Brandfetch must be hotlinked as-is */}
      <img
        key={src}
        src={src}
        alt={name ? `${name} logo` : `${code} logo`}
        width={known ? logo.w : undefined}
        height={known ? logo.h : undefined}
        loading="lazy"
        decoding="async"
        draggable={false}
        // Brandfetch requires the Referer (origin) on hotlinked logos.
        referrerPolicy="strict-origin-when-cross-origin"
        onError={() => {
          failedThisVisit.add(src);
          // Our stored copy failing means the saved map is stale; a Brandfetch
          // miss (404 / rate limit) just means: use the fallback.
          if (isStored) forgetAirlineLogos();
          setFailures((n) => n + 1);
        }}
        className="max-h-full max-w-full object-contain"
      />
    </div>
  );
}
