'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

// ── Types ──

interface RoomFacility {
  id: number;
  name: string;
}

interface RoomOption {
  recommendationId: string;
  roomGroupId: string;
  roomId: string;
  roomName: string;
  roomDescription: string;
  providerName: string;
  providerId: string;
  baseRate: number;
  totalRate: number;
  taxes: number;
  currency: string;
  refundable: boolean;
  payAtHotel: boolean | null;
  cardRequired: boolean;
  boardBasis: string | null;
  boardBasisType: string;
  cancellationPolicy: string | null;
  facilities: RoomFacility[];
  images: string[];
  beds: unknown | null;
  smokingAllowed: boolean;
  availability: number;
  needsPriceCheck: boolean;
  dailyRates: Array<{ amount: number; date: string }> | null;
  offers: unknown[];
  gstAllowed: boolean;
}

interface HotelRoomsResponse {
  hotelId: string;
  searchId: string;
  stayPeriod: { start: string; end: string };
  hotelDetail: HotelDetailInfo | null;
  rooms: RoomOption[];
}

interface TaxItem {
  amount: number;
  description: string | null;
}

interface CancellationRule {
  value: number;
  start: string;
  end: string;
}

interface CancellationPolicy {
  text: string | null;
  rules: CancellationRule[] | null;
}

interface HotelPricingDetail {
  hotelId: string;
  roomName: string;
  roomDescription: string | null;
  providerName: string;
  baseRate: number;
  totalRate: number;
  perRoomRates: Array<{ baseRate: number; totalRate: number }>;
  publishedRate: number;
  tcsOnTotal: number;
  taxes: TaxItem[];
  discounts: Array<{ amount: number; description: string | null }>;
  dailyRates: Array<{ amount: number; date: string; discount: number }> | null;
  refundable: boolean;
  onlineCancellable: boolean;
  cardRequired: boolean;
  payAtHotel: boolean;
  depositRequired: boolean;
  depositAmount: number | null;
  allGuestsInfoRequired: boolean;
  specialRequestSupported: boolean;
  gstAllowed: boolean;
  needsPriceCheck: boolean;
  boardBasis: string | null;
  boardBasisType: string;
  cancellationPolicies: CancellationPolicy[];
  currency: string;
  availability: number;
}

interface HotelDetailImage {
  caption: string;
  category: string;
  url: string;
}

interface HotelDetailReview {
  provider: string;
  count: number;
  rating: number;
}

interface HotelDetailNearby {
  name: string;
  distance: string;
  unit: string;
}

interface HotelDetailDescription {
  type: string;
  text: string;
}

interface HotelDetailInfo {
  id: string;
  name: string;
  starRating: number;
  address: string;
  city: string;
  country: string;
  heroImage?: string | null;
  facilities: RoomFacility[];
  facilityGroups?: RoomFacility[];
  images?: HotelDetailImage[];
  reviews?: HotelDetailReview[];
  nearByAttractions?: HotelDetailNearby[];
  descriptions?: HotelDetailDescription[];
  checkinInfo?: {
    beginTime: string | null;
    endTime: string | null;
    instructions: string[] | null;
    specialInstructions: string[] | null;
    minAge: number;
  };
  checkoutInfo?: { time: string | null };
  geoCode?: { lat: number; long: number };
}

interface HotelBookingContext {
  searchId: string;
  hotelId: string;
  providerName: string;
  recommendationId: string;
  priceId: string;
  netAmount: number;
  destinationCountryCode: string | null;
  searchTracingKey: string;
  checkIn: string; // MM/DD/YYYY
  checkOut: string;
  locationName: string | null;
  roomSlots: Array<{
    roomId: string;
    roomGroupId: string;
    supplierName: string;
    occupancyId: number;
    numOfAdults: number;
    numOfChildren: number;
    childAges: number[];
  }>;
}

// ── Helpers ──

function fmt(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(d: string): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    weekday: 'short',
  });
}

