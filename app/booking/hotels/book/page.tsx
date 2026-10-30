'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authHeaders } from '@/lib/api';
import { useRequireAuth } from '@/contexts/AuthContext';
import { formatDeadline } from '@/components/HotelResults/FreeCancellationBadge';
import { AlertTriangle } from 'lucide-react';
import {
  BookButton,
  ResultsEmpty,
  ResultsLoader,
  StepHeader,
  StepState,
} from '@/components/Results/ui';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

// ── Types (mirrored from rooms page / backend DTOs) ──

type Title = 'Mr' | 'Mrs' | 'Ms' | 'Miss' | 'Mstr';

interface StashedBookingContext {
  searchId: string;
  hotelId: string;
  hotelCode: string;
  providerName: string;
  recommendationId: string;
  priceId: string;
  destinationCountryCode: string | null;
  searchTracingKey: string;
  checkIn: string; // MM/DD/YYYY (Benzy)
  checkOut: string;
  uiCheckIn: string; // YYYY-MM-DD
  uiCheckOut: string;
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

interface CancellationRule {
  value: number;
  start: string;
  end: string;
}

interface CancellationPolicy {
  text: string | null;
  rules: CancellationRule[] | null;
}

interface StashedPricing {
  roomName: string;
  totalRate: number;
  baseRate: number;
  perRoomRates: Array<{ baseRate: number; totalRate: number }>;
  currency: string;
  taxes: Array<{ amount: number; description: string | null }>;
  discounts: Array<{ amount: number; description: string | null }>;
  tcsOnTotal: number;
  refundable: boolean;
  boardBasis: string | null;
  payAtHotel: boolean;
  depositRequired: boolean;
  depositAmount: number | null;
  allGuestsInfoRequired: boolean;
  specialRequestSupported: boolean;
  gstAllowed: boolean;
  needsPriceCheck: boolean;
  cancellationPolicies?: CancellationPolicy[];
  // ISO 8601 (+05:30) instant free cancellation stops; null when the supplier
  // gave no parseable deadline.
  freeCancellationUntil?: string | null;
}

interface StashedSelectedRoom {
  roomId: string;
  roomGroupId: string;
  supplierName: string;
}

interface StashedOccupancy {
  adults: number;
  children: number;
  childAges?: number[];
}

interface StashedHotelDetail {
  name?: string;
  starRating?: number;
  address?: string;
  city?: string;
  country?: string;
  heroImage?: string | null;
  images?: Array<{ url: string; caption?: string }>;
  checkinInfo?: {
    beginTime: string | null;
    endTime: string | null;
    instructions: string[] | null;
    specialInstructions: string[] | null;
    minAge: number;
  };
  checkoutInfo?: { time: string | null };
}

interface Stash {
  bookingContext: StashedBookingContext;
  pricing: StashedPricing;
  hotelDetail: StashedHotelDetail | null;
  selectedRoom: StashedSelectedRoom;
  occupancy: StashedOccupancy[];
}

interface GuestForm {
  title: Title;
  firstName: string;
  lastName: string;
  paxType: 'A' | 'C';
  age: string;
  email: string;
  mobile: string;
  pan: string;
}

interface ContactForm {
  title: Title;
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
}

// ── Helpers ──

function fmt(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatMonthDay(d: string): { month: string; day: string; weekday: string } {
  if (!d) return { month: '', day: '', weekday: '' };
  const date = new Date(d);
  return {
    month: date.toLocaleDateString('en-IN', { month: 'short' }),
    day: date.toLocaleDateString('en-IN', { day: '2-digit' }),
    weekday: date.toLocaleDateString('en-IN', { weekday: 'short' }),
  };
}

function nightsBetween(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 1;
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
}

function makeBlankGuest(paxType: 'A' | 'C'): GuestForm {
  return {
    title: paxType === 'A' ? 'Mr' : 'Mstr',
    firstName: '',
    lastName: '',
    paxType,
    age: '',
    email: '',
    mobile: '',
    pan: '',
  };
}

function buildRooms(occupancy: StashedOccupancy[]): GuestForm[][] {
  return occupancy.map((o) => {
    const adults = Array.from({ length: Math.max(1, o.adults) }, () => makeBlankGuest('A'));
    const children = Array.from({ length: o.children || 0 }, (_, i) => ({
      ...makeBlankGuest('C'),
      age: String(o.childAges?.[i] ?? ''),
    }));
    return [...adults, ...children];
  });
}

function isIndianMobile(m: string): boolean {
  return /^\d{10}$/.test(m.trim());
}

function isEmail(e: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
}

// Benzy sometimes ships policies as HTML (ul/li/br/p/strong). Convert to a flat list
// of clean lines so we can render each one as an <li>.
function htmlToLines(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const cleaned = raw
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6]|ul|ol)>/gi, '\n')
    .replace(/<li\b[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/[ \t]+/g, ' ');
  return cleaned
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

function flattenPolicy(items: (string | null | undefined)[]): string[] {
  return items.flatMap((s) => htmlToLines(s));
}

function Stars({ count }: { count: number }) {
  return (
    <span className="inline-flex gap-0.5 align-middle">
      {Array.from({ length: Math.max(0, count) }).map((_, i) => (
        <svg key={i} className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

// Expandable disclosure used by fare summary rows
function DisclosureRow({
  label,
  amount,
  currency,
  children,
  initiallyOpen = false,
  valueClassName,
}: {
  label: string;
  amount: number;
  currency: string;
  children?: React.ReactNode;
  initiallyOpen?: boolean;
  valueClassName?: string;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  const hasChildren = !!children;
  return (
    <div>
      <button
        type="button"
        onClick={() => hasChildren && setOpen((o) => !o)}
        className={`w-full flex justify-between items-center text-sm py-1.5 ${
          hasChildren ? 'cursor-pointer hover:text-gray-900' : 'cursor-default'
        }`}
      >
        <span className="flex items-center gap-1 text-gray-700">
          {hasChildren && (
            <svg
              className={`w-3 h-3 transition-transform ${open ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          )}
          {label}
        </span>
        <span className={valueClassName ?? 'font-medium text-gray-900'}>{fmt(amount, currency)}</span>
      </button>
      {open && hasChildren && <div className="pl-4 pb-1 text-xs space-y-1">{children}</div>}
    </div>
  );
}

// ── Page ──

function HotelBookPageInner() {
  useRequireAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchId = searchParams.get('searchId') || '';

  const [stash, setStash] = useState<Stash | null>(null);
  const [stashError, setStashError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('hotelBookingContext');
      if (!raw) {
        setStashError('Booking session expired. Please re-select your room.');
        return;
      }
      const parsed = JSON.parse(raw) as Stash;
      if (!parsed?.bookingContext || !parsed?.pricing || !parsed?.selectedRoom) {
        setStashError('Booking session is incomplete. Please re-select your room.');
        return;
      }
      setStash(parsed);
    } catch {
      setStashError('Could not load booking session. Please re-select your room.');
    }
  }, []);

  const pricing = stash?.pricing ?? null;
  const bookingContext = stash?.bookingContext ?? null;
  const hotelDetail = stash?.hotelDetail ?? null;
  const occupancy = stash?.occupancy ?? [{ adults: 1, children: 0 }];

  const [contact, setContact] = useState<ContactForm>({
    title: 'Mr',
    firstName: '',
    lastName: '',
    mobile: '',
    email: '',
  });

  const [guestsByRoom, setGuestsByRoom] = useState<GuestForm[][]>([]);
  const [specialRequest, setSpecialRequest] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (stash) setGuestsByRoom(buildRooms(stash.occupancy));
  }, [stash]);

  const showAllGuests = pricing?.allGuestsInfoRequired ?? false;
  const showSpecial = pricing?.specialRequestSupported ?? false;

  const totalGuests = useMemo(
    () => guestsByRoom.reduce((sum, r) => sum + r.length, 0),
    [guestsByRoom],
  );

  const totalRooms = guestsByRoom.length || occupancy.length;

  const nights = useMemo(
    () => nightsBetween(bookingContext?.uiCheckIn || '', bookingContext?.uiCheckOut || ''),
    [bookingContext],
  );

  const checkInParts = formatMonthDay(bookingContext?.uiCheckIn || '');
  const checkOutParts = formatMonthDay(bookingContext?.uiCheckOut || '');

  const heroImage =
    hotelDetail?.heroImage ||
    hotelDetail?.images?.[0]?.url ||
    null;

  const addressLine = [hotelDetail?.address, hotelDetail?.city, hotelDetail?.country]
    .filter(Boolean)
    .join(', ');

  // Fare summary shows a single all-inclusive room rate - taxes, TCS and
  // discounts are already folded into pricing.totalRate and are not itemised.
  const roomCount = pricing?.perRoomRates?.length || 1;

  function updateContact<K extends keyof ContactForm>(key: K, value: ContactForm[K]) {
    setContact((c) => ({ ...c, [key]: value }));
  }

  function updateGuest(roomIdx: number, guestIdx: number, patch: Partial<GuestForm>) {
    setGuestsByRoom((prev) =>
      prev.map((r, i) =>
        i === roomIdx ? r.map((g, j) => (j === guestIdx ? { ...g, ...patch } : g)) : r,
      ),
    );
  }

  function validate(): string | null {
    if (!isEmail(contact.email)) return 'Please enter a valid contact email.';
    if (!isIndianMobile(contact.mobile)) return 'Please enter a valid 10-digit contact mobile.';

    const primary = guestsByRoom[0]?.[0];
    if (!primary || !primary.firstName.trim() || !primary.lastName.trim()) {
      return 'Please enter the primary traveller name in Room 1.';
    }

    for (let r = 0; r < guestsByRoom.length; r++) {
      for (let g = 0; g < guestsByRoom[r].length; g++) {
        const guest = guestsByRoom[r][g];
        const isPrimary = r === 0 && g === 0;
        if (showAllGuests || isPrimary) {
          if (!guest.firstName.trim() || !guest.lastName.trim()) {
            return `Please enter name for Room ${r + 1}, ${guest.paxType === 'C' ? 'child' : 'adult'} ${g + 1}.`;
          }
        }
        if (guest.paxType === 'C' && !guest.age.trim()) {
          return `Please enter age for child in Room ${r + 1}.`;
        }
      }
    }

    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!bookingContext || !stash || !pricing) return;

    const err = validate();
    if (err) {
      setSubmitError(err);
      return;
    }
    if (bookingContext.roomSlots.length < guestsByRoom.length) {
      setSubmitError(
        `Pricing returned ${bookingContext.roomSlots.length} room slots but ${guestsByRoom.length} rooms need booking. Please re-run pricing.`,
      );
      return;
    }
    setSubmitError(null);
    setSubmitting(true);

    const primaryGuest = guestsByRoom[0]?.[0];
    const contactTitle: Exclude<Title, 'Mstr'> =
      primaryGuest && primaryGuest.title !== 'Mstr' ? (primaryGuest.title as Exclude<Title, 'Mstr'>) : 'Mr';

    const body = {
      searchId: bookingContext.searchId,
      recommendationId: bookingContext.recommendationId,
      hotelCode: bookingContext.hotelCode,
      // The total shown here; the server charges its own quote and refuses the
      // booking if the two disagree.
      expectedAmount: pricing.totalRate,
      destinationCountryCode: bookingContext.destinationCountryCode,
      searchTracingKey: bookingContext.searchTracingKey,
      locationName: bookingContext.locationName,
      checkInDate: bookingContext.uiCheckIn,
      checkOutDate: bookingContext.uiCheckOut,
      contactInfo: {
        title: contactTitle,
        firstName: primaryGuest?.firstName || '',
        lastName: primaryGuest?.lastName || '',
        mobile: contact.mobile,
        email: contact.email,
        countryCode: 'IN',
        mobileCountryCode: '+91',
        gstCompanyName: '',
        gstTin: '',
        gstMobile: '',
        gstEmail: '',
      },
      rooms: guestsByRoom.map((guests, roomIdx) => {
        const slot = bookingContext.roomSlots[roomIdx];
        return {
          roomId: slot.roomId,
          roomGroupId: slot.roomGroupId,
          supplierName: slot.supplierName,
          occupancyId: slot.occupancyId,
          pricingChildAges: slot.childAges,
          guests: guests.map((g) => ({
            title: g.title,
            firstName: g.firstName,
            lastName: g.lastName,
            paxType: g.paxType,
            age: g.age,
            email: g.email,
            mobile: g.mobile,
            pan: g.pan,
          })),
        };
      }),
      specialRequest: showSpecial ? specialRequest : '',
      travelingFor: 'NTF',
    };

    try {
      const res = await fetch(`${API_URL}/hotels/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Could not start payment. Please try again.');
      // Pay first: the hotel is booked once the bank confirms the payment, and
      // the voucher is shown on /booking/hotels/payment-result.
      try { sessionStorage.removeItem('hotelBookingContext'); } catch { /* ignore */ }
      window.location.href = data.redirectUrl;
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : 'Could not start payment');
      setSubmitting(false);
    }
  }

  // ── Render ──

  if (stashError) {
    return (
      <StepState>
        <ResultsEmpty
          icon={AlertTriangle}
          title="Session expired"
          message={stashError}
          action={{ label: 'Start over', href: '/?tab=hotel#booking' }}
        />
      </StepState>
    );
  }

  if (!stash || !pricing || !bookingContext) {
    return (
      <StepState>
        <ResultsLoader title="Loading booking..." subtitle="Confirming the latest room price with the hotel." rows={2} />
      </StepState>
    );
  }


  const checkInInstructions = flattenPolicy(hotelDetail?.checkinInfo?.instructions || []);
  const checkInSpecial = flattenPolicy(hotelDetail?.checkinInfo?.specialInstructions || []);
  const cancellationNotes = flattenPolicy((pricing.cancellationPolicies || []).map((p) => p.text));

  return (
    <div className="min-h-screen bg-(--color-background) pb-12">
      <StepHeader
        title="Complete Your Booking"
        subtitle={`${hotelDetail?.name || 'Hotel'} · ${nights} Night${nights !== 1 ? 's' : ''}`}
        onBack={() => router.back()}
      />

      <form onSubmit={handleSubmit} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-4">

          {/* Hotel card */}
          <section className="bg-white rounded-2xl border border-(--color-tertiary-button) shadow-sm">
            <div className="p-5 pb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2 flex-wrap">
                  <span className="truncate">{hotelDetail?.name || 'Hotel'}</span>
                  {(hotelDetail?.starRating ?? 0) > 0 && <Stars count={hotelDetail!.starRating!} />}
                </h2>
                {addressLine && (
                  <p className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                    <svg className="w-3.5 h-3.5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <span className="truncate">{addressLine}</span>
                  </p>
                )}
              </div>
              <span className={`text-xs font-medium whitespace-nowrap ${pricing.refundable ? 'text-green-600' : 'text-red-500'}`}>
                {pricing.refundable ? 'Refundable' : 'Non-Refundable'}
              </span>
            </div>

            <div className="px-5 pb-5 grid grid-cols-[auto_1fr_auto] gap-5 items-start">
              {heroImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={heroImage} alt={hotelDetail?.name || 'Hotel'} className="w-40 h-28 object-cover rounded" />
              ) : (
                <div className="w-40 h-28 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">No image</div>
              )}

              <div className="flex items-start gap-6">
                <div>
                  <p className="text-[10px] font-semibold text-gray-500 tracking-wider">CHECK-IN</p>
                  <p className="text-lg font-bold text-slate-800 leading-tight">
                    {checkInParts.month} <span>{checkInParts.day}</span>
                  </p>
                  <p className="text-xs text-gray-600">{checkInParts.weekday}, 2:00 PM</p>
                </div>

                <div className="flex flex-col items-center pt-4">
                  <span className="text-xs text-gray-500 border-t border-dashed border-gray-400 px-3 pt-0.5">{nights} Night{nights !== 1 ? 's' : ''}</span>
                </div>

                <div>
                  <p className="text-[10px] font-semibold text-gray-500 tracking-wider">CHECK-OUT</p>
                  <p className="text-lg font-bold text-slate-800 leading-tight">
                    {checkOutParts.month} <span>{checkOutParts.day}</span>
                  </p>
                  <p className="text-xs text-gray-600">{checkOutParts.weekday}, 12:00 PM</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => router.back()}
                className="text-xs font-semibold text-(--color-links) hover:text-(--color-secondary-button) uppercase tracking-wider"
              >
                Change Room
              </button>
            </div>

            <div className="px-5 pb-5 text-xs text-gray-600">
              <p className="text-[10px] font-semibold text-gray-500 tracking-wider mb-0.5">ROOMS & GUESTS</p>
              <p className="text-sm text-slate-700">
                <span className="font-semibold">{totalRooms}</span> Room{totalRooms !== 1 ? 's' : ''}{' '}
                <span className="font-semibold">{totalGuests}</span> Guest{totalGuests !== 1 ? 's' : ''}
              </p>
            </div>

            {guestsByRoom.map((room, idx) => (
              <div
                key={idx}
                className="border-t border-gray-200 px-5 py-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    {totalRooms > 1 ? `Room ${idx + 1}: ` : ''}{pricing.roomName}
                  </p>
                  {idx === 0 && pricing.boardBasis && (
                    <p className="text-xs text-gray-500 mt-0.5">{pricing.boardBasis}</p>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {room.length} {room.length === 1 ? 'ADULT' : 'GUESTS'}
                </p>
              </div>
            ))}
          </section>

          {/* Traveller Details */}
          <section className="bg-white rounded-2xl border border-(--color-tertiary-button) shadow-sm p-5">
            <h2 className="text-base font-bold text-(--color-foreground) mb-1">Traveller Details</h2>


            <div className="space-y-4">
              {guestsByRoom.map((room, roomIdx) => (
                <div key={roomIdx} className="border border-gray-200 rounded">
                  <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 text-sm font-semibold text-slate-700">
                    Room {roomIdx + 1}
                  </div>
                  <div className="p-3 space-y-2">
                    {room.map((guest, guestIdx) => {
                      const adultsInRoom = occupancy[roomIdx]?.adults || 0;
                      const isPrimary = roomIdx === 0 && guestIdx === 0;
                      const showThisGuest = showAllGuests || isPrimary;
                      const isChild = guest.paxType === 'C';
                      const label = isChild
                        ? `Child ${guestIdx - adultsInRoom + 1}`
                        : `Adult ${guestIdx + 1}`;
                      return (
                        <div key={guestIdx} className="flex flex-wrap items-center gap-2">
                          <span className="text-xs text-gray-600 w-16 shrink-0">{label}</span>
                          {showThisGuest ? (
                            <>
                              <select
                                value={guest.title}
                                onChange={(e) => updateGuest(roomIdx, guestIdx, { title: e.target.value as Title })}
                                className="border border-gray-300 rounded px-2 py-2 text-sm bg-white min-w-[80px]"
                              >
                                {isChild ? (
                                  <>
                                    <option value="Mstr">Mstr</option>
                                    <option value="Miss">Miss</option>
                                  </>
                                ) : (
                                  <>
                                    <option value="Mr">Mr</option>
                                    <option value="Mrs">Mrs</option>
                                    <option value="Ms">Ms</option>
                                    <option value="Miss">Miss</option>
                                  </>
                                )}
                              </select>
                              <input
                                value={guest.firstName}
                                onChange={(e) => updateGuest(roomIdx, guestIdx, { firstName: e.target.value })}
                                placeholder="First Name / Given Name"
                                className="flex-1 min-w-[140px] border border-gray-300 rounded px-3 py-2 text-sm"
                              />
                              <input
                                value={guest.lastName}
                                onChange={(e) => updateGuest(roomIdx, guestIdx, { lastName: e.target.value })}
                                placeholder="Last Name / Surname"
                                className="flex-1 min-w-[140px] border border-gray-300 rounded px-3 py-2 text-sm"
                              />
                            </>
                          ) : (
                            <span className="text-xs text-gray-400 italic flex-1">Name not required by this hotel.</span>
                          )}
                          {isChild && (
                            <input
                              type="number"
                              min="0"
                              max="17"
                              value={guest.age}
                              onChange={(e) => updateGuest(roomIdx, guestIdx, { age: e.target.value })}
                              placeholder="Age"
                              className="w-20 border border-gray-300 rounded px-2 py-2 text-sm"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Contact information */}
          <section className="bg-white rounded-2xl border border-(--color-tertiary-button) shadow-sm overflow-hidden">
            <div className="px-5 pt-5 pb-3 border-b border-gray-200">
              <h2 className="text-base font-bold text-(--color-foreground)">Contact Information</h2>
            </div>

            <div className="p-5 space-y-5">
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded px-4 py-3">
                <svg className="w-5 h-5 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l9 6 9-6M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-gray-700">Your ticket and hotel information will be sent here</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Mobile <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="relative">
                      <select
                        value="+91"
                        onChange={() => { /* single-country for now */ }}
                        className="appearance-none border border-gray-300 rounded px-3 py-2.5 pr-8 text-sm bg-white text-gray-700 focus:outline-none focus:border-gray-400"
                      >
                        <option value="+91">+91</option>
                      </select>
                      <svg className="w-3.5 h-3.5 text-gray-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    <input
                      type="tel"
                      value={contact.mobile}
                      onChange={(e) => updateContact('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="Mobile number"
                      className="flex-1 border border-gray-300 rounded px-3 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:border-gray-400"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={contact.email}
                    onChange={(e) => updateContact('email', e.target.value)}
                    placeholder="Email"
                    className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:border-gray-400"
                    required
                  />
                </div>
              </div>

            </div>
          </section>

          {/* Special request (conditional) */}
          {showSpecial && (
            <section className="bg-white rounded-2xl border border-(--color-tertiary-button) shadow-sm p-5">
              <h2 className="font-bold text-slate-800 mb-1">Special request</h2>
              <p className="text-xs text-gray-500 mb-3">Requests cannot be guaranteed and depend on availability.</p>
              <textarea
                value={specialRequest}
                onChange={(e) => setSpecialRequest(e.target.value)}
                rows={3}
                placeholder="e.g. late check-in, twin beds, high floor..."
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </section>
          )}

          {/* Essential Information */}
          <section className="bg-white rounded-2xl border border-(--color-tertiary-button) shadow-sm p-5">
            <h2 className="text-base font-bold text-(--color-foreground) mb-4">Essential Information</h2>

            {pricing.boardBasis && (
              <div className="mb-4">
                <p className="text-sm font-bold text-(--color-foreground) mb-1">Inclusions</p>
                <p className="text-sm text-slate-700">Room {1}</p>
                <p className="text-xs text-gray-600 mt-1">{pricing.boardBasis}</p>
              </div>
            )}

            {pricing.refundable && pricing.freeCancellationUntil && (
              <div className="mb-4">
                <p className="text-sm font-bold text-(--color-foreground) mb-1">Cancellation</p>
                <p className="text-sm text-green-700 font-medium">
                  Free cancellation until {formatDeadline(pricing.freeCancellationUntil, true)}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">
                  Cancel after this time and the hotel&apos;s cancellation charges apply.
                </p>
              </div>
            )}

            {cancellationNotes.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-bold text-(--color-foreground) mb-1">Room Policy</p>
                <ul className="list-disc pl-5 text-xs text-gray-700 space-y-1 marker:text-gray-400">
                  {cancellationNotes.map((note, i) => (
                    <li key={i}>{note}</li>
                  ))}
                </ul>
              </div>
            )}

            {checkInInstructions.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-bold text-(--color-foreground) mb-1">Hotel Policy</p>
                <ul className="list-disc pl-5 text-xs text-gray-700 space-y-1 marker:text-gray-400">
                  {checkInInstructions.map((note, i) => (
                    <li key={i}>{note}</li>
                  ))}
                </ul>
              </div>
            )}

            {checkInSpecial.length > 0 && (
              <div>
                <p className="text-sm font-bold text-(--color-foreground) mb-1">Check-in Instructions</p>
                <ul className="list-disc pl-5 text-xs text-gray-700 space-y-1 marker:text-gray-400">
                  {checkInSpecial.map((note, i) => (
                    <li key={i}>{note}</li>
                  ))}
                </ul>
              </div>
            )}

            {!pricing.boardBasis && !cancellationNotes.length && !checkInInstructions.length && !checkInSpecial.length && (
              <p className="text-xs text-gray-500">No additional information provided by the hotel.</p>
            )}
          </section>

          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-800">
              {submitError}
            </div>
          )}
        </div>

        {/* Right column: Fare Summary */}
        <aside className="space-y-4">
          <div className="bg-white rounded-2xl border border-(--color-tertiary-button) shadow-sm p-5 sticky top-4">
            <h3 className="font-bold text-slate-800 text-base mb-3 pb-3 border-b border-gray-200">Fare Summary</h3>

            <DisclosureRow
              label="Room Rate"
              amount={pricing.totalRate}
              currency={pricing.currency}
            />

            {roomCount > 1 && (
              <div className="flex justify-between text-sm py-1.5">
                <span className="text-gray-700">No. of Rooms</span>
                <span className="font-medium text-gray-900">{roomCount}</span>
              </div>
            )}

            <p className="text-xs text-gray-400 pb-1">Inclusive of all taxes &amp; fees</p>

            <div className="flex justify-between items-baseline mt-3 pt-3 border-t border-gray-200">
              <span className="font-bold text-slate-800">Total Amount:</span>
              <span className="text-lg font-bold text-slate-800">{fmt(pricing.totalRate, pricing.currency)}</span>
            </div>

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
                ⚠ Price may be re-verified at booking and could change.
              </p>
            )}

            <div className="mt-4">
              <BookButton type="submit" block disabled={submitting}>
                {submitting ? 'Redirecting to payment...' : 'Continue to Payment'}
              </BookButton>
            </div>
            <p className="text-xs text-gray-400 text-center mt-2">
              {pricing.payAtHotel
                ? 'Pay at hotel'
                : pricing.refundable
                  ? pricing.freeCancellationUntil
                    ? `Free cancellation until ${formatDeadline(pricing.freeCancellationUntil)}`
                    : 'Free cancellation'
                  : 'Non-refundable'}
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}

export default function HotelBookPage() {
  return (
    <Suspense fallback={<StepState><ResultsLoader title="Loading..." rows={2} /></StepState>}>
      <HotelBookPageInner />
    </Suspense>
  );
}
