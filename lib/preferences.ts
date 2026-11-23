import { authFetch } from './api';

/**
 * Per-user site preferences, stored server-side (user_preferences) so they
 * follow the user to every device they sign in on.
 *
 * Keep in step with the backend's src/preferences/preference-keys.ts - the
 * server rejects keys and values it doesn't know.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

/** "Results per page" choices on the flight, hotel and insurance lists. */
export const PAGE_SIZE_OPTIONS = [10, 20, 30, 50] as const;

/** One shortlisted hotel, with enough to show it without a supplier search. */
export interface ShortlistedHotel {
  id: string;
  name: string;
  starRating: number;
  /** Guest rating out of 5 when shortlisted; 0 = no reviews. */
  rating: number;
  address: string;
  /** https only (the server rejects anything else). */
  heroImage: string | null;
  savedAt: string; // ISO
}

/** Same cap as the backend (MAX_SHORTLISTED_HOTELS). */
export const MAX_SHORTLISTED_HOTELS = 100;

export interface Preferences {
  'results.pageSize.flights': number;
  'results.pageSize.hotels': number;
  'results.pageSize.insurance': number;
  /** Newest first. */
  'shortlist.hotels': ShortlistedHotel[];
}

export type PreferenceKey = keyof Preferences;

/** Used until the user's choices load, and for signed-out visitors. */
export const PREFERENCE_DEFAULTS: Preferences = {
  'results.pageSize.flights': 20,
  'results.pageSize.hotels': 20,
  'results.pageSize.insurance': 10,
  'shortlist.hotels': [],
};

async function readJson<T>(res: Response, fallback: string): Promise<T> {
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string | string[] };
    const msg = Array.isArray(err.message) ? err.message.join(', ') : err.message;
    throw new Error(msg || fallback);
  }
  return res.json() as Promise<T>;
}

export async function fetchPreferences(signal?: AbortSignal): Promise<Preferences> {
  const res = await authFetch(`${API_BASE}/preferences`, { signal });
  return { ...PREFERENCE_DEFAULTS, ...(await readJson<Partial<Preferences>>(res, 'Could not load your preferences.')) };
}

/** Saves only the given keys; `null` resets a key to its default. */
export async function savePreferences(
  changes: Partial<{ [K in PreferenceKey]: Preferences[K] | null }>,
): Promise<Preferences> {
  const res = await authFetch(`${API_BASE}/preferences`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(changes),
  });
  return { ...PREFERENCE_DEFAULTS, ...(await readJson<Partial<Preferences>>(res, 'Could not save your preference.')) };
}
