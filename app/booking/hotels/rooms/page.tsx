'use client';

import { Suspense, useEffect, useState } from 'react';
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
  pricingId: string;
  hotelId: string;
  roomName: string;
  roomDescription: string | null;
  providerName: string;
  baseRate: number;
  totalRate: number;
  publishedRate: number;
  taxes: TaxItem[];
  refundable: boolean;
  cardRequired: boolean;
  boardBasis: string | null;
  boardBasisType: string;
  cancellationPolicies: CancellationPolicy[];
  currency: string;
  availability: number;
}

interface HotelDetailInfo {
  id: string;
  name: string;
  starRating: number;
  address: string;
  city: string;
  country: string;
  heroImage: string | null;
  facilities: RoomFacility[];
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
            {room.roomDescription && (
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{room.roomDescription}</p>
            )}

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
      {pricing.roomDescription && (
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{pricing.roomDescription}</p>
      )}

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
        {pricing.taxes.length > 0 && (
          pricing.taxes.map((tax, i) => (
            <div key={i} className="flex justify-between text-gray-500 text-xs">
              <span>{tax.description || 'Tax & Fees'}</span>
              <span>{fmt(tax.amount, pricing.currency)}</span>
            </div>
          ))
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

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 mt-3">
        {pricing.refundable && (
          <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded">Free Cancellation</span>
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

// ── Main Content ──

function RoomsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const searchId = searchParams.get('searchId') || '';
  const hotelId = searchParams.get('hotelId') || '';
  const checkIn = searchParams.get('checkIn') || '';
  const checkOut = searchParams.get('checkOut') || '';
  const nights = nightsBetween(checkIn, checkOut);

  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [hotelDetail, setHotelDetail] = useState<HotelDetailInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedRoom, setSelectedRoom] = useState<RoomOption | null>(null);
  const [pricing, setPricing] = useState<HotelPricingDetail | null>(null);
  const [pricingHotelDetail, setPricingHotelDetail] = useState<HotelDetailInfo | null>(null);
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
      body: JSON.stringify({ searchId, hotelId }),
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
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, [searchId, hotelId]);

  async function selectRoom(room: RoomOption) {
    setSelectedRoom(room);
    setPricing(null);
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
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to fetch room pricing');
      }

      const data = await res.json() as { pricing: HotelPricingDetail; hotelDetail: HotelDetailInfo | null };
      setPricing(data.pricing);
      setPricingHotelDetail(data.hotelDetail);
    } catch (err: unknown) {
      setPricingError(err instanceof Error ? err.message : 'Failed to fetch pricing');
    } finally {
      setPricingLoading(false);
    }
  }

  function handleBook() {
    if (!pricing) return;
    const params = new URLSearchParams({
      pricingId: pricing.pricingId,
      searchId,
      hotelId,
      recommendationId: pricing.pricingId,
      checkIn,
      checkOut,
    });
    router.push(`/booking/hotels/book?${params.toString()}`);
  }

  const displayHotel = pricingHotelDetail || hotelDetail;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Hotels
          </button>

          {displayHotel && (
            <>
              <div className="w-px h-5 bg-gray-300" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900">{displayHotel.name}</span>
                  <Stars count={displayHotel.starRating} />
                </div>
                <p className="text-xs text-gray-500">{displayHotel.address}</p>
              </div>
            </>
          )}

          <div className="ml-auto flex items-center gap-3 text-sm text-gray-600">
            <span>{formatDate(checkIn)}</span>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span>{formatDate(checkOut)}</span>
            <span className="text-gray-400">·</span>
            <span>{nights} night{nights !== 1 ? 's' : ''}</span>
          </div>
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
          <div className="flex gap-6">
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
                <div className="space-y-4">
                  {rooms.map((room) => (
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
              )}
            </div>

            {/* Pricing sidebar */}
            <div className="w-72 flex-shrink-0">
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
                <div className="bg-white rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">
                  <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
                  </svg>
                  Select a room to see the final price
                </div>
              )}
            </div>
          </div>
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
