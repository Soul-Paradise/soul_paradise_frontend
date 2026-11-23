'use client';

import Link from 'next/link';
import { Heart, MapPin, Search, Trash2 } from 'lucide-react';
import { useRequireAuth } from '@/contexts/AuthContext';
import { PageHero } from '@/components/Page';
import { useSiteImages } from '@/components/SiteImages';
import HotelStars from '@/components/HotelResults/HotelStars';
import { useHotelShortlist } from '@/lib/hotel-shortlist';
import { MAX_SHORTLISTED_HOTELS } from '@/lib/preferences';

/**
 * The account's hotel shortlist. Saved on the account (user preferences), so
 * it is the same on every device. Rates are never stored here: prices change,
 * so the guest searches again to see today's rate (shortlisted hotels are
 * listed first in those results).
 */
export default function ShortlistPage() {
  const { isAuthenticated, isLoading } = useRequireAuth();
  const siteImages = useSiteImages();
  const { list, ready, remove } = useHotelShortlist();

  return (
    <main className="min-h-screen bg-(--color-background)">
      <PageHero
        crumb="My Shortlist"
        title="Your shortlisted hotels"
        description="Hotels you saved while browsing. They stay on your account on every device and show up first in your hotel searches."
        image={siteImages.pageHeroes?.orders}
        imagePosition="center 60%"
      />
      <div className="relative z-10 mx-auto -mt-16 max-w-5xl px-4 pb-16 sm:px-6 md:pb-20 lg:px-8">
        <section className="rounded-2xl border border-(--color-tertiary-button) bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-bold text-(--color-foreground)">
              <Heart className="h-5 w-5 text-red-500" fill="currentColor" aria-hidden="true" />
              Shortlisted hotels
              {ready && list.length > 0 && (
                <span className="text-sm font-semibold text-(--color-inactive)">
                  ({list.length}/{MAX_SHORTLISTED_HOTELS})
                </span>
              )}
            </h2>
            <Link
              href="/?tab=hotel#booking"
              className="inline-flex items-center gap-1.5 rounded-full border border-(--color-links) px-4 py-2 text-sm font-bold text-(--color-links) transition-colors hover:bg-(--color-links) hover:text-white"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              Search hotels
            </Link>
          </div>

          {isLoading || !isAuthenticated || !ready ? (
            <div className="space-y-3" aria-busy="true" aria-label="Loading your shortlist">
              {[0, 1].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : list.length === 0 ? (
            <div className="rounded-xl border border-dashed border-(--color-tertiary-button) px-6 py-12 text-center">
              <Heart className="mx-auto h-10 w-10 text-slate-300" aria-hidden="true" />
              <p className="mt-3 font-semibold text-(--color-foreground)">No hotels shortlisted yet</p>
              <p className="mt-1 text-sm text-(--color-inactive)">
                Tap <span className="font-semibold">Shortlist</span> on any hotel in your search results to save it here.
              </p>
            </div>
          ) : (
            <>
              <p className="mb-3 text-xs text-(--color-inactive)">
                Rates change, so search your dates to see today&apos;s prices. Shortlisted hotels are shown first in the results.
              </p>
              <ul className="space-y-3">
                {list.map((h) => (
                  <li
                    key={h.id}
                    className="flex gap-4 overflow-hidden rounded-xl border border-(--color-tertiary-button) bg-white"
                  >
                    <div className="relative h-24 w-28 shrink-0 bg-slate-100 sm:w-36">
                      {h.heroImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={h.heroImage} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                      ) : null}
                    </div>
                    <div className="flex min-w-0 flex-1 items-center gap-3 py-3 pr-3">
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-2 font-bold text-(--color-foreground)">
                          <span className="truncate">{h.name}</span>
                          {(h.rating ?? 0) > 0 && (
                            <span className="inline-flex items-center gap-1">
                              <HotelStars rating={h.rating} size="xs" />
                              <span className="text-xs font-semibold text-(--color-inactive)">{h.rating.toFixed(1)}</span>
                            </span>
                          )}
                        </p>
                        {h.address && (
                          <p className="mt-0.5 flex items-start gap-1 text-xs text-(--color-inactive)">
                            <MapPin className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            <span className="line-clamp-1">{h.address}</span>
                          </p>
                        )}
                        <p className="mt-1 text-[11px] text-(--color-inactive)">
                          Saved {new Date(h.savedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(h.id)}
                        aria-label={`Remove ${h.name} from your shortlist`}
                        className="inline-flex shrink-0 items-center gap-1 rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span className="hidden sm:inline">Remove</span>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
