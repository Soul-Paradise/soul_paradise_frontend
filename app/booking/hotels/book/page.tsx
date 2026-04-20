'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { jsPDF } from 'jspdf';

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
  netAmount: number;
  searchTracingKey: string;
  checkIn: string; // MM/DD/YYYY (Benzy)
  checkOut: string;
  uiCheckIn: string; // YYYY-MM-DD
  uiCheckOut: string;
  locationName: string | null;
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

interface GSTForm {
  enabled: boolean;
  companyName: string;
  tin: string;
  mobile: string;
  email: string;
}

interface VoucherGuest {
  title: string;
  firstName: string;
  lastName: string;
  paxType: string;
  age: string;
}

interface VoucherRoom {
  id: string;
  name: string;
  description: string;
  capacity: string;
  adults: string;
  children: string;
  refundable: string;
  supplierConfirmationNumber: string;
  guests: VoucherGuest[];
  baseRate: number;
  totalRate: number;
  tax: number;
  cancellationPolicy: Array<{ text: string; fromDate: string; toDate: string; amount: string }>;
}

interface BookingVoucher {
  bookingId: string;
  transactionId: string;
  confirmationId: string;
  supplierConfirmationId: string;
  status: string;
  currentStatus: string;
  paymentStatus: string;
  bookedAt: string;
  totalAmount: number;
  grossAmount: number;
  netAmount: number;
  currency: string;
  checkInDate: string;
  checkOutDate: string;
  checkInTime: string;
  checkOutTime: string;
  nights: number;
  hotel: {
    code: string;
    name: string;
    starRating: string;
    heroImage: string;
    phone: string;
    address: {
      line1: string;
      line2: string;
      city: string;
      state: string;
      country: string;
      zip: string;
    };
  };
  contactInfo: {
    title: string;
    firstName: string;
    lastName: string;
    email: string;
    mobile: string;
  };
  rooms: VoucherRoom[];
  cancellationPolicies: Array<{ text: string; fromDate: string; toDate: string; amount: string }>;
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
  const [gst, setGst] = useState<GSTForm>({ enabled: false, companyName: '', tin: '', mobile: '', email: '' });
  const [specialRequest, setSpecialRequest] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [bookingResult, setBookingResult] = useState<BookingVoucher | null>(null);

  useEffect(() => {
    if (stash) setGuestsByRoom(buildRooms(stash.occupancy));
  }, [stash]);

  const showAllGuests = pricing?.allGuestsInfoRequired ?? false;
  const showGST = pricing?.gstAllowed ?? false;
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

  const taxTotal = useMemo(
    () => (pricing?.taxes ?? []).reduce((s, t) => s + (t.amount || 0), 0) + (pricing?.tcsOnTotal || 0),
    [pricing],
  );
  const discountTotal = useMemo(
    () => (pricing?.discounts ?? []).reduce((s, d) => s + (d.amount || 0), 0),
    [pricing],
  );

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

