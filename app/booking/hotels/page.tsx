'use client';

import { useEffect, useState, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

interface HotelRate {
  total: number;
  baseRate: number;
  currency: string;
}

interface Hotel {
  id: string;
  name: string;
  starRating: number;
  address: string;
  distance: number;
  heroImage: string;
  images: string[];
  facilities: Array<{ id: number; name: string }>;
  userReview: { count: number; rating: number } | null;
  rate: HotelRate | null;
  isRefundable: boolean | null;
  freeBreakfast: boolean | null;
  freeCancellation: boolean | null;
  isSoldOut: boolean;
  payAtHotel: boolean | null;
  chainName: string | null;
  propertyType: string;
}

interface FilterData {
  name: string;
  category: string;
  type: string;
  options: Array<{ min?: number; max?: number; value?: string; label: string; count: number }> | null;
}

interface SearchResponse {
  searchId: string;
  locationName: string;
  hotels: Hotel[];
  filters: FilterData[];
  total: number;
  currency: string;
}

type SortType = 'featured' | 'rating' | 'price';

// ── Helpers ──

function ratingLabel(r: number): string {
  if (r >= 4.5) return 'Excellent';
  if (r >= 4.0) return 'Very Good';
  if (r >= 3.5) return 'Good';
  if (r >= 3.0) return 'Average';
  return 'Poor';
}

function ratingColor(r: number): string {
  if (r >= 4.0) return 'bg-green-600';
  if (r >= 3.5) return 'bg-green-500';
  if (r >= 3.0) return 'bg-yellow-500';
  return 'bg-orange-500';
}

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
    year: '2-digit',
  });
}

function formatDateLong(d: string): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    weekday: 'long',
  });
}

