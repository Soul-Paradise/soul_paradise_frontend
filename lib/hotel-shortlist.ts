'use client';

import { useCallback, useMemo } from 'react';
import { usePreferences } from '@/contexts/PreferencesContext';
import { MAX_SHORTLISTED_HOTELS, type ShortlistedHotel } from '@/lib/preferences';
import { showToast } from '@/lib/toast';

/** What the hotel card knows about a hotel - enough to shortlist it. */
export interface ShortlistableHotel {
  id: string;
  name: string;
  starRating?: number | null;
  address?: string | null;
  heroImage?: string | null;
  userReview?: { rating: number } | null;
}

function toEntry(h: ShortlistableHotel): ShortlistedHotel {
  const img = (h.heroImage || '').trim();
  return {
    id: h.id,
    name: (h.name || 'Hotel').slice(0, 200),
    starRating: Math.min(5, Math.max(0, Number(h.starRating) || 0)),
    rating: Math.min(5, Math.max(0, Number(h.userReview?.rating) || 0)),
    address: (h.address || '').slice(0, 300),
    heroImage: /^https:\/\//i.test(img) && img.length <= 1000 ? img : null,
    savedAt: new Date().toISOString(),
  };
}

/**
 * The signed-in user's hotel shortlist. Saved on the account (user
 * preferences), so it follows them to every device.
 */
export function useHotelShortlist() {
  const { prefs, ready, setPreference } = usePreferences();
  const list = prefs['shortlist.hotels'];
  const ids = useMemo(() => list.map((h) => h.id), [list]);
  const idSet = useMemo(() => new Set(ids), [ids]);

  const isShortlisted = useCallback((id: string) => idSet.has(id), [idSet]);

  const remove = useCallback(
    (id: string) => setPreference('shortlist.hotels', list.filter((h) => h.id !== id)),
    [list, setPreference],
  );

  const toggle = useCallback(
    (hotel: ShortlistableHotel) => {
      if (idSet.has(hotel.id)) {
        remove(hotel.id);
        return;
      }
      if (list.length >= MAX_SHORTLISTED_HOTELS) {
        showToast({
          title: 'Shortlist is full',
          body: `You can keep up to ${MAX_SHORTLISTED_HOTELS} hotels. Remove one to add another.`,
          type: 'error',
        });
        return;
      }
      setPreference('shortlist.hotels', [toEntry(hotel), ...list]);
    },
    [idSet, list, remove, setPreference],
  );

  return { list, ids, ready, isShortlisted, toggle, remove };
}
