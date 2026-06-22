'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Plane,
  Hotel,
  ShieldCheck,
  Loader2,
  CalendarDays,
  Users,
  Mail,
  XCircle,
} from 'lucide-react';
import {
  listFlightBookings,
  listHotelBookings,
  listInsuranceBookings,
  cancelHotelBooking,
  type FlightBookingSummary,
  type HotelBookingSummary,
  type InsuranceBookingSummary,
} from '@/lib/bookings-api';
import { useRequireAuth } from '@/contexts/AuthContext';
import { showToast } from '@/lib/toast';

type TabKey = 'flights' | 'hotels' | 'insurance';

function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

type DisplayStatus = 'Confirmed' | 'Cancelled' | 'Pending' | 'Refunded';

// Benzy returns coded statuses (e.g. "B0"). Customers should only ever see a
// small, plain-language set. A booking only reaches this page once it has been
// successfully created, so an unrecognised code defaults to "Confirmed".
function normalizeStatus(raw: string | null | undefined): DisplayStatus {
  const s = (raw || '').toLowerCase().trim();
  if (s.includes('cancel')) return 'Cancelled';
  if (s.includes('refund')) return 'Refunded';
  if (
    ['pending', 'hold', 'progress', 'processing', 'initiated', 'fail'].some(
      (k) => s.includes(k),
    )
  ) {
    return 'Pending';
  }
  return 'Confirmed';
}

const STATUS_STYLES: Record<DisplayStatus, string> = {
  Confirmed: 'bg-green-50 text-(--color-success)',
  Cancelled: 'bg-red-50 text-(--color-danger)',
  Pending: 'bg-orange-50 text-(--color-warn)',
  Refunded: 'bg-blue-50 text-(--color-links)',
};