// ── Star Rating ──
function Stars({ count }: { count: number }) {
  return (
    <span className="flex gap-0.5 items-center">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className={`w-3 h-3 ${i < count ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

// ── Sidebar Checkbox ──
function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <label onClick={onChange} className="flex items-center gap-2 cursor-pointer group py-1">
      <span className={`w-4 h-4 flex-shrink-0 border rounded flex items-center justify-center transition-colors ${checked ? 'bg-blue-600 border-blue-600' : 'border-gray-400 group-hover:border-blue-400'}`}>
        {checked && (
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}

// ── Collapsible Filter Section ──
function FilterSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-200 py-3">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-left"
      >
        <span className="font-bold text-sm text-gray-800 uppercase tracking-wide">{title}</span>
        <svg className={`w-4 h-4 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  );
}

// ── Hotel Card ──
function HotelCard({
  hotel,
  currency,
  searchId,
  checkIn,
  checkOut,
  nights,
}: {
  hotel: Hotel;
  currency: string;
  searchId: string;
  checkIn: string;
  checkOut: string;
  nights: number;
}) {
  const router = useRouter();
  const total = hotel.rate?.total ?? 0;
  const baseRate = hotel.rate?.baseRate ?? 0;
  // baseRate is the MRP (published/original), total is the after-discount price
  const hasSavings = baseRate > total && total > 0;
  const savings = hasSavings ? baseRate - total : 0;
  // Approximate tax as 10% of total for display (actual tax is in rooms step)
  const taxAmount = total > 0 ? Math.round(total * 0.1) : 0;

  const topFacilities = (hotel.facilities || []).slice(0, 5);

  function goToRooms() {
    const params = new URLSearchParams({ searchId, hotelId: hotel.id, checkIn, checkOut });
    router.push(`/booking/hotels/rooms?${params.toString()}`);
  }

  return (
    <div className="bg-white rounded border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex overflow-hidden">
      {/* Image */}
      <div className="w-48 flex-shrink-0 relative bg-gray-100">
        {hotel.heroImage ? (
          <img
            src={hotel.heroImage}
            alt={hotel.name}
            className="w-full h-full object-cover"
            style={{ minHeight: 180 }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center min-h-[180px] text-gray-300">
            <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        )}
        {hotel.isSoldOut && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-bold text-xs bg-red-600 px-2 py-1 rounded">SOLD OUT</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 p-4 gap-3 min-w-0">
        {/* Left: info */}
        <div className="flex-1 min-w-0">
          {/* Name + stars */}
          <div className="flex items-start gap-2 flex-wrap">
            <h3 className="font-bold text-gray-900 text-base leading-tight">{hotel.name}</h3>
            <Stars count={hotel.starRating} />
          </div>

          {/* Address */}
          <div className="flex items-start gap-1 mt-1">
            <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <p className="text-xs text-gray-500 line-clamp-1">{hotel.address}</p>
          </div>

          {/* Distance */}
          {hotel.distance > 0 && (
            <p className="text-xs text-blue-600 mt-0.5">{hotel.distance.toFixed(1)} km from city centre</p>
          )}

          {/* Facilities */}
          {topFacilities.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {topFacilities.map((f) => (
                <span key={f.id} className="flex items-center gap-1 text-xs text-gray-600 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded">
                  {f.name}
                </span>
              ))}
            </div>
          )}

          {/* Badges */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {hotel.freeBreakfast && (
              <span className="flex items-center gap-1 text-xs bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4h14v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                </svg>
                Breakfast Available
              </span>
            )}
            {hotel.freeCancellation && (
              <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded">Free Cancellation</span>
            )}
            {hotel.payAtHotel && (
              <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded">Pay at Hotel</span>
            )}
          </div>

          {/* Stay info */}
          <p className="text-xs text-gray-400 mt-2">
            {formatDate(checkIn)} – {formatDate(checkOut)} · {nights} Night{nights !== 1 ? 's' : ''} · 1 Room
          </p>
        </div>

        {/* Right: rating + price */}
        <div className="flex flex-col items-end justify-between flex-shrink-0 ml-2" style={{ minWidth: 150 }}>
          {/* Rating */}
          {hotel.userReview ? (
            <div className="flex flex-col items-end gap-0.5">
              <div className="flex items-center gap-1.5">
                <div className="text-right">
                  <div className="text-xs font-semibold text-gray-700">{ratingLabel(hotel.userReview.rating)}</div>
                  <div className="text-xs text-gray-400">{hotel.userReview.count.toLocaleString()} ratings</div>
                </div>
                <div className={`w-9 h-9 rounded flex items-center justify-center text-white font-bold text-sm ${ratingColor(hotel.userReview.rating)}`}>
                  {hotel.userReview.rating.toFixed(1)}
                </div>
              </div>
            </div>
          ) : <div />}

          {/* Price block */}
          <div className="text-right mt-2">
            {hotel.rate ? (
              <>
                {hasSavings && (
                  <div className="text-xs text-gray-400 line-through">{fmt(baseRate, currency)}</div>
                )}
                <div className="text-2xl font-bold text-gray-900">{fmt(total, currency)}</div>
                <div className="text-xs text-gray-500">+ {fmt(taxAmount, currency)} Tax and Fees</div>
                {hasSavings && (
                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    <span className="text-xs text-green-600 font-semibold">You Saved {fmt(savings, currency)}</span>
                    <svg className="w-3.5 h-3.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                <button
                  onClick={goToRooms}
                  disabled={hotel.isSoldOut}
                  className="mt-2 w-full px-4 py-2 bg-[#e8262a] hover:bg-[#c9191d] disabled:bg-gray-400 text-white text-sm font-bold rounded transition-colors"
                >
                  {hotel.isSoldOut ? 'Sold Out' : 'Select Room'}
                </button>
                <button className="mt-1.5 w-full flex items-center justify-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors py-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  Shortlist
                </button>
              </>
            ) : (
              <div className="flex flex-col items-end gap-2">
                <span className="text-sm text-gray-400 italic">Price unavailable</span>
                <button
                  onClick={goToRooms}
                  disabled={hotel.isSoldOut}
                  className="px-4 py-2 bg-[#e8262a] hover:bg-[#c9191d] disabled:bg-gray-400 text-white text-sm font-bold rounded transition-colors"
                >
                  {hotel.isSoldOut ? 'Sold Out' : 'Check Rooms'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sidebar ──
function Sidebar({
  hotels,
  filters,
  starFilter, setStarFilter,
  minRating, setMinRating,
  priceRange, setPriceRange,
  amenities, setAmenities,
  freeCancellation, setFreeCancellation,
  breakfast, setBreakfast,
  nameSearch, setNameSearch,
}: {
  hotels: Hotel[];
  filters: FilterData[];
  starFilter: number[];
  setStarFilter: (v: number[]) => void;
  minRating: number;
  setMinRating: (v: number) => void;
  priceRange: [number, number] | null;
  setPriceRange: (v: [number, number] | null) => void;
  amenities: string[];
  setAmenities: (v: string[]) => void;
  freeCancellation: boolean;
  setFreeCancellation: (v: boolean) => void;
  breakfast: boolean;
  setBreakfast: (v: boolean) => void;
  nameSearch: string;
  setNameSearch: (v: string) => void;
}) {
  // Compute star counts
  const starCounts = useMemo(() => {
    const map: Record<number, number> = {};
    for (const h of hotels) {
      const s = Math.round(h.starRating);
      map[s] = (map[s] || 0) + 1;
    }
    return map;
  }, [hotels]);

  // Amenity options from filter API or derive from hotels
  const amenityOptions = useMemo(() => {
    const apiFilter = filters.find(f => f.category === 'Amenities');
    if (apiFilter?.options) {
      return apiFilter.options.slice(0, 8).map(o => ({ label: o.label, value: o.value || o.label }));
    }
    // Derive top amenities from hotel facilities
    const map = new Map<string, number>();
    for (const h of hotels) {
      for (const f of (h.facilities || [])) {
        map.set(f.name, (map.get(f.name) || 0) + 1);
      }
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name]) => ({ label: name, value: name }));
  }, [filters, hotels]);

  // Price range options from API filter or default
  const priceOptions = useMemo(() => {
    const apiFilter = filters.find(f => f.category === 'PriceGroup');
    if (apiFilter?.options) return apiFilter.options;
    return [
      { min: 0, max: 3000, label: 'Upto ₹3,000', count: 0 },
      { min: 3000, max: 7000, label: '₹3,000 to ₹7,000', count: 0 },
      { min: 7000, max: 15000, label: '₹7,000 to ₹15,000', count: 0 },
      { min: 15000, max: -1, label: '₹15,000 & More', count: 0 },
    ];
  }, [filters]);

  function toggleStar(s: number) {
    setStarFilter(starFilter.includes(s) ? starFilter.filter(x => x !== s) : [...starFilter, s]);
  }

  function toggleAmenity(v: string) {
    setAmenities(amenities.includes(v) ? amenities.filter(x => x !== v) : [...amenities, v]);
  }

  function selectPriceRange(min: number, max: number) {
    const key: [number, number] = [min, max];
    if (priceRange && priceRange[0] === min && priceRange[1] === max) {
      setPriceRange(null);
    } else {
      setPriceRange(key);
    }
  }

  return (
    <aside className="w-56 flex-shrink-0">
      <div className="bg-white rounded border border-gray-200 p-3">
        {/* Hotel Name Search */}
        <FilterSection title="Hotel Name">
          <div className="flex items-center border border-gray-300 rounded px-2 py-1.5 gap-1.5 focus-within:border-blue-500">
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={nameSearch}
              onChange={e => setNameSearch(e.target.value)}
              placeholder="Search by hotel name"
              className="text-xs flex-1 outline-none text-gray-800 placeholder-gray-400"
            />
          </div>
        </FilterSection>

        {/* Popular Filters */}
        <FilterSection title="Popular Filter">
          <Checkbox checked={freeCancellation} onChange={() => setFreeCancellation(!freeCancellation)} label="Free Cancellation" />
          <Checkbox checked={breakfast} onChange={() => setBreakfast(!breakfast)} label="Breakfast Available" />
        </FilterSection>

        {/* Customer Ratings */}
        <FilterSection title="Customer Ratings">
          {[{ label: '4.5 & Above Excellent', val: 4.5 }, { label: '4 & Above Very Good', val: 4.0 }, { label: '3.5 & Above Good', val: 3.5 }].map(({ label, val }) => (
            <Checkbox
              key={val}
              checked={minRating === val}
              onChange={() => setMinRating(minRating === val ? 0 : val)}
              label={label}
            />
          ))}
        </FilterSection>

        {/* Star Rating */}
        <FilterSection title="Star Rating">
          {[5, 4, 3, 2, 1].map(s => (
            <label key={s} onClick={() => toggleStar(s)} className="flex items-center gap-2 cursor-pointer py-1 group">
              <span className={`w-4 h-4 flex-shrink-0 border rounded flex items-center justify-center transition-colors ${starFilter.includes(s) ? 'bg-blue-600 border-blue-600' : 'border-gray-400 group-hover:border-blue-400'}`}>
                {starFilter.includes(s) && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
              <Stars count={s} />
              <span className="text-xs text-gray-500 ml-auto">({starCounts[s] || 0})</span>
            </label>
          ))}
        </FilterSection>

        {/* Price Range */}
        <FilterSection title="Price Range">
          {priceOptions.map((opt, i) => {
            const min = opt.min ?? 0;
            const max = opt.max ?? -1;
            const selected = priceRange ? priceRange[0] === min && priceRange[1] === max : false;
            return (
              <Checkbox
                key={i}
                checked={selected}
                onChange={() => selectPriceRange(min, max)}
                label={opt.label}
              />
            );
          })}
        </FilterSection>

        {/* Amenities */}
        {amenityOptions.length > 0 && (
          <FilterSection title="Amenities" defaultOpen={false}>
            {amenityOptions.map((a, i) => (
              <Checkbox
                key={i}
                checked={amenities.includes(a.value)}
                onChange={() => toggleAmenity(a.value)}
                label={a.label}
              />
            ))}
          </FilterSection>
        )}
      </div>
    </aside>
  );
}

// ── Main Results ──
function HotelResults() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const locationId = searchParams.get('locationId') || '';
  const locationName = searchParams.get('locationName') || '';
  const lat = searchParams.get('lat') || '';
  const long = searchParams.get('long') || '';
  const checkIn = searchParams.get('checkIn') || '';
  const checkOut = searchParams.get('checkOut') || '';
  const roomsParam = searchParams.get('rooms') || '[{"adults":1,"children":0,"childAges":[]}]';

  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [nameSearch, setNameSearch] = useState('');
  const [starFilter, setStarFilter] = useState<number[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [freeCancellation, setFreeCancellation] = useState(false);
  const [breakfast, setBreakfast] = useState(false);
  const [sort, setSort] = useState<SortType>('featured');

  const nights = checkIn && checkOut
    ? Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
    : 1;

  const rooms = useMemo(() => {
    try { return JSON.parse(roomsParam); } catch { return [{ adults: 1, children: 0 }]; }
  }, [roomsParam]);

  const totalGuests = rooms.reduce((s: number, r: { adults: number; children: number }) => s + r.adults + r.children, 0);

  // Search — step 1: POST to get searchId immediately, step 2: poll for results
  useEffect(() => {
    if (!lat || !long || !checkIn || !checkOut) {
      setError('Missing search parameters.');
      setLoading(false);
      return;
    }

    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let timeoutTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const search = async () => {
      setLoading(true);
      setError('');
      try {
        // Step 1: initiate — returns {searchId} instantly
        const res = await fetch(`${API_URL}/hotels/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            locationId,
            locationName,
            lat,
            long,
            checkIn,
            checkOut,
            rooms,
            nationality: 'IN',
            countryOfResidence: 'IN',
            destinationCountryCode: 'IN',
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { message?: string }).message || `Search failed (${res.status})`);
        }
        const { searchId } = await res.json() as { searchId: string };

        // Step 2: poll GET /hotels/results/:searchId (cheap Redis reads)
        const poll = async () => {
          if (cancelled) return;
          try {
            const r = await fetch(`${API_URL}/hotels/results/${searchId}`);
            if (!r.ok || cancelled) return;
            const data = await r.json() as
              | { status: 'pending' }
              | { status: 'ready'; data: SearchResponse }
              | { status: 'error'; message: string };

            if (data.status === 'ready') {
              if (pollTimer) clearInterval(pollTimer);
              if (timeoutTimer) clearTimeout(timeoutTimer);
              setResults(data.data);
              setLoading(false);
            } else if (data.status === 'error') {
              if (pollTimer) clearInterval(pollTimer);
              if (timeoutTimer) clearTimeout(timeoutTimer);
              setError(data.message || 'Search failed. Please try again.');
              setLoading(false);
            }
            // 'pending' → keep polling
          } catch {
            // transient network error — keep polling
          }
        };

        poll(); // check immediately
        pollTimer = setInterval(poll, 3000);

        // Timeout after 75s (Benzy rate timeout is 60s + buffer)
        timeoutTimer = setTimeout(() => {
          if (cancelled) return;
          if (pollTimer) clearInterval(pollTimer);
          setError('Hotel search timed out. Please try again.');
          setLoading(false);
        }, 75_000);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Search failed. Please try again.');
        setLoading(false);
      }
    };

    search();

    return () => {
      cancelled = true;
      if (pollTimer) clearInterval(pollTimer);
      if (timeoutTimer) clearTimeout(timeoutTimer);
    };
  }, [locationId, lat, long, checkIn, checkOut, roomsParam, locationName]);

  // Filtered + sorted hotels
  const displayed = useMemo(() => {
    if (!results) return [];
    let list = [...results.hotels];

    if (nameSearch) {
      const q = nameSearch.toLowerCase();
      list = list.filter(h => h.name.toLowerCase().includes(q));
    }
    if (starFilter.length > 0) {
      list = list.filter(h => starFilter.includes(Math.round(h.starRating)));
    }
    if (minRating > 0) {
      list = list.filter(h => (h.userReview?.rating ?? 0) >= minRating);
    }
    if (priceRange) {
      const [min, max] = priceRange;
      list = list.filter(h => {
        const p = h.rate?.total ?? 0;
        return p >= min && (max === -1 || p <= max);
      });
    }
    if (freeCancellation) list = list.filter(h => h.freeCancellation);
    if (breakfast) list = list.filter(h => h.freeBreakfast);
    if (amenities.length > 0) {
      list = list.filter(h =>
        amenities.every(a =>
          (h.facilities || []).some(f => f.name === a)
        )
      );
    }

    if (sort === 'price') {
      list.sort((a, b) => {
        if (a.rate && b.rate) return a.rate.total - b.rate.total;
        if (a.rate) return -1;
        if (b.rate) return 1;
        return 0;
      });
    } else if (sort === 'rating') {
      list.sort((a, b) => (b.userReview?.rating ?? 0) - (a.userReview?.rating ?? 0));
    } else {
      // featured: priced first, then by savings desc
      list.sort((a, b) => {
        const aHasRate = a.rate !== null ? 1 : 0;
        const bHasRate = b.rate !== null ? 1 : 0;
        if (aHasRate !== bHasRate) return bHasRate - aHasRate;
        if (a.rate && b.rate) {
          const aSave = a.rate.baseRate - a.rate.total;
          const bSave = b.rate.baseRate - b.rate.total;
          return bSave - aSave;
        }
        return 0;
      });
    }

    return list;
  }, [results, nameSearch, starFilter, minRating, priceRange, freeCancellation, breakfast, amenities, sort]);

  const hasActiveFilters = nameSearch || starFilter.length > 0 || minRating > 0 || priceRange || freeCancellation || breakfast || amenities.length > 0;

  function clearFilters() {
    setNameSearch('');
    setStarFilter([]);
    setMinRating(0);
    setPriceRange(null);
    setFreeCancellation(false);
    setBreakfast(false);
    setAmenities([]);
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ── Top Bar ── */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-6 flex-wrap">
          {/* City */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-[#e8262a]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="font-bold text-gray-900 text-lg">{locationName || 'Hotels'}</span>
          </div>

          <div className="h-8 w-px bg-gray-200 hidden sm:block" />

          {/* Check-in */}
          <div className="text-sm">
            <div className="text-xs text-gray-500">Check-In</div>
            <div className="font-semibold text-gray-800">{formatDateLong(checkIn)}</div>
          </div>

          {/* Nights badge */}
          <div className="flex flex-col items-center px-3 py-1 border border-gray-300 rounded-full text-xs font-bold text-gray-600">
            {nights} Night{nights !== 1 ? 's' : ''}
          </div>

          {/* Check-out */}
          <div className="text-sm">
            <div className="text-xs text-gray-500">Check-Out</div>
            <div className="font-semibold text-gray-800">{formatDateLong(checkOut)}</div>
          </div>

          <div className="h-8 w-px bg-gray-200 hidden sm:block" />

          {/* Rooms & Guests */}
          <div className="text-sm">
            <div className="text-xs text-gray-500">Rooms &amp; Guests</div>
            <div className="font-semibold text-gray-800">{rooms.length} Room{rooms.length !== 1 ? 's' : ''} · {totalGuests} Guest{totalGuests !== 1 ? 's' : ''}</div>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Actions */}
          <button className="p-2 border border-gray-300 rounded hover:bg-gray-50 text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 border-2 border-[#1a2b6b] text-[#1a2b6b] font-bold text-sm rounded hover:bg-[#1a2b6b] hover:text-white transition-colors"
          >
            Modify Search
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-7xl mx-auto px-4 py-5">
        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <svg className="w-12 h-12 text-[#e8262a] animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <p className="text-gray-500 font-medium">Searching hotels in {locationName}…</p>
            <p className="text-xs text-gray-400">Comparing prices from multiple providers</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <svg className="w-16 h-16 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <p className="text-gray-700 font-semibold text-lg">{error}</p>
            <button onClick={() => router.back()} className="px-6 py-2 bg-[#e8262a] text-white rounded font-bold">Go Back</button>
          </div>
        )}

        {/* Results */}
        {!loading && !error && results && (
          <div className="flex gap-4 items-start">
            {/* Sidebar */}
            <Sidebar
              hotels={results.hotels}
              filters={results.filters || []}
              starFilter={starFilter} setStarFilter={setStarFilter}
              minRating={minRating} setMinRating={setMinRating}
              priceRange={priceRange} setPriceRange={setPriceRange}
              amenities={amenities} setAmenities={setAmenities}
              freeCancellation={freeCancellation} setFreeCancellation={setFreeCancellation}
              breakfast={breakfast} setBreakfast={setBreakfast}
              nameSearch={nameSearch} setNameSearch={setNameSearch}
            />

            {/* Main */}
            <div className="flex-1 min-w-0">
              {/* Result count + sort */}
              <div className="flex items-center justify-between mb-3 bg-white rounded border border-gray-200 px-4 py-3">
                <p className="text-sm text-gray-600">
                  Showing <span className="font-bold text-gray-900">{displayed.length}</span> of{' '}
                  <span className="font-bold text-gray-900">{results.total}</span> hotels found
                </p>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500 font-semibold mr-1">SORT BY</span>
                  {(['featured', 'rating', 'price'] as SortType[]).map(s => (
                    <button
                      key={s}
                      onClick={() => setSort(s)}
                      className={`px-3 py-1.5 text-xs font-bold rounded transition-colors uppercase tracking-wide ${sort === s ? 'text-[#e8262a] border-b-2 border-[#e8262a]' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      {s === 'featured' ? (
                        <span className="flex items-center gap-1">
                          {s.toUpperCase()}
                          {sort === 'featured' && (
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                            </svg>
                          )}
                        </span>
                      ) : s.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active filter pills */}
              {hasActiveFilters && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {nameSearch && (
                    <span className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                      "{nameSearch}"
                      <button onClick={() => setNameSearch('')} className="hover:text-blue-900">×</button>
                    </span>
                  )}
                  {freeCancellation && (
                    <span className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                      Free Cancellation
                      <button onClick={() => setFreeCancellation(false)} className="hover:text-blue-900">×</button>
                    </span>
                  )}
                  {breakfast && (
                    <span className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                      Breakfast Available
                      <button onClick={() => setBreakfast(false)} className="hover:text-blue-900">×</button>
                    </span>
                  )}
                  {starFilter.map(s => (
                    <span key={s} className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                      {s}★
                      <button onClick={() => setStarFilter(starFilter.filter(x => x !== s))} className="hover:text-blue-900">×</button>
                    </span>
                  ))}
                  <button onClick={clearFilters} className="text-xs text-red-500 hover:underline font-semibold px-1">Clear all</button>
                </div>
              )}

              {/* Hotel cards */}
              {displayed.length === 0 ? (
                <div className="bg-white rounded border border-gray-200 flex flex-col items-center py-20 gap-3 text-gray-400">
                  <svg className="w-16 h-16 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <p className="font-medium text-gray-500">No hotels match your filters.</p>
                  {hasActiveFilters && (
                    <button onClick={clearFilters} className="text-sm text-[#e8262a] font-bold hover:underline">Clear filters</button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {displayed.map((hotel) => (
                    <HotelCard
                      key={hotel.id}
                      hotel={hotel}
                      currency={results.currency || 'INR'}
                      searchId={results.searchId}
                      checkIn={checkIn}
                      checkOut={checkOut}
                      nights={nights}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HotelResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <svg className="w-10 h-10 text-[#e8262a] animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      </div>
    }>
      <HotelResults />
    </Suspense>
  );
}
