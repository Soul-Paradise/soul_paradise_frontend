'use client';

import { useEffect, useState } from 'react';

/**
 * Remembers a user's last search on the device via localStorage, so the search
 * forms come back pre-filled on the next visit instead of a blank slate.
 *
 * All keys are namespaced under `sp:lastSearch:` to avoid colliding with the
 * auth tokens ApiClient stores (see lib/api.ts).
 */
const PREFIX = 'sp:lastSearch:';

export function loadSearch<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    // Corrupt JSON, private-mode restrictions, etc. — fall back to defaults.
    return null;
  }
}

export function saveSearch<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Quota exceeded / storage disabled — persistence is best-effort.
  }
}

/**
 * A stored date string ('YYYY-MM-DD') is only useful if it hasn't already
 * passed. Returns the stored value when it is today or later, otherwise the
 * given fallback — so a returning user never resumes into a past-dated search.
 */
export function notBeforeToday(dateStr: string | undefined, fallback: string): string {
  if (!dateStr) return fallback;
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return fallback;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today ? fallback : dateStr;
}

/**
 * Syncs a form's search inputs to localStorage.
 *
 * - On mount, reads any saved snapshot and hands it to `onRestore` (once).
 * - On every subsequent change to `snapshot`, writes it back — so overriding a
 *   value updates storage immediately.
 *
 * The `hydrated` gate is what prevents the write effect from clobbering saved
 * data with the component's initial defaults before the restore has run:
 * `onRestore` and `setHydrated(true)` are batched into the same commit, so the
 * first write the effect performs already carries the restored values.
 *
 * @param key       storage key (namespaced internally)
 * @param snapshot  the current serializable search inputs
 * @param onRestore applies a saved snapshot to component state (uses stable setters)
 */
export function usePersistentSearch<T>(
  key: string,
  snapshot: T,
  onRestore: (saved: T) => void,
): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = loadSearch<T>(key);
    if (saved) {
      try {
        onRestore(saved);
      } catch {
        // A malformed snapshot (e.g. from an older shape) shouldn't break the form.
      }
    }
    setHydrated(true);
    // Restore runs once per mount; setters passed via onRestore are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    saveSearch(key, snapshot);
    // Serialize for a cheap deep-equality dependency on the small snapshot object.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, key, JSON.stringify(snapshot)]);

  return hydrated;
}