// Benzy sometimes returns room descriptions with HTML markup (p/strong/b/br/li).
// Convert to readable plain text: preserve structure as newlines, strip remaining tags,
// decode common entities.
function cleanHtml(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
    .replace(/<li\b[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .join('\n')
    .trim();
}

function nightsBetween(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 1;
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
}

function Stars({ count }: { count: number }) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className={`w-3.5 h-3.5 ${i < count ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

// ── Amenity icon mapping ──

const AMENITY_ICONS: Array<{ keys: string[]; label: string; svg: React.ReactNode }> = [
  {
    keys: ['wifi', 'internet'],
    label: 'Free Wifi',
    svg: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 12a10 10 0 0114 0M8.5 15.5a5 5 0 017 0M12 19h.01" />
      </svg>
    ),
  },
  {
    keys: ['parking'],
    label: 'Parking',
    svg: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 4h10a5 5 0 010 10H9v6H5V4zm4 3v4h5a2 2 0 100-4H9z" />
      </svg>
    ),
  },
  {
    keys: ['breakfast', 'dining', 'restaurant'],
    label: 'Restaurant',
    svg: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 3v7a3 3 0 003 3v8M7 3v7M10 3v7M17 3v18M17 14c0-4 2-7 2-7V3" />
      </svg>
    ),
  },
  {
    keys: ['gym', 'fitness'],
    label: 'Gym',
    svg: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 8v8M4 10v4M18 8v8M20 10v4M8 12h8" />
      </svg>
    ),
  },
  {
    keys: ['pool', 'swimming'],
    label: 'Pool',
    svg: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 17c2 0 2-1 4-1s2 1 4 1 2-1 4-1 2 1 4 1M3 21c2 0 2-1 4-1s2 1 4 1 2-1 4-1 2 1 4 1M8 13V5a2 2 0 114 0M16 13V7" />
      </svg>
    ),
  },
  {
    keys: ['room service', 'front desk', 'concierge'],
    label: 'Room Service',
    svg: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 18h16v-2a8 8 0 10-16 0v2zM12 8V5M10 5h4" />
      </svg>
    ),
  },
  {
    keys: ['laundry'],
    label: 'Laundry',
    svg: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 4h14v16H5V4zm4 0v3h6V4M12 10a4 4 0 100 8 4 4 0 000-8z" />
      </svg>
    ),
  },
  {
    keys: ['conveniences', 'elevator', 'air'],
    label: 'Conveniences',
    svg: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 5v5l3 2" />
      </svg>
    ),
  },
];

function pickAmenities(
  facilityGroups: RoomFacility[] | undefined,
  limit = 5,
): Array<{ label: string; svg: React.ReactNode }> {
  if (!facilityGroups?.length) return [];
  const picks: Array<{ label: string; svg: React.ReactNode }> = [];
  const usedLabels = new Set<string>();
  for (const group of facilityGroups) {
    const name = group.name.toLowerCase();
    const match = AMENITY_ICONS.find((a) => a.keys.some((k) => name.includes(k)));
    if (match && !usedLabels.has(match.label)) {
      picks.push({ label: match.label, svg: match.svg });
      usedLabels.add(match.label);
      if (picks.length >= limit) break;
    }
  }
  return picks;
}

// ── Image Carousel (lightbox) ──

function ImageCarousel({
  images,
  startIndex,
  hotelName,
  onClose,
}: {
  images: HotelDetailImage[];
  startIndex: number;
  hotelName: string;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(startIndex);

  const prev = useCallback(() => setIdx((i) => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setIdx((i) => (i + 1) % images.length), [images.length]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, prev, next]);

  if (!images.length) return null;
  const current = images[idx];

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col" onClick={onClose}>
      <div className="flex items-center justify-between px-6 py-4 text-white" onClick={(e) => e.stopPropagation()}>
        <div className="truncate">
          <p className="font-semibold truncate">{hotelName}</p>
          <p className="text-xs text-gray-300 truncate">{current.caption || 'Hotel image'} · {idx + 1} / {images.length}</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
          aria-label="Close gallery"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-4 relative" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={prev}
          className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
          aria-label="Previous image"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <img
          src={current.url}
          alt={current.caption || hotelName}
          className="max-h-full max-w-full object-contain rounded"
        />

        <button
          onClick={next}
          className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
          aria-label="Next image"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="px-6 pb-4 overflow-x-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex gap-2">
          {images.map((img, i) => (
            <button
              key={`${img.url}-${i}`}
              onClick={() => setIdx(i)}
              className={`flex-shrink-0 rounded overflow-hidden border-2 transition-all ${
                i === idx ? 'border-white' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
              aria-label={`Go to image ${i + 1}`}
            >
              <img src={img.url} alt="" className="w-16 h-16 object-cover" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Hotel Description (About this hotel) ──

function HotelDescription({ descriptions }: { descriptions?: HotelDetailDescription[] }) {
  const [expanded, setExpanded] = useState(false);
  const list = descriptions || [];

  // Keep General-type entries when available; fall back to all entries.
  const general = list.filter((d) => (d.type || '').toLowerCase() === 'general');
  const source = general.length > 0 ? general : list;
  const text = source.map((d) => cleanHtml(d.text)).filter(Boolean).join('\n\n');

  if (!text) return null;

  const COLLAPSED_LIMIT = 280;
  const needsToggle = text.length > COLLAPSED_LIMIT;
  const display = expanded || !needsToggle ? text : text.slice(0, COLLAPSED_LIMIT).trimEnd() + '…';

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-2">About this hotel</h2>
      <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{display}</p>
      {needsToggle && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-sm font-semibold text-[#e8262a] hover:text-[#c9191d] inline-flex items-center gap-1"
        >
          {expanded ? 'Read less' : 'Read more'}
          <svg
            className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}
    </div>
  );
}

// ── Hotel Hero ──

function HotelHero({
  hotel,
  checkIn,
  checkOut,
  nights,
  totalGuests,
  roomCount,
}: {
  hotel: HotelDetailInfo;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalGuests: number;
  roomCount: number;
}) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const images: HotelDetailImage[] = useMemo(() => {
    const list = hotel.images?.filter((img) => !!img.url) || [];
    if (list.length === 0 && hotel.heroImage) {
      return [{ caption: hotel.name, category: '', url: hotel.heroImage }];
    }
    return list;
  }, [hotel.images, hotel.heroImage, hotel.name]);

  const heroImage = images[0];
  const thumbs = images.slice(1, 7);

  const amenities = useMemo(() => pickAmenities(hotel.facilityGroups || hotel.facilities, 5), [hotel.facilityGroups, hotel.facilities]);
  const review = hotel.reviews?.[0];
  const ratingBand = (() => {
    const r = review?.rating ?? 0;
    if (r >= 4.5) return 'Excellent';
    if (r >= 4) return 'Very Good';
    if (r >= 3.5) return 'Good';
    if (r >= 3) return 'Pleasant';
    return 'Fair';
  })();

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      {/* Title row */}
      <div className="px-5 pt-5 pb-3 flex items-start justify-between flex-wrap gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{hotel.name}</h1>
            <Stars count={hotel.starRating} />
            {review && review.rating > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="bg-green-600 text-white text-xs font-bold rounded px-1.5 py-0.5">
                  {review.rating.toFixed(1)}
                </span>
                <span className="text-xs font-semibold text-gray-700">{ratingBand}</span>
                <span className="text-xs text-gray-500">· {review.count} rating{review.count !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500">
            <svg className="w-4 h-4 text-[#e8262a]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span className="truncate">{[hotel.address, hotel.city].filter(Boolean).join(', ')}</span>
          </div>
        </div>
      </div>

      {/* Gallery + info — fixed 420px height on lg+ so every hotel has the same layout.
          Images crop to fit their slot via object-cover on absolutely-positioned <img>. */}
      <div className="px-5 pb-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:h-[420px]">
          {images.length === 0 ? (
            // Full-width placeholder occupies the 9 image columns; info column still renders on the right.
            <div className="lg:col-span-9 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-sm h-64 lg:h-full">
              No images available
            </div>
          ) : (
            <>
              {/* Hero image */}
              <button
                type="button"
                onClick={() => setLightboxIdx(0)}
                className="lg:col-span-5 relative rounded-lg overflow-hidden bg-gray-100 group h-64 sm:h-80 lg:h-full min-w-0"
              >
                <img
                  src={heroImage.url}
                  alt={heroImage.caption || hotel.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </button>

              {/* Thumbs grid: fixed 2 cols × 3 rows (6 slots). Empty slots get a placeholder so
                  the layout stays consistent across hotels. The last slot shows "View more"
                  when there are additional images beyond the 7 shown. */}
              <div className="hidden sm:grid sm:grid-cols-2 sm:grid-rows-3 lg:col-span-4 gap-3 h-[420px] lg:h-full min-w-0">
                {Array.from({ length: 6 }).map((_, i) => {
                  const img = thumbs[i];
                  const isLastSlot = i === 5;
                  const hasMore = images.length > 7;

                  if (!img) {
                    return (
                      <div
                        key={`placeholder-${i}`}
                        className="relative rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden min-w-0"
                        aria-hidden="true"
                      >
                        <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    );
                  }

                  return (
                    <button
                      key={`${img.url}-${i}`}
                      type="button"
                      onClick={() => setLightboxIdx(i + 1)}
                      className="relative rounded-lg overflow-hidden bg-gray-100 group min-w-0"
                    >
                      <img
                        src={img.url}
                        alt={img.caption || ''}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {isLastSlot && hasMore && (
                        <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center text-white">
                          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          <span className="text-sm font-semibold">View more ({images.length - 7})</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Info column */}
            <div className="lg:col-span-3 flex flex-col gap-2.5 min-w-0 lg:h-full lg:overflow-hidden">
              {/* Dates card */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Check in
                  </p>
                  <p className="text-base font-bold text-gray-900 leading-tight mt-1">
                    {new Date(checkIn).toLocaleDateString('en-IN', { day: '2-digit' })}
                    <span className="text-xs font-semibold ml-1">
                      {new Date(checkIn).toLocaleDateString('en-IN', { month: 'short' })}
                      {"'"}
                      {String(new Date(checkIn).getFullYear()).slice(-2)}
                    </span>
                  </p>
                  <p className="text-[11px] text-gray-500">
                    {new Date(checkIn).toLocaleDateString('en-IN', { weekday: 'long' })}
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center self-stretch px-1.5 text-[10px] text-gray-500 border-l border-r border-dashed border-gray-300">
                  <span className="uppercase tracking-wide font-semibold">{nights}</span>
                  <span className="uppercase tracking-wide">Night{nights !== 1 ? 's' : ''}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Check out
                  </p>
                  <p className="text-base font-bold text-gray-900 leading-tight mt-1">
                    {new Date(checkOut).toLocaleDateString('en-IN', { day: '2-digit' })}
                    <span className="text-xs font-semibold ml-1">
                      {new Date(checkOut).toLocaleDateString('en-IN', { month: 'short' })}
                      {"'"}
                      {String(new Date(checkOut).getFullYear()).slice(-2)}
                    </span>
                  </p>
                  <p className="text-[11px] text-gray-500">
                    {new Date(checkOut).toLocaleDateString('en-IN', { weekday: 'long' })}
                  </p>
                </div>
              </div>

              {/* Rooms & Guests card */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center gap-2.5">
                <svg className="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6 5.87v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2m8-10a4 4 0 11-8 0 4 4 0 018 0zm6 0a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold">Rooms &amp; Guests</p>
                  <p className="text-sm font-bold text-gray-900">
                    {roomCount} <span className="font-normal text-gray-600">Room{roomCount !== 1 ? 's' : ''}</span> · {totalGuests} <span className="font-normal text-gray-600">Guest{totalGuests !== 1 ? 's' : ''}</span>
                  </p>
                </div>
              </div>

              {/* Amenities card */}
              {amenities.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex-1">
                  <p className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold mb-2">Amenities</p>
                  <div className="grid grid-cols-2 gap-y-2 gap-x-3 text-xs text-gray-700">
                    {amenities.map((a) => (
                      <div key={a.label} className="flex items-center gap-1.5">
                        <span className="text-gray-500">{a.svg}</span>
                        <span>{a.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
        </div>
      </div>

      {lightboxIdx !== null && (
        <ImageCarousel
          images={images}
          startIndex={lightboxIdx}
          hotelName={hotel.name}
          onClose={() => setLightboxIdx(null)}
        />
      )}
    </div>
  );
}

// ── Room Card ──

function RoomCard({
  room,
  nights,
  onSelect,
  isSelected,
  loadingPrice,
}: {
  room: RoomOption;
  nights: number;
  onSelect: (room: RoomOption) => void;
  isSelected: boolean;
  loadingPrice: boolean;
}) {
  const hasSavings = room.baseRate > room.totalRate && room.baseRate > 0 && room.totalRate > 0;
  const savings = hasSavings ? room.baseRate - room.totalRate : 0;
  const topFacilities = room.facilities.slice(0, 4);

  return (
    <div className={`bg-white rounded-lg border transition-all ${isSelected ? 'border-blue-500 shadow-md ring-1 ring-blue-400' : 'border-gray-200 shadow-sm hover:shadow-md'}`}>
      <div className="flex flex-col sm:flex-row gap-0 overflow-hidden rounded-lg">
        {/* Room image */}
        {room.images.length > 0 ? (
          <div className="sm:w-44 flex-shrink-0 bg-gray-100">
            <img
              src={room.images[0]}
              alt={room.roomName}
              className="w-full h-40 sm:h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        ) : (
          <div className="sm:w-44 flex-shrink-0 bg-gray-50 flex items-center justify-center min-h-[140px]">
            <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
        )}

        {/* Room info */}
        <div className="flex flex-1 p-4 gap-4 min-w-0">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-base">{room.roomName}</h3>
            {room.roomDescription && (() => {
              const desc = cleanHtml(room.roomDescription);
              return desc ? (
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 whitespace-pre-line">{desc}</p>
              ) : null;
            })()}

            {/* Board basis */}
            {room.boardBasis && (
              <div className="flex items-center gap-1 mt-1.5">
                <svg className="w-3.5 h-3.5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4h14v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                </svg>
                <span className="text-xs text-orange-700 font-medium">{room.boardBasis}</span>
              </div>
            )}

            {/* Badges */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {room.refundable && (
                <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded">Free Cancellation</span>
              )}
              {room.payAtHotel && (
                <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded">Pay at Hotel</span>
              )}
              {room.smokingAllowed && (
                <span className="text-xs bg-gray-50 text-gray-600 border border-gray-200 px-2 py-0.5 rounded">Smoking Allowed</span>
              )}
              {room.availability > 0 && room.availability <= 5 && (
                <span className="text-xs bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded">Only {room.availability} left!</span>
              )}
            </div>

            {/* Facilities */}
            {topFacilities.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {topFacilities.map((f) => (
                  <span key={f.id} className="text-xs text-gray-500 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded">
                    {f.name}
                  </span>
                ))}
              </div>
            )}

            {/* Cancellation policy */}
            {room.cancellationPolicy && (
              <p className="text-xs text-gray-400 mt-2 line-clamp-1">{room.cancellationPolicy}</p>
            )}
          </div>

          {/* Price + Select */}
          <div className="flex flex-col items-end justify-between flex-shrink-0" style={{ minWidth: 130 }}>
            <div className="text-right">
              {hasSavings && (
                <div className="text-xs text-gray-400 line-through">{fmt(room.baseRate, room.currency)}</div>
              )}
              {room.totalRate > 0 ? (
                <>
                  <div className="text-xl font-bold text-gray-900">{fmt(room.totalRate, room.currency)}</div>
                  <div className="text-xs text-gray-500">for {nights} night{nights !== 1 ? 's' : ''}</div>
                  {hasSavings && (
                    <div className="text-xs text-green-600 font-semibold mt-0.5">Save {fmt(savings, room.currency)}</div>
                  )}
                </>
              ) : (
                <div className="text-sm text-gray-400 italic">Price on request</div>
              )}
            </div>

            <button
              onClick={() => onSelect(room)}
              disabled={loadingPrice && isSelected}
              className={`mt-3 px-4 py-2 text-sm font-bold rounded transition-colors w-full ${
                isSelected
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-[#e8262a] hover:bg-[#c9191d] text-white'
              } disabled:opacity-60`}
            >
              {loadingPrice && isSelected ? (
                <span className="flex items-center justify-center gap-1.5">
                  <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Checking...
                </span>
              ) : isSelected ? 'Selected' : 'Select Room'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Special Instructions ("Things to know before booking") ──

function SpecialInstructions({
  instructions,
  knowBefore,
}: {
  instructions: string[] | null;
  knowBefore: string[] | null;
}) {
  const [expanded, setExpanded] = useState(false);

  // Merge + clean HTML from both sources, keep non-empty unique lines.
  const items = [...(knowBefore || []), ...(instructions || [])]
    .map((s) => cleanHtml(s))
    .flatMap((s) => s.split('\n'))
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const deduped = Array.from(new Set(items));
  if (deduped.length === 0) return null;

  const INITIAL = 2;
  const visible = expanded ? deduped : deduped.slice(0, INITIAL);
  const hasMore = deduped.length > INITIAL;

  return (
    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900">
      <p className="font-semibold mb-1.5 flex items-center gap-1">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M4.93 19h14.14a2 2 0 001.74-3L13.74 4a2 2 0 00-3.48 0L3.2 16a2 2 0 001.74 3z" />
        </svg>
        Things to know
      </p>
      <ul className="list-disc pl-4 space-y-1">
        {visible.map((item, i) => (
          <li key={`${i}-${item.slice(0, 20)}`} className="leading-snug">{item}</li>
        ))}
      </ul>
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 font-semibold text-amber-900 hover:text-amber-700 inline-flex items-center gap-1"
        >
          {expanded ? 'Show less' : `Show more (${deduped.length - INITIAL})`}
          <svg
            className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}
    </div>
  );
}

// ── Pricing Panel ──

function PricingPanel({
  pricing,
  hotelDetail,
  checkIn,
  checkOut,
  nights,
  onBook,
}: {
  pricing: HotelPricingDetail;
  hotelDetail: HotelDetailInfo | null;
  checkIn: string;
  checkOut: string;
  nights: number;
  onBook: () => void;
}) {
  const totalTaxes = pricing.taxes.reduce((sum, t) => sum + t.amount, 0);
  const hasSavings = pricing.publishedRate > pricing.totalRate && pricing.publishedRate > 0;

  return (
    <div className="bg-white rounded-lg border border-blue-200 shadow-md p-5 sticky top-4">
      <h3 className="font-bold text-gray-900 text-base mb-3">Price Summary</h3>

      {/* Room name */}
      <p className="text-sm font-semibold text-gray-800">{pricing.roomName}</p>
      {pricing.roomDescription && (() => {
        const desc = cleanHtml(pricing.roomDescription);
        return desc ? (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 whitespace-pre-line">{desc}</p>
        ) : null;
      })()}

      {/* Stay period */}
      <div className="mt-3 text-xs text-gray-500 space-y-0.5">
        <div className="flex justify-between">
          <span>Check-in</span>
          <span className="font-medium text-gray-700">{formatDate(checkIn)}</span>
        </div>
        <div className="flex justify-between">
          <span>Check-out</span>
          <span className="font-medium text-gray-700">{formatDate(checkOut)}</span>
        </div>
        <div className="flex justify-between">
          <span>Duration</span>
          <span className="font-medium text-gray-700">{nights} night{nights !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="border-t border-gray-100 my-3" />

      {/* Price breakdown */}
      <div className="space-y-1.5 text-sm">
        {hasSavings && (
          <div className="flex justify-between text-gray-400">
            <span>Published Rate</span>
            <span className="line-through">{fmt(pricing.publishedRate, pricing.currency)}</span>
          </div>
        )}
        <div className="flex justify-between text-gray-700">
          <span>Room Rate</span>
          <span>{fmt(pricing.baseRate, pricing.currency)}</span>
        </div>
        {pricing.dailyRates && pricing.dailyRates.length > 1 && (
          <details className="text-xs text-gray-500">
            <summary className="cursor-pointer hover:text-gray-700">Per-night breakdown</summary>
            <div className="mt-1 space-y-0.5 pl-2">
              {pricing.dailyRates.map((d, i) => (
                <div key={i} className="flex justify-between">
                  <span>{formatDate(d.date)}</span>
                  <span>{fmt(d.amount - (d.discount || 0), pricing.currency)}</span>
                </div>
              ))}
            </div>
          </details>
        )}
        {pricing.discounts.map((d, i) => (
          <div key={i} className="flex justify-between text-green-600 text-xs">
            <span>{d.description || 'Discount'}</span>
            <span>-{fmt(d.amount, pricing.currency)}</span>
          </div>
        ))}
        {pricing.taxes.length > 0 && (
          pricing.taxes.map((tax, i) => (
            <div key={i} className="flex justify-between text-gray-500 text-xs">
              <span>{tax.description || 'Tax & Fees'}</span>
              <span>{fmt(tax.amount, pricing.currency)}</span>
            </div>
          ))
        )}
        {pricing.tcsOnTotal > 0 && (
          <div className="flex justify-between text-gray-500 text-xs">
            <span>TCS</span>
            <span>{fmt(pricing.tcsOnTotal, pricing.currency)}</span>
          </div>
        )}
        {totalTaxes === 0 && (
          <div className="flex justify-between text-gray-500 text-xs">
            <span>Taxes & Fees</span>
            <span className="italic text-gray-400">Included</span>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 my-3" />

      <div className="flex justify-between items-baseline">
        <span className="font-bold text-gray-900">Total</span>
        <span className="text-xl font-bold text-gray-900">{fmt(pricing.totalRate, pricing.currency)}</span>
      </div>
      {hasSavings && (
        <p className="text-xs text-green-600 font-semibold text-right mt-0.5">
          You save {fmt(pricing.publishedRate - pricing.totalRate, pricing.currency)}
        </p>
      )}

      {pricing.depositRequired && (
        <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
          <p className="font-semibold">Deposit required</p>
          {pricing.depositAmount != null && pricing.depositAmount > 0 && (
            <p>Payable now: {fmt(pricing.depositAmount, pricing.currency)}</p>
          )}
        </div>
      )}

      {pricing.needsPriceCheck && (
        <p className="mt-2 text-xs text-amber-700">
          ⚠ Price may be re-verified at booking and could change slightly.
        </p>
      )}

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 mt-3">
        {pricing.refundable ? (
          <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded">Free Cancellation</span>
        ) : (
          <span className="text-xs bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded">Non-refundable</span>
        )}
        {pricing.refundable && pricing.onlineCancellable && (
          <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded">Cancel online</span>
        )}
        {pricing.payAtHotel && (
          <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded">Pay at hotel</span>
        )}
        {pricing.boardBasis && (
          <span className="text-xs bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded">{pricing.boardBasis}</span>
        )}
      </div>

      {/* Cancellation policies */}
      {pricing.cancellationPolicies.length > 0 && pricing.cancellationPolicies[0].text && (
        <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
          <p className="font-semibold text-gray-700 mb-0.5">Cancellation Policy</p>
          <p>{pricing.cancellationPolicies[0].text}</p>
        </div>
      )}

      {/* Hotel check-in info (from provider-specific pricing content) */}
      {hotelDetail?.checkinInfo && (hotelDetail.checkinInfo.beginTime || (hotelDetail.checkinInfo.minAge ?? 0) > 0) && (
        <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
          <p className="font-semibold text-gray-700 mb-1">Check-in info</p>
          <div className="space-y-0.5">
            {hotelDetail.checkinInfo.beginTime && (
              <p>From <span className="font-medium text-gray-800">{hotelDetail.checkinInfo.beginTime}</span></p>
            )}
            {hotelDetail.checkoutInfo?.time && (
              <p>Checkout by <span className="font-medium text-gray-800">{hotelDetail.checkoutInfo.time}</span></p>
            )}
            {(hotelDetail.checkinInfo.minAge ?? 0) > 0 && (
              <p>Minimum age <span className="font-medium text-gray-800">{hotelDetail.checkinInfo.minAge}</span></p>
            )}
          </div>
        </div>
      )}

      {/* Special instructions (things to know before booking) */}
      <SpecialInstructions
        instructions={hotelDetail?.checkinInfo?.specialInstructions ?? null}
        knowBefore={hotelDetail?.checkinInfo?.instructions ?? null}
      />


      <button
        onClick={onBook}
        className="mt-4 w-full px-4 py-3 bg-[#e8262a] hover:bg-[#c9191d] text-white font-bold rounded-lg text-sm transition-colors"
      >
        Proceed to Book
      </button>
      <p className="text-xs text-gray-400 text-center mt-2">No hidden charges</p>
    </div>
  );
}

// ── Section Tabs (sticky nav) ──

type SectionKey = 'photos' | 'rooms' | 'amenities' | 'nearby' | 'map';

function SectionTabs({
  sections,
  active,
  onSelect,
}: {
  sections: Array<{ key: SectionKey; label: string }>;
  active: SectionKey;
  onSelect: (key: SectionKey) => void;
}) {
  return (
    <div className="sticky top-0 z-30 bg-white border-b border-gray-200 rounded-t-lg">
      <div className="flex overflow-x-auto">
        {sections.map((s) => {
          const isActive = s.key === active;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => onSelect(s.key)}
              className={`relative flex-shrink-0 px-5 py-3 text-xs sm:text-sm font-semibold tracking-wide uppercase transition-colors ${
                isActive ? 'text-[#e8262a]' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {s.label}
              {isActive && (
                <span className="absolute left-3 right-3 bottom-0 h-0.5 bg-[#e8262a] rounded-t" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Hotel Amenities (all facility groups) ──

const AMENITIES_INITIAL_LIMIT = 3;
const ROOMS_INITIAL_LIMIT = 3;

function HotelAmenitiesSection({ hotel }: { hotel: HotelDetailInfo }) {
  const [expanded, setExpanded] = useState(false);
  const groups = hotel.facilityGroups || [];
  const allFacilities = hotel.facilities || [];

  // Bucket facilities under their groupId; fallback bucket "Other" for groupId 0/missing
  const groupMap = new Map<number, { name: string; items: string[] }>();
  for (const g of groups) {
    groupMap.set(g.id, { name: g.name, items: [] });
  }
  for (const f of allFacilities) {
    const fWithGroup = f as RoomFacility & { groupId?: number };
    const gid = fWithGroup.groupId ?? 0;
    const bucket = groupMap.get(gid);
    if (bucket) {
      bucket.items.push(f.name);
    } else {
      if (!groupMap.has(0)) groupMap.set(0, { name: 'Other', items: [] });
      groupMap.get(0)!.items.push(f.name);
    }
  }

  const buckets = Array.from(groupMap.values()).filter((b) => b.items.length > 0);

  if (buckets.length === 0 && allFacilities.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 text-sm text-gray-500">
        No amenity information available for this hotel.
      </div>
    );
  }

  // Cap total items shown across all buckets (not bucket count) so a single "Other"
  // bucket with many items still collapses.
  const totalItems = buckets.reduce((sum, b) => sum + b.items.length, 0) || allFacilities.length;
  const visibleFlat = expanded ? allFacilities : allFacilities.slice(0, AMENITIES_INITIAL_LIMIT);
  const hasMore = totalItems > AMENITIES_INITIAL_LIMIT;

  const visibleBuckets = (() => {
    if (expanded) return buckets;
    const result: Array<{ name: string; items: string[] }> = [];
    let remaining = AMENITIES_INITIAL_LIMIT;
    for (const b of buckets) {
      if (remaining <= 0) break;
      const take = b.items.slice(0, remaining);
      if (take.length > 0) {
        result.push({ name: b.name, items: take });
        remaining -= take.length;
      }
    }
    return result;
  })();

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Hotel Amenities</h2>

      {buckets.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
          {visibleBuckets.map((b) => (
            <div key={b.name}>
              <h3 className="text-sm font-semibold text-gray-800 mb-2">{b.name}</h3>
              <ul className="space-y-1.5">
                {b.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1.5">
          {visibleFlat.map((f) => (
            <li key={f.id} className="flex items-start gap-2 text-sm text-gray-600">
              <svg className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span>{f.name}</span>
            </li>
          ))}
        </ul>
      )}

      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-4 text-sm font-semibold text-[#e8262a] hover:text-[#c9191d] inline-flex items-center gap-1"
        >
          {expanded ? 'Show less' : 'Show more'}
          <svg
            className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}
    </div>
  );
}

// ── Nearby Attractions ──

const NEARBY_INITIAL_LIMIT = 3;

function NearbyAttractionsSection({ hotel }: { hotel: HotelDetailInfo }) {
  const [expanded, setExpanded] = useState(false);
  const list = (hotel.nearByAttractions || []).filter((a) => {
    // Filter out the "nearest airport" description-style entry that has long name
    return a.name.length < 80;
  });
  const airport = (hotel.nearByAttractions || []).find((a) => /airport/i.test(a.name));

  if (list.length === 0 && !airport) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 text-sm text-gray-500">
        No nearby attractions information available.
      </div>
    );
  }

  const visibleList = expanded ? list : list.slice(0, NEARBY_INITIAL_LIMIT);
  const hasMore = list.length > NEARBY_INITIAL_LIMIT;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Nearby Attractions</h2>

      {list.length > 0 && (
        <ul className="divide-y divide-gray-100">
          {visibleList.map((a, i) => (
            <li key={`${a.name}-${i}`} className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-[#e8262a]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                </span>
                <span className="text-sm text-gray-800 truncate">{a.name}</span>
              </div>
              <span className="text-sm text-gray-500 flex-shrink-0 ml-3">
                {a.distance} {a.unit}
              </span>
            </li>
          ))}
        </ul>
      )}

      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 text-sm font-semibold text-[#e8262a] hover:text-[#c9191d] inline-flex items-center gap-1"
        >
          {expanded ? 'Show less' : `Show more (${list.length - NEARBY_INITIAL_LIMIT})`}
          <svg
            className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}

      {airport && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 min-w-0">
            <svg className="w-4 h-4 text-blue-700 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l4-1 6 6 1-4 8-8 2 2-8 8-4 1-6-6-3 2z" />
            </svg>
            <span className="text-blue-900 truncate">{airport.name.replace(/^The nearest major airport is\s*/i, 'Nearest airport: ')}</span>
          </div>
          <span className="text-blue-700 font-medium flex-shrink-0 ml-3">
            {airport.distance} {airport.unit}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Map ──

function HotelMapSection({ hotel }: { hotel: HotelDetailInfo }) {
  const geo = hotel.geoCode;
  if (!geo || (!geo.lat && !geo.long)) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 text-sm text-gray-500">
        Map location not available for this hotel.
      </div>
    );
  }

  const { lat, long } = geo;
  const delta = 0.008;
  const bbox = `${long - delta},${lat - delta},${long + delta},${lat + delta}`;
  const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${long}`;
  const openUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${long}#map=16/${lat}/${long}`;
  const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${long}`;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2 className="text-lg font-bold text-gray-900">Location</h2>
        <div className="flex items-center gap-3 text-xs">
          <a
            href={openUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            View larger map
          </a>
          <a
            href={gmapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Open in Google Maps
          </a>
        </div>
      </div>

      {(hotel.address || hotel.city) && (
        <p className="text-sm text-gray-600 mb-3">
          {[hotel.address, hotel.city, hotel.country].filter(Boolean).join(', ')}
        </p>
      )}

      <div className="w-full h-[360px] rounded-lg overflow-hidden border border-gray-200">
        <iframe
          title={`Map of ${hotel.name}`}
          src={embedUrl}
          className="w-full h-full"
          loading="lazy"
        />
      </div>
    </div>
  );
}

// ── Main Content ──

function RoomsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const searchId = searchParams.get('searchId') || '';
  const hotelId = searchParams.get('hotelId') || '';
  const checkIn = searchParams.get('checkIn') || '';
  const checkOut = searchParams.get('checkOut') || '';
  const searchTracingKey = searchParams.get('searchTracingKey') || '';
  const destinationCountryCode = searchParams.get('destinationCountryCode') || 'IN';
  const benzyCheckIn = searchParams.get('benzyCheckIn') || '';
  const benzyCheckOut = searchParams.get('benzyCheckOut') || '';
  const roomsParam = searchParams.get('rooms') || '';
  const nights = nightsBetween(checkIn, checkOut);

  const { roomCount, totalGuests } = useMemo(() => {
    try {
      const parsed = JSON.parse(roomsParam) as Array<{ adults: number; children: number }>;
      if (Array.isArray(parsed) && parsed.length > 0) {
        const guests = parsed.reduce((sum, r) => sum + (r.adults || 0) + (r.children || 0), 0);
        return { roomCount: parsed.length, totalGuests: guests };
      }
    } catch {
      // fall through
    }
    return { roomCount: 1, totalGuests: 1 };
  }, [roomsParam]);

  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [hotelDetail, setHotelDetail] = useState<HotelDetailInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<SectionKey>('photos');
  const [roomsExpanded, setRoomsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedRoom, setSelectedRoom] = useState<RoomOption | null>(null);
  const [pricing, setPricing] = useState<HotelPricingDetail | null>(null);
  const [pricingHotelDetail, setPricingHotelDetail] = useState<HotelDetailInfo | null>(null);
  const [bookingContext, setBookingContext] = useState<HotelBookingContext | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingError, setPricingError] = useState<string | null>(null);

  useEffect(() => {
    if (!searchId || !hotelId) {
      setError('Missing search or hotel information. Please go back and try again.');
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`${API_URL}/hotels/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ searchId, hotelId, destinationCountryCode }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || 'Failed to load rooms');
        }
        return res.json() as Promise<HotelRoomsResponse>;
      })
      .then((data) => {
        setRooms(data.rooms || []);
        setHotelDetail(data.hotelDetail || null);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, [searchId, hotelId, destinationCountryCode]);

  // Track which section is in view for active tab highlighting
  useEffect(() => {
    if (loading || error) return;
    const keys: SectionKey[] = ['photos', 'rooms', 'amenities', 'nearby', 'map'];
    const els = keys
      .map((k) => ({ key: k, el: document.getElementById(`section-${k}`) }))
      .filter((x): x is { key: SectionKey; el: HTMLElement } => !!x.el);
    if (els.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          const id = (visible.target as HTMLElement).id;
          const key = id.replace('section-', '') as SectionKey;
          setActiveSection(key);
        }
      },
      { rootMargin: '-100px 0px -60% 0px', threshold: [0, 0.25, 0.5, 1] },
    );

    els.forEach(({ el }) => observer.observe(el));
    return () => observer.disconnect();
  }, [loading, error, hotelDetail]);

  const scrollToSection = useCallback((key: SectionKey) => {
    const el = document.getElementById(`section-${key}`);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 110;
    window.scrollTo({ top, behavior: 'smooth' });
    setActiveSection(key);
  }, []);

  async function selectRoom(room: RoomOption) {
    setSelectedRoom(room);
    setPricing(null);
    setBookingContext(null);
    setPricingError(null);
    setPricingLoading(true);

    try {
      const res = await fetch(`${API_URL}/hotels/price`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchId,
          hotelId,
          providerName: room.providerName,
          recommendationId: room.recommendationId,
          searchTracingKey,
          checkIn: benzyCheckIn,
          checkOut: benzyCheckOut,
          destinationCountryCode,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to fetch room pricing');
      }

      const data = await res.json() as {
        pricing: HotelPricingDetail;
        hotelDetail: HotelDetailInfo | null;
        bookingContext: HotelBookingContext;
      };
      setPricing(data.pricing);
      setPricingHotelDetail(data.hotelDetail);
      setBookingContext(data.bookingContext);
    } catch (err: unknown) {
      setPricingError(err instanceof Error ? err.message : 'Failed to fetch pricing');
    } finally {
      setPricingLoading(false);
    }
  }

  function handleBook() {
    if (!pricing || !bookingContext || !selectedRoom) return;
    let occupancy: Array<{ adults: number; children: number; childAges?: number[] }> = [{ adults: 1, children: 0 }];
    try {
      const parsed = JSON.parse(roomsParam);
      if (Array.isArray(parsed) && parsed.length > 0) occupancy = parsed;
    } catch {
      // fall through with default
    }
    try {
      sessionStorage.setItem(
        'hotelBookingContext',
        JSON.stringify({
          bookingContext: { ...bookingContext, hotelCode: hotelId, uiCheckIn: checkIn, uiCheckOut: checkOut },
          pricing,
          hotelDetail: pricingHotelDetail || hotelDetail,
          selectedRoom: {
            roomId: selectedRoom.roomId,
            roomGroupId: selectedRoom.roomGroupId,
            supplierName: selectedRoom.providerName,
          },
          occupancy,
        }),
      );
    } catch {
      // sessionStorage unavailable — proceed anyway, booking page can show an error
    }
    const params = new URLSearchParams({ searchId, hotelId, checkIn, checkOut });
    router.push(`/booking/hotels/book?${params.toString()}`);
  }

  const displayHotel = pricingHotelDetail || hotelDetail;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Hotel Details
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <svg className="animate-spin w-10 h-10 text-[#e8262a]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-gray-500 text-sm">Fetching available rooms...</p>
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-600 font-medium">{error}</p>
            <button
              onClick={() => router.back()}
              className="text-sm text-blue-600 hover:underline"
            >
              Go back to hotel list
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {displayHotel && (
              <SectionTabs
                sections={[
                  { key: 'photos', label: 'Photos' },
                  { key: 'rooms', label: 'Room & Rates' },
                  { key: 'amenities', label: 'Hotel Amenities' },
                  { key: 'nearby', label: 'Nearby Attractions' },
                  { key: 'map', label: 'Map' },
                ]}
                active={activeSection}
                onSelect={scrollToSection}
              />
            )}

            {displayHotel && (
              <section id="section-photos" className="mt-4 scroll-mt-28">
                <HotelHero
                  hotel={displayHotel}
                  checkIn={checkIn}
                  checkOut={checkOut}
                  nights={nights}
                  totalGuests={totalGuests}
                  roomCount={roomCount}
                />
              </section>
            )}

            {displayHotel && (
              <div className="mt-4">
                <div className="bg-white border border-gray-200 rounded-lg p-5">
                  <HotelDescription descriptions={displayHotel.descriptions} />
                </div>
              </div>
            )}

          <section id="section-rooms" className="mt-6 scroll-mt-28 flex gap-6">
            {/* Rooms list */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">
                  {rooms.length} Room{rooms.length !== 1 ? 's' : ''} Available
                </h2>
              </div>

              {rooms.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-10 text-center">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <p className="text-gray-500 font-medium">No rooms available for your selected dates</p>
                  <p className="text-sm text-gray-400 mt-1">Try different dates or search for another hotel</p>
                  <button
                    onClick={() => router.back()}
                    className="mt-4 px-4 py-2 bg-[#e8262a] text-white text-sm font-bold rounded hover:bg-[#c9191d] transition-colors"
                  >
                    Back to Hotels
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {(roomsExpanded ? rooms : rooms.slice(0, ROOMS_INITIAL_LIMIT)).map((room) => (
                      <RoomCard
                        key={`${room.recommendationId}-${room.roomId}`}
                        room={room}
                        nights={nights}
                        onSelect={selectRoom}
                        isSelected={selectedRoom?.recommendationId === room.recommendationId}
                        loadingPrice={pricingLoading && selectedRoom?.recommendationId === room.recommendationId}
                      />
                    ))}
                  </div>

                  {rooms.length > ROOMS_INITIAL_LIMIT && (
                    <button
                      type="button"
                      onClick={() => setRoomsExpanded((v) => !v)}
                      className="mt-4 w-full py-2.5 bg-white border border-gray-200 hover:border-[#e8262a] hover:text-[#c9191d] text-sm font-semibold text-[#e8262a] rounded-lg inline-flex items-center justify-center gap-1.5 transition-colors"
                    >
                      {roomsExpanded
                        ? 'Show fewer rooms'
                        : `Show ${rooms.length - ROOMS_INITIAL_LIMIT} more room${rooms.length - ROOMS_INITIAL_LIMIT !== 1 ? 's' : ''}`}
                      <svg
                        className={`w-4 h-4 transition-transform ${roomsExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Pricing sidebar */}
            <div className="w-72 flex-shrink-0">
              <div className="flex items-center justify-between mb-4 h-7">
                <h2 className="text-lg font-bold text-gray-900">Price Summary</h2>
              </div>

              {pricingLoading && (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 flex flex-col items-center gap-3">
                  <svg className="animate-spin w-8 h-8 text-[#e8262a]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <p className="text-sm text-gray-500">Getting latest price...</p>
                </div>
              )}

              {pricingError && !pricingLoading && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
                  <p className="font-semibold">Pricing unavailable</p>
                  <p className="mt-1">{pricingError}</p>
                  <p className="mt-2 text-xs text-red-500">Please try selecting the room again.</p>
                </div>
              )}

              {pricing && !pricingLoading && (
                <PricingPanel
                  pricing={pricing}
                  hotelDetail={pricingHotelDetail}
                  checkIn={checkIn}
                  checkOut={checkOut}
                  nights={nights}
                  onBook={handleBook}
                />
              )}

              {!pricing && !pricingLoading && !pricingError && (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-3">
                      <svg className="w-7 h-7 text-[#e8262a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">No room selected yet</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Pick a room on the left to see the final price, taxes and cancellation policy.
                    </p>
                  </div>

                  <div className="border-t border-gray-100 my-4" />

                  <ul className="space-y-2 text-xs text-gray-500">
                    <li className="flex items-start gap-2">
                      <svg className="w-3.5 h-3.5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>All taxes &amp; fees included</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-3.5 h-3.5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Instant confirmation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-3.5 h-3.5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Free cancellation available</span>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </section>

          {displayHotel && (
            <section id="section-amenities" className="mt-6 scroll-mt-28">
              <HotelAmenitiesSection hotel={displayHotel} />
            </section>
          )}

          {displayHotel && (
            <section id="section-nearby" className="mt-6 scroll-mt-28">
              <NearbyAttractionsSection hotel={displayHotel} />
            </section>
          )}

          {displayHotel && (
            <section id="section-map" className="mt-6 scroll-mt-28">
              <HotelMapSection hotel={displayHotel} />
            </section>
          )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Page ──

export default function RoomsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <svg className="animate-spin w-10 h-10 text-[#e8262a]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    }>
      <RoomsContent />
    </Suspense>
  );
}