    if (showGST && gst.enabled) {
      if (!gst.companyName.trim() || !gst.tin.trim()) return 'Please enter GST company name and TIN.';
      if (gst.email && !isEmail(gst.email)) return 'Please enter a valid GST email.';
    }

    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!bookingContext || !stash) return;

    const err = validate();
    if (err) {
      setSubmitError(err);
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
      netAmount: bookingContext.netAmount,
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
        gstCompanyName: gst.enabled ? gst.companyName : '',
        gstTin: gst.enabled ? gst.tin : '',
        gstMobile: gst.enabled ? gst.mobile : '',
        gstEmail: gst.enabled ? gst.email : '',
      },
      rooms: guestsByRoom.map((guests) => ({
        roomId: stash.selectedRoom.roomId,
        roomGroupId: stash.selectedRoom.roomGroupId,
        supplierName: stash.selectedRoom.supplierName,
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
      })),
      specialRequest: showSpecial ? specialRequest : '',
      travelingFor: 'NTF',
    };

    try {
      const res = await fetch(`${API_URL}/hotels/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Booking failed. Please try again.');
      setBookingResult(data);
      try { sessionStorage.removeItem('hotelBookingContext'); } catch { /* ignore */ }
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Render ──

  if (stashError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg border border-red-200 p-6 max-w-md">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Session expired</h2>
          <p className="text-sm text-gray-600 mb-4">{stashError}</p>
          <button
            onClick={() => router.push('/booking/hotels')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded transition-colors"
          >
            Start over
          </button>
        </div>
      </div>
    );
  }

  if (!stash || !pricing || !bookingContext) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading booking...</p>
      </div>
    );
  }

  if (bookingResult) {
    return <BookingConfirmation voucher={bookingResult} onDone={() => router.push('/')} />;
  }

  const checkInInstructions = flattenPolicy(hotelDetail?.checkinInfo?.instructions || []);
  const checkInSpecial = flattenPolicy(hotelDetail?.checkinInfo?.specialInstructions || []);
  const cancellationNotes = flattenPolicy((pricing.cancellationPolicies || []).map((p) => p.text));

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Top breadcrumb */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-7xl mx-auto px-6 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-4">

          {/* Hotel card */}
          <section className="bg-white rounded-lg border border-gray-200">
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
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 uppercase tracking-wider"
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

            <div className="border-t border-gray-200 px-5 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700">{pricing.roomName}</p>
                {pricing.boardBasis && <p className="text-xs text-gray-500 mt-0.5">{pricing.boardBasis}</p>}
              </div>
              <p className="text-xs text-gray-500">
                {totalGuests} {totalGuests === 1 ? 'ADULT' : 'GUESTS'}
              </p>
            </div>
          </section>

          {/* Traveller Details */}
          <section className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="font-bold text-slate-800 mb-1">Traveller Details</h2>


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
          <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-5 pt-5 pb-3 border-b border-gray-200">
              <h2 className="text-sm font-bold text-slate-800 tracking-wider uppercase">Contact Information</h2>
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

              {showGST && (
                <div className="border-t border-gray-200 pt-5">
                  <div className="bg-gray-50 border border-gray-200 rounded px-4 py-3 flex items-center gap-4">
                    <div className="w-10 h-10 rounded bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                      GST
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800">
                        Use GSTIN for this booking <span className="font-normal text-gray-500">(Optional)</span>
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        Claim credit of GST charges. Your taxes may get updated post submitting your GST details
                      </p>
                    </div>
                    <label className="flex items-center gap-2 shrink-0 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={gst.enabled}
                        onChange={(e) => setGst((g) => ({ ...g, enabled: e.target.checked }))}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-slate-700 whitespace-nowrap">Include my GST number</span>
                    </label>
                  </div>

                  {gst.enabled && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                      <input
                        value={gst.companyName}
                        onChange={(e) => setGst((g) => ({ ...g, companyName: e.target.value }))}
                        placeholder="Company name"
                        className="border border-gray-300 rounded px-3 py-2.5 text-sm sm:col-span-2"
                      />
                      <input
                        value={gst.tin}
                        onChange={(e) => setGst((g) => ({ ...g, tin: e.target.value.toUpperCase() }))}
                        placeholder="GSTIN"
                        className="border border-gray-300 rounded px-3 py-2.5 text-sm"
                      />
                      <input
                        type="tel"
                        value={gst.mobile}
                        onChange={(e) => setGst((g) => ({ ...g, mobile: e.target.value.replace(/\D/g, '') }))}
                        placeholder="GST mobile"
                        className="border border-gray-300 rounded px-3 py-2.5 text-sm"
                      />
                      <input
                        type="email"
                        value={gst.email}
                        onChange={(e) => setGst((g) => ({ ...g, email: e.target.value }))}
                        placeholder="GST email"
                        className="border border-gray-300 rounded px-3 py-2.5 text-sm sm:col-span-2"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Special request (conditional) */}
          {showSpecial && (
            <section className="bg-white rounded-lg border border-gray-200 p-5">
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
          <section className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="font-bold text-slate-800 mb-4">Essential Information</h2>

            {pricing.boardBasis && (
              <div className="mb-4">
                <p className="text-sm font-semibold text-red-500 mb-1">INCLUSIONS</p>
                <p className="text-sm text-slate-700">Room {1}</p>
                <p className="text-xs text-gray-600 mt-1">{pricing.boardBasis}</p>
              </div>
            )}

            {cancellationNotes.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-semibold text-red-500 mb-1">Room Policy</p>
                <ul className="list-disc pl-5 text-xs text-gray-700 space-y-1 marker:text-gray-400">
                  {cancellationNotes.map((note, i) => (
                    <li key={i}>{note}</li>
                  ))}
                </ul>
              </div>
            )}

            {checkInInstructions.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-semibold text-slate-800 mb-1">HOTEL POLICY</p>
                <ul className="list-disc pl-5 text-xs text-gray-700 space-y-1 marker:text-gray-400">
                  {checkInInstructions.map((note, i) => (
                    <li key={i}>{note}</li>
                  ))}
                </ul>
              </div>
            )}

            {checkInSpecial.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-slate-800 mb-1">CHECKIN SPECIAL INSTRUCTIONS</p>
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
          <div className="bg-white rounded-lg border border-gray-200 p-5 sticky top-4">
            <h3 className="font-bold text-slate-800 text-base mb-3 pb-3 border-b border-gray-200">Fare Summary</h3>

            <DisclosureRow
              label="Room Rates"
              amount={pricing.baseRate}
              currency={pricing.currency}
              initiallyOpen
            >
              <div className="flex justify-between text-gray-600">
                <span>Room 1</span>
                <span>{fmt(pricing.baseRate, pricing.currency)}</span>
              </div>
            </DisclosureRow>

            <DisclosureRow
              label="Tax & Charges"
              amount={taxTotal}
              currency={pricing.currency}
            >
              {pricing.taxes.map((t, i) => (
                <div key={i} className="flex justify-between text-gray-600">
                  <span>{t.description || 'Tax'}</span>
                  <span>{fmt(t.amount, pricing.currency)}</span>
                </div>
              ))}
              {pricing.tcsOnTotal > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>TCS</span>
                  <span>{fmt(pricing.tcsOnTotal, pricing.currency)}</span>
                </div>
              )}
            </DisclosureRow>

            {discountTotal > 0 && (
              <DisclosureRow
                label="Discount"
                amount={discountTotal}
                currency={pricing.currency}
                valueClassName="font-medium text-green-600"
              >
                {pricing.discounts.map((d, i) => (
                  <div key={i} className="flex justify-between text-green-600">
                    <span>{d.description || 'Discount'}</span>
                    <span>{fmt(d.amount, pricing.currency)}</span>
                  </div>
                ))}
              </DisclosureRow>
            )}

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

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded text-sm uppercase tracking-wider transition-colors"
            >
              {submitting ? 'Booking...' : 'Continue to Payment'}
            </button>
            <p className="text-xs text-gray-400 text-center mt-2">
              {pricing.payAtHotel ? 'Pay at hotel' : pricing.refundable ? 'Free cancellation' : 'Non-refundable'}
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}

// ── Booking Confirmation (Voucher) ──

function statusTone(status: string): { bg: string; text: string; label: string } {
  const s = (status || '').toUpperCase();
  if (s === 'B0' || s === 'BO0' || s === 'CONFIRMED' || s.includes('SUCCESS')) {
    return { bg: 'bg-green-100', text: 'text-green-700', label: 'Confirmed' };
  }
  if (s === 'B1' || s === 'BO1' || s.includes('FAIL')) {
    return { bg: 'bg-red-100', text: 'text-red-700', label: 'Failed' };
  }
  if (s.includes('PEND') || s.includes('PROGRESS')) {
    return { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pending' };
  }
  return { bg: 'bg-slate-100', text: 'text-slate-700', label: status || 'Booked' };
}

function formatLongDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function buildPdf(v: BookingVoucher, JsPDF: typeof jsPDF): jsPDF {
  const doc = new JsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // ── Header band ──
  doc.setFillColor(37, 99, 235); // blue-600
  doc.rect(0, 0, pageWidth, 90, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('Soul Paradise', margin, 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Hotel Booking Voucher', margin, 58);
  doc.setFontSize(9);
  const bookedAt = formatLongDate(v.bookedAt) || new Date().toLocaleDateString('en-IN');
  doc.text(`Issued: ${bookedAt}`, pageWidth - margin, 40, { align: 'right' });
  const tone = statusTone(v.status);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(tone.label.toUpperCase(), pageWidth - margin, 58, { align: 'right' });
  y = 120;

  // ── Booking IDs block ──
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Booking Details', margin, y);
  y += 18;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);
  y += 14;

  const infoRows: Array<[string, string]> = [
    ['Booking ID', v.bookingId],
    ['Confirmation ID', v.confirmationId || '—'],
    ['Supplier Ref', v.supplierConfirmationId || '—'],
    ['Transaction', v.transactionId],
    ['Status', tone.label],
    ['Payment Status', v.paymentStatus || '—'],
  ];
  doc.setFontSize(10);
  for (const [k, val] of infoRows) {
    ensureSpace(18);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(k, margin, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(val, margin + 140, y);
    y += 16;
  }

  // ── Hotel block ──
  y += 10;
  ensureSpace(80);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Hotel', margin, y);
  y += 18;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);
  y += 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(v.hotel.name || '—', margin, y);
  y += 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  const addressParts = [
    [v.hotel.address.line1, v.hotel.address.line2].filter(Boolean).join(', '),
    [v.hotel.address.city, v.hotel.address.state, v.hotel.address.zip].filter(Boolean).join(', '),
    v.hotel.address.country,
  ].filter(Boolean);
  for (const line of addressParts) {
    const wrapped = doc.splitTextToSize(line, contentWidth);
    ensureSpace(wrapped.length * 12);
    doc.text(wrapped, margin, y);
    y += wrapped.length * 12;
  }
  if (v.hotel.phone) {
    ensureSpace(14);
    doc.text(`Phone: ${v.hotel.phone}`, margin, y);
    y += 14;
  }

  // ── Stay block ──
  y += 10;
  ensureSpace(90);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  doc.text('Your Stay', margin, y);
  y += 18;
  doc.line(margin, y, pageWidth - margin, y);
  y += 14;

  const stayBoxWidth = (contentWidth - 20) / 2;
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, stayBoxWidth, 56, 4, 4, 'FD');
  doc.roundedRect(margin + stayBoxWidth + 20, y, stayBoxWidth, 56, 4, 4, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('CHECK-IN', margin + 12, y + 16);
  doc.text('CHECK-OUT', margin + stayBoxWidth + 32, y + 16);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(formatLongDate(v.checkInDate), margin + 12, y + 34);
  doc.text(formatLongDate(v.checkOutDate), margin + stayBoxWidth + 32, y + 34);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(v.checkInTime ? `After ${v.checkInTime}` : '', margin + 12, y + 48);
  doc.text(v.checkOutTime ? `Before ${v.checkOutTime}` : '', margin + stayBoxWidth + 32, y + 48);
  y += 64;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text(`${v.nights} night${v.nights === 1 ? '' : 's'}`, margin, y + 4);
  y += 18;

  // ── Rooms ──
  for (let i = 0; i < v.rooms.length; i++) {
    const room = v.rooms[i];
    y += 6;
    ensureSpace(60);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text(`Room ${i + 1}: ${room.name || 'Room'}`, margin, y);
    y += 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const meta = [
      room.capacity && `Capacity: ${room.capacity}`,
      room.adults && `Adults: ${room.adults}`,
      room.children && `Children: ${room.children}`,
      room.refundable && `${room.refundable}`.toLowerCase().includes('true') ? 'Refundable' : '',
    ].filter(Boolean).join('  •  ');
    if (meta) {
      doc.text(meta, margin, y);
      y += 12;
    }

    for (const g of room.guests) {
      ensureSpace(14);
      doc.setTextColor(30, 41, 59);
      const ageText = g.paxType === 'C' && g.age ? ` (age ${g.age})` : '';
      doc.text(
        `• ${g.title} ${g.firstName} ${g.lastName}${ageText}`,
        margin + 10,
        y,
      );
      y += 13;
    }
  }

  // ── Fare summary ──
  y += 8;
  ensureSpace(80);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  doc.text('Fare Summary', margin, y);
  y += 18;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);
  y += 14;

  doc.setFontSize(10);
  const fareRows: Array<[string, string]> = [
    ['Gross Fare', fmt(v.grossAmount, v.currency)],
    ['Net Fare', fmt(v.netAmount, v.currency)],
  ];
  for (const [k, val] of fareRows) {
    ensureSpace(16);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(k, margin, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(val, pageWidth - margin, y, { align: 'right' });
    y += 16;
  }
  y += 4;
  doc.line(margin, y, pageWidth - margin, y);
  y += 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total Paid', margin, y);
  doc.text(fmt(v.totalAmount, v.currency), pageWidth - margin, y, { align: 'right' });
  y += 20;

  // ── Cancellation policies ──
  if (v.cancellationPolicies.length > 0) {
    y += 6;
    ensureSpace(40);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Cancellation Policy', margin, y);
    y += 18;
    doc.line(margin, y, pageWidth - margin, y);
    y += 12;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    for (const policy of v.cancellationPolicies) {
      const lines = htmlToLines(policy.text);
      for (const line of lines) {
        const wrapped = doc.splitTextToSize(`• ${line}`, contentWidth);
        ensureSpace(wrapped.length * 12);
        doc.text(wrapped, margin, y);
        y += wrapped.length * 12 + 2;
      }
    }
  }

  // ── Footer ──
  const footerY = pageHeight - 30;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY - 10, pageWidth - margin, footerY - 10);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'This voucher is proof of booking. Please present it at the hotel along with a valid ID.',
    pageWidth / 2,
    footerY,
    { align: 'center' },
  );

  return doc;
}

function BookingConfirmation({ voucher, onDone }: { voucher: BookingVoucher; onDone: () => void }) {
  const tone = statusTone(voucher.status);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  async function handleDownload() {
    setDownloading(true);
    setDownloadError(null);
    try {
      const mod = await import('jspdf');
      const JsPDF = (mod as { jsPDF?: typeof jsPDF; default?: typeof jsPDF }).jsPDF
        ?? (mod as { default?: typeof jsPDF }).default;
      if (!JsPDF) throw new Error('Could not load PDF library');
      const doc = buildPdf(voucher, JsPDF);
      doc.save(`${voucher.bookingId}.pdf`);
    } catch (err) {
      console.error('PDF download failed:', err);
      setDownloadError(
        err instanceof Error ? err.message : 'Could not generate PDF. Please try again.',
      );
    } finally {
      setDownloading(false);
    }
  }

  const primaryGuest = voucher.rooms[0]?.guests[0];
  const addressLine = [voucher.hotel.address.line1, voucher.hotel.address.city, voucher.hotel.address.state]
    .filter(Boolean)
    .join(', ');
  const totalGuests = voucher.rooms.reduce((s, r) => s + r.guests.length, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Success banner */}
        <div className="text-center mb-6">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${tone.bg} mb-3`}>
            <svg className={`w-8 h-8 ${tone.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Booking {tone.label}</h1>
          <p className="text-sm text-gray-600 mt-1">
            {voucher.contactInfo.email && (
              <>A confirmation has been sent to <span className="font-medium">{voucher.contactInfo.email}</span></>
            )}
          </p>
        </div>

        {/* Voucher card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Header strip */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-5 flex items-start justify-between">
            <div>
              <p className="text-[10px] tracking-widest opacity-80">BOOKING ID</p>
              <p className="font-mono text-lg font-bold">{voucher.bookingId}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] tracking-widest opacity-80">CONFIRMATION</p>
              <p className="font-mono text-lg font-bold">{voucher.confirmationId || '—'}</p>
            </div>
          </div>

          {/* Hotel + Stay */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-start gap-4">
              {voucher.hotel.heroImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={voucher.hotel.heroImage}
                  alt={voucher.hotel.name}
                  className="w-24 h-24 rounded-lg object-cover shrink-0"
                />
              ) : (
                <div className="w-24 h-24 rounded-lg bg-gray-100 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-slate-900">{voucher.hotel.name || 'Hotel'}</h2>
                  {Number(voucher.hotel.starRating) > 0 && <Stars count={Number(voucher.hotel.starRating)} />}
                </div>
                {addressLine && <p className="text-xs text-gray-600 mt-1">{addressLine}</p>}
                {voucher.hotel.phone && (
                  <p className="text-xs text-gray-500 mt-0.5">Phone: {voucher.hotel.phone}</p>
                )}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-[10px] font-semibold text-gray-500 tracking-widest">CHECK-IN</p>
                <p className="text-sm font-bold text-slate-800 mt-1">{formatLongDate(voucher.checkInDate)}</p>
                {voucher.checkInTime && <p className="text-xs text-gray-600 mt-0.5">After {voucher.checkInTime}</p>}
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-[10px] font-semibold text-gray-500 tracking-widest">CHECK-OUT</p>
                <p className="text-sm font-bold text-slate-800 mt-1">{formatLongDate(voucher.checkOutDate)}</p>
                {voucher.checkOutTime && <p className="text-xs text-gray-600 mt-0.5">Before {voucher.checkOutTime}</p>}
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-3">
              <span className="font-semibold text-slate-700">
                {voucher.nights} night{voucher.nights === 1 ? '' : 's'}
              </span>{' '}
              • {voucher.rooms.length} room{voucher.rooms.length === 1 ? '' : 's'} • {totalGuests} guest
              {totalGuests === 1 ? '' : 's'}
            </p>
          </div>

          {/* Rooms + Guests */}
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-sm font-bold text-slate-800 tracking-wide mb-3">Rooms & Guests</h3>
            <div className="space-y-3">
              {voucher.rooms.map((room, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        Room {idx + 1}: {room.name || 'Room'}
                      </p>
                      {room.capacity && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {room.adults} Adult{room.adults === '1' ? '' : 's'}
                          {Number(room.children) > 0 ? ` • ${room.children} Child` : ''}
                        </p>
                      )}
                    </div>
                    {room.supplierConfirmationNumber && (
                      <span className="text-[10px] bg-blue-50 text-blue-700 font-mono px-2 py-1 rounded whitespace-nowrap">
                        {room.supplierConfirmationNumber}
                      </span>
                    )}
                  </div>
                  <ul className="mt-2 space-y-1">
                    {room.guests.map((g, gIdx) => (
                      <li key={gIdx} className="text-xs text-gray-700">
                        <span className="text-gray-400">•</span>{' '}
                        <span className="font-medium text-slate-800">
                          {g.title} {g.firstName} {g.lastName}
                        </span>
                        {g.paxType === 'C' && g.age && (
                          <span className="text-gray-500"> (age {g.age})</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-sm font-bold text-slate-800 tracking-wide mb-3">Contact</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500">Guest</p>
                <p className="font-medium text-slate-800">
                  {primaryGuest
                    ? `${primaryGuest.title} ${primaryGuest.firstName} ${primaryGuest.lastName}`
                    : `${voucher.contactInfo.firstName} ${voucher.contactInfo.lastName}`}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Mobile</p>
                <p className="font-medium text-slate-800">{voucher.contactInfo.mobile || '—'}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-gray-500">Email</p>
                <p className="font-medium text-slate-800 break-all">{voucher.contactInfo.email || '—'}</p>
              </div>
            </div>
          </div>

          {/* Fare */}
          <div className="p-6">
            <h3 className="text-sm font-bold text-slate-800 tracking-wide mb-3">Payment</h3>
            <dl className="text-sm space-y-1.5">
              <div className="flex justify-between text-gray-600">
                <dt>Gross Fare</dt>
                <dd>{fmt(voucher.grossAmount, voucher.currency)}</dd>
              </div>
              <div className="flex justify-between text-gray-600">
                <dt>Net Fare</dt>
                <dd>{fmt(voucher.netAmount, voucher.currency)}</dd>
              </div>
              <div className="flex justify-between pt-2 mt-2 border-t border-gray-200 font-bold text-slate-900">
                <dt>Total Paid</dt>
                <dd>{fmt(voucher.totalAmount, voucher.currency)}</dd>
              </div>
              {voucher.paymentStatus && (
                <div className="flex justify-between text-xs text-gray-500 pt-1">
                  <dt>Payment Status</dt>
                  <dd>{voucher.paymentStatus}</dd>
                </div>
              )}
              <div className="flex justify-between text-xs text-gray-500">
                <dt>Transaction</dt>
                <dd className="font-mono">{voucher.transactionId}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"
              />
            </svg>
            {downloading ? 'Preparing PDF...' : 'Download Voucher (PDF)'}
          </button>
          <button
            onClick={onDone}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>

        {downloadError && (
          <p className="mt-3 text-xs text-red-600 text-center">{downloadError}</p>
        )}

        <p className="text-xs text-gray-500 text-center mt-4">
          Present this voucher along with a valid ID at check-in.
        </p>
      </div>
    </div>
  );
}

export default function HotelBookPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <HotelBookPageInner />
    </Suspense>
  );
}
