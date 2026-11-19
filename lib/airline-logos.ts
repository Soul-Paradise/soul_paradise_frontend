'use client';

import { useEffect, useState } from 'react';

/**
 * IATA code -> airline logo (stored in our GCS media bucket, mapped in the
 * `airlines` table). The whole map is one small request, fetched once per
 * visit and kept in localStorage for 12 hours, so every flight on every page
 * maps to its logo with a plain object lookup.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
const CACHE_KEY = 'sp:airlineLogos:v4';
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;

/** Sources in the order they're tried: `bf` (Brandfetch), `url` (stored), badge. */
export interface AirlineLogo {
  /** Brandfetch Logo API hotlink. */
  bf?: string;
  /** Our stored copy (GCS) - the fallback. */
  url?: string;
  /** Intrinsic size of `url`; 0 when there is none. */
  w: number;
  h: number;
}
export type AirlineLogoMap = Record<string, AirlineLogo>;

let current: AirlineLogoMap | null = null;
let inflight: Promise<AirlineLogoMap> | null = null;

function readCache(): AirlineLogoMap | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { at, logos } = JSON.parse(raw) as { at: number; logos: AirlineLogoMap };
    return Date.now() - at < CACHE_TTL_MS ? logos : null;
  } catch {
    return null;
  }
}

function writeCache(logos: AirlineLogoMap) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), logos }));
  } catch {
    /* storage full or blocked - the in-memory copy still works */
  }
}

export function loadAirlineLogos(): Promise<AirlineLogoMap> {
  if (current) return Promise.resolve(current);
  const cached = readCache();
  if (cached) {
    current = cached;
    return Promise.resolve(cached);
  }
  inflight ??= fetch(`${API_BASE}/airlines/logos`)
    .then((r) => (r.ok ? (r.json() as Promise<AirlineLogoMap>) : {}))
    .catch(() => ({}) as AirlineLogoMap)
    .then((logos) => {
      // An empty answer (backend down) isn't cached, so the next page retries.
      if (Object.keys(logos).length) {
        current = logos;
        writeCache(logos);
      }
      inflight = null;
      return logos;
    });
  return inflight;
}

/** A logo failed to load: the saved map may be stale, so fetch afresh next page load. */
export function forgetAirlineLogos() {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    /* ignore */
  }
}

/** The logo map, or null while it loads (first visit only - usually instant). */
export function useAirlineLogos(): AirlineLogoMap | null {
  const [logos, setLogos] = useState<AirlineLogoMap | null>(current);
  useEffect(() => {
    if (current) return;
    let alive = true;
    void loadAirlineLogos().then((l) => alive && setLogos(l));
    return () => {
      alive = false;
    };
  }, []);
  return logos ?? current;
}