function StatusBadge({ status }: { status: string }) {
  const label = normalizeStatus(status);
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[label]}`}
    >
      {label}
    </span>
  );
}

// A booking can only be cancelled while it is still confirmed.
function canCancel(status: string) {
  return normalizeStatus(status) === 'Confirmed';
}

const TABS: { key: TabKey; label: string; icon: typeof Plane }[] = [
  { key: 'flights', label: 'Flights', icon: Plane },
  { key: 'hotels', label: 'Hotels', icon: Hotel },
  { key: 'insurance', label: 'Insurance', icon: ShieldCheck },
];

export default function OrdersPage() {
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();

  const [activeTab, setActiveTab] = useState<TabKey>('flights');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [flights, setFlights] = useState<FlightBookingSummary[]>([]);
  const [hotels, setHotels] = useState<HotelBookingSummary[]>([]);
  const [insurance, setInsurance] = useState<InsuranceBookingSummary[]>([]);

  // Cancellation modal state
  const [cancelTarget, setCancelTarget] = useState<HotelBookingSummary | null>(
    null,
  );
  const [cancelRemarks, setCancelRemarks] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [f, h, i] = await Promise.allSettled([
      listFlightBookings(),
      listHotelBookings(),
      listInsuranceBookings(),
    ]);
    if (f.status === 'fulfilled') setFlights(f.value);
    if (h.status === 'fulfilled') setHotels(h.value);
    if (i.status === 'fulfilled') setInsurance(i.value);

    if (f.status === 'rejected' && h.status === 'rejected' && i.status === 'rejected') {
      setError('Failed to load your bookings. Please try again.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAuthenticated) void loadAll();
  }, [isAuthenticated, loadAll]);

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      const result = await cancelHotelBooking(
        cancelTarget.transactionId,
        cancelRemarks.trim(),
      );
      showToast({
        title: 'Booking cancelled',
        body: `Cancellation ID: ${result.cancellationId}`,
        type: 'success',
      });
      setCancelTarget(null);
      setCancelRemarks('');
      await loadAll();
    } catch (err) {
      showToast({
        title: 'Cancellation failed',
        body: err instanceof Error ? err.message : 'Please try again.',
        type: 'error',
      });
    } finally {
      setCancelling(false);
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-(--color-foreground)" />
      </div>
    );
  }

  const counts = {
    flights: flights.length,
    hotels: hotels.length,
    insurance: insurance.length,
  };

  return (
    <main className="min-h-screen bg-(--color-background) px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-(--color-foreground) sm:text-3xl">
            My Orders
          </h1>
          <p className="mt-1 text-sm text-(--color-inactive)">
            View your flight, hotel and insurance bookings and manage
            cancellations.
          </p>
        </header>

        {/* Tabs */}
        <div className="mb-6 flex flex-wrap gap-2 border-b border-(--color-tertiary-button)">
          {TABS.map(({ key, label, icon: Icon }) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-semibold transition ${
                  active
                    ? 'bg-(--color-peace) text-(--color-foreground) shadow-[inset_0_-2px_0_0_var(--color-active)]'
                    : 'text-(--color-inactive) hover:text-(--color-foreground)'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
                <span className="ml-1 rounded-full bg-(--color-tertiary-button) px-2 py-0.5 text-xs text-(--color-foreground)">
                  {counts[key]}
                </span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-7 w-7 animate-spin text-(--color-foreground)" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-(--color-tertiary-button) bg-(--color-peace) p-8 text-center">
            <p className="text-sm text-(--color-danger)">{error}</p>
            <button
              onClick={() => void loadAll()}
              className="mt-4 rounded-lg bg-(--color-primary-button) px-4 py-2 text-sm font-semibold text-white"
            >
              Retry
            </button>
          </div>
        ) : (
          <section>
            {activeTab === 'flights' && (
              <BookingList
                empty="You have no flight bookings yet."
                items={flights.map((b) => (
                  <FlightCard key={b.bookingId} booking={b} />
                ))}
              />
            )}
            {activeTab === 'hotels' && (
              <BookingList
                empty="You have no hotel bookings yet."
                items={hotels.map((b) => (
                  <HotelCard
                    key={b.bookingId}
                    booking={b}
                    onCancel={() => {
                      setCancelRemarks('');
                      setCancelTarget(b);
                    }}
                  />
                ))}
              />
            )}
            {activeTab === 'insurance' && (
              <BookingList
                empty="You have no insurance bookings yet."
                items={insurance.map((b) => (
                  <InsuranceCard key={b.bookingId} booking={b} />
                ))}
              />
            )}
          </section>
        )}
      </div>

      {/* Hotel cancellation modal */}
      {cancelTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => !cancelling && setCancelTarget(null)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-(--color-peace) p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <XCircle className="mt-0.5 h-6 w-6 shrink-0 text-(--color-danger)" />
              <div>
                <h2 className="text-lg font-bold text-(--color-foreground)">
                  Cancel hotel booking?
                </h2>
                <p className="mt-1 text-sm text-(--color-inactive)">
                  {cancelTarget.hotelName || 'This hotel booking'}
                  {cancelTarget.city ? `, ${cancelTarget.city}` : ''} — check-in{' '}
                  {formatDate(cancelTarget.checkInDate)}. This action cannot be
                  undone.
                </p>
              </div>
            </div>

            <label className="mt-4 block text-sm font-medium text-(--color-foreground)">
              Remarks (optional)
              <textarea
                value={cancelRemarks}
                onChange={(e) => setCancelRemarks(e.target.value)}
                rows={2}
                placeholder="Reason for cancellation"
                className="mt-1 w-full resize-none rounded-lg border border-(--color-tertiary-button) bg-(--color-background) px-3 py-2 text-sm text-(--color-foreground) focus:border-(--color-active) focus:outline-none"
              />
            </label>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setCancelTarget(null)}
                disabled={cancelling}
                className="rounded-lg border border-(--color-tertiary-button) px-4 py-2 text-sm font-semibold text-(--color-foreground) disabled:opacity-50"
              >
                Keep booking
              </button>
              <button
                onClick={() => void handleConfirmCancel()}
                disabled={cancelling}
                className="flex items-center gap-2 rounded-lg bg-(--color-danger) px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {cancelling && <Loader2 className="h-4 w-4 animate-spin" />}
                {cancelling ? 'Cancelling…' : 'Confirm cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function BookingList({
  items,
  empty,
}: {
  items: React.ReactNode[];
  empty: string;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-(--color-tertiary-button) bg-(--color-peace) p-10 text-center text-sm text-(--color-inactive)">
        {empty}
      </div>
    );
  }
  return <div className="space-y-4">{items}</div>;
}

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-(--color-tertiary-button) bg-(--color-peace) p-5 shadow-sm transition hover:shadow-md">
      {children}
    </div>
  );
}

function MetaRow({
  icon: Icon,
  children,
}: {
  icon: typeof Plane;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-(--color-inactive)">
      <Icon className="h-4 w-4" />
      {children}
    </span>
  );
}

function FlightCard({ booking }: { booking: FlightBookingSummary }) {
  return (
    <CardShell>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-(--color-foreground)">
              {booking.fromCode} → {booking.toCode}
            </h3>
            <StatusBadge status={booking.status} />
          </div>
          <p className="mt-1 text-sm text-(--color-inactive)">
            {booking.airline || 'Flight'} ·{' '}
            {booking.pnr ? `PNR ${booking.pnr}` : `Txn ${booking.transactionId}`}
          </p>
        </div>
        <p className="text-base font-bold text-(--color-foreground)">
          {formatMoney(booking.totalAmount, booking.currency)}
        </p>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
        <MetaRow icon={CalendarDays}>{formatDate(booking.departureDate)}</MetaRow>
        <MetaRow icon={Users}>
          {booking.passengerCount} traveller
          {booking.passengerCount === 1 ? '' : 's'}
        </MetaRow>
        {booking.contactEmail && (
          <MetaRow icon={Mail}>{booking.contactEmail}</MetaRow>
        )}
      </div>
    </CardShell>
  );
}

function HotelCard({
  booking,
  onCancel,
}: {
  booking: HotelBookingSummary;
  onCancel: () => void;
}) {
  const cancellable = canCancel(booking.status);
  return (
    <CardShell>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-(--color-foreground)">
              {booking.hotelName || 'Hotel booking'}
            </h3>
            <StatusBadge status={booking.status} />
          </div>
          {booking.city && (
            <p className="mt-1 text-sm text-(--color-inactive)">
              {booking.city}
            </p>
          )}
        </div>
        <p className="text-base font-bold text-(--color-foreground)">
          {formatMoney(booking.totalAmount, booking.currency)}
        </p>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
        <MetaRow icon={CalendarDays}>
          {formatDate(booking.checkInDate)} → {formatDate(booking.checkOutDate)}
        </MetaRow>
        <MetaRow icon={Hotel}>
          {booking.nights} night{booking.nights === 1 ? '' : 's'}
        </MetaRow>
        {booking.contactEmail && (
          <MetaRow icon={Mail}>{booking.contactEmail}</MetaRow>
        )}
      </div>
      {cancellable && (
        <div className="mt-4 flex justify-end border-t border-(--color-tertiary-button) pt-3">
          <button
            onClick={onCancel}
            className="rounded-lg border border-(--color-danger) px-4 py-2 text-sm font-semibold text-(--color-danger) transition hover:bg-(--color-danger) hover:text-white"
          >
            Cancel booking
          </button>
        </div>
      )}
    </CardShell>
  );
}

function InsuranceCard({ booking }: { booking: InsuranceBookingSummary }) {
  return (
    <CardShell>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-(--color-foreground)">
              {booking.policyType || 'Insurance policy'}
            </h3>
            <StatusBadge status={booking.status} />
          </div>
          <p className="mt-1 text-sm text-(--color-inactive)">
            {booking.policyNumber
              ? `Policy ${booking.policyNumber}`
              : `Txn ${booking.transactionId}`}
          </p>
        </div>
        <p className="text-base font-bold text-(--color-foreground)">
          {formatMoney(booking.totalAmount, booking.currency)}
        </p>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
        <MetaRow icon={CalendarDays}>
          {formatDate(booking.startDate)} → {formatDate(booking.endDate)}
        </MetaRow>
        <MetaRow icon={Users}>
          {booking.travellerCount} traveller
          {booking.travellerCount === 1 ? '' : 's'}
        </MetaRow>
        {booking.contactEmail && (
          <MetaRow icon={Mail}>{booking.contactEmail}</MetaRow>
        )}
      </div>
    </CardShell>
  );
}
