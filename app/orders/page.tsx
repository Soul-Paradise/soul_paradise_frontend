'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  Plane,
  CreditCard,
  Hash,
  Hotel,
  ShieldCheck,
  Loader2,
  CalendarDays,
  Users,
  Mail,
  XCircle,
  type LucideIcon,
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
import { api, type CustomPayment, type PaymentStatus } from '@/lib/api';
import { useRequireAuth } from '@/contexts/AuthContext';
import { showToast } from '@/lib/toast';
import { PageHero, IconTile, type Accent } from '@/components/Page';
import { useSiteImages } from '@/components/SiteImages';

type TabKey = 'flights' | 'hotels' | 'insurance' | 'payments';

const isTabKey = (v: string | null): v is TabKey =>
  v === 'flights' || v === 'hotels' || v === 'insurance' || v === 'payments';

function formatDate(value: string | null | undefined) {
  if (!value) return '-';
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

// Same accents and home-page tab ids as the booking widget, so each service
// keeps one colour across the site. `homeTab` powers the empty-state CTA.
const TABS: {
  key: TabKey;
  label: string;
  icon: LucideIcon;
  accent: Accent;
  homeTab: string;
  cta: string;
}[] = [
  { key: 'flights', label: 'Flights', icon: Plane, accent: 'blue', homeTab: 'flights', cta: 'Search flights' },
  { key: 'hotels', label: 'Hotels', icon: Hotel, accent: 'green', homeTab: 'hotel', cta: 'Find a hotel' },
  { key: 'insurance', label: 'Insurance', icon: ShieldCheck, accent: 'purple', homeTab: 'insurance', cta: 'Get insured' },
  { key: 'payments', label: 'Payments', icon: CreditCard, accent: 'orange', homeTab: 'payment', cta: 'Make a payment' },
];

const TAB_BY_KEY = Object.fromEntries(TABS.map((t) => [t.key, t])) as Record<
  TabKey,
  (typeof TABS)[number]
>;

function OrdersShell({ children }: { children: React.ReactNode }) {
  const siteImages = useSiteImages();
  return (
    <main className="min-h-screen bg-(--color-background)">
      <PageHero
        crumb="My Orders"
        title="Your trips & payments"
        description="View your flight, hotel and insurance bookings, custom payments, and manage cancellations."
        image={siteImages.pageHeroes?.orders}
        imagePosition="center 60%"
      />
      <div className="relative z-10 mx-auto -mt-16 max-w-7xl px-4 pb-16 sm:px-6 md:pb-20 lg:px-8">
        {children}
      </div>
    </main>
  );
}

function PanelSpinner() {
  return (
    <div className="flex items-center justify-center rounded-2xl bg-(--color-peace) py-20 shadow-xl ring-1 ring-(--color-tertiary-button)">
      <Loader2 className="h-8 w-8 animate-spin text-(--color-links)" />
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <OrdersShell>
          <PanelSpinner />
        </OrdersShell>
      }
    >
      <OrdersContent />
    </Suspense>
  );
}

function OrdersContent() {
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  // ?tab=payments deep-links from the home page's Custom Payment tab.
  const tabParam = useSearchParams().get('tab');

  const [activeTab, setActiveTab] = useState<TabKey>(
    isTabKey(tabParam) ? tabParam : 'flights',
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [flights, setFlights] = useState<FlightBookingSummary[]>([]);
  const [hotels, setHotels] = useState<HotelBookingSummary[]>([]);
  const [insurance, setInsurance] = useState<InsuranceBookingSummary[]>([]);
  const [payments, setPayments] = useState<CustomPayment[]>([]);

  // Cancellation modal state
  const [cancelTarget, setCancelTarget] = useState<HotelBookingSummary | null>(
    null,
  );
  const [cancelRemarks, setCancelRemarks] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [f, h, i, p] = await Promise.allSettled([
      listFlightBookings(),
      listHotelBookings(),
      listInsuranceBookings(),
      api.getCustomPayments(),
    ]);
    if (f.status === 'fulfilled') setFlights(f.value);
    if (h.status === 'fulfilled') setHotels(h.value);
    if (i.status === 'fulfilled') setInsurance(i.value);
    if (p.status === 'fulfilled') setPayments(p.value);

    if (
      f.status === 'rejected' &&
      h.status === 'rejected' &&
      i.status === 'rejected' &&
      p.status === 'rejected'
    ) {
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
      <OrdersShell>
        <PanelSpinner />
      </OrdersShell>
    );
  }

  const counts = {
    flights: flights.length,
    hotels: hotels.length,
    insurance: insurance.length,
    payments: payments.length,
  };

  const tab = TAB_BY_KEY[activeTab];
  const emptyState = (message: string) => ({ message, tab });

  return (
    <OrdersShell>
      {/* Tabs, overlapping the hero */}
      <div
        role="tablist"
        aria-label="Order type"
        className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
      >
        {TABS.map(({ key, label, icon, accent }) => {
          const active = activeTab === key;
          return (
            <button
              key={key}
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(key)}
              className={`group flex items-center gap-3 rounded-2xl bg-(--color-peace) p-4 text-left shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl sm:p-5 ${
                active
                  ? 'ring-2 ring-(--color-links)'
                  : 'ring-1 ring-(--color-tertiary-button)'
              }`}
            >
              <IconTile icon={icon} accent={accent} />
              <span className="min-w-0">
                <span
                  className={`block text-sm font-semibold ${
                    active ? 'text-(--color-links)' : 'text-(--color-inactive)'
                  }`}
                >
                  {label}
                </span>
                <span className="block text-2xl font-extrabold text-(--color-foreground)">
                  {loading ? '–' : counts[key]}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-xs font-bold uppercase tracking-[0.18em] text-(--color-links)">
        {tab.label}
      </p>
      <h2 className="mb-6 mt-2 text-2xl font-extrabold tracking-tight text-(--color-foreground) sm:text-3xl">
        {activeTab === 'payments' ? 'Custom payments' : `Your ${tab.label.toLowerCase()} bookings`}
      </h2>

      {loading ? (
        <PanelSpinner />
      ) : error ? (
        <div className="rounded-2xl bg-(--color-peace) p-10 text-center shadow-sm ring-1 ring-(--color-tertiary-button)">
          <p className="text-sm text-(--color-danger)">{error}</p>
          <button
            onClick={() => void loadAll()}
            className="mt-4 rounded-xl bg-(--color-primary-button) px-5 py-2.5 text-sm font-semibold text-(--color-peace) transition hover:bg-(--color-secondary-button)"
          >
            Retry
          </button>
        </div>
      ) : (
        <section>
          {activeTab === 'flights' && (
            <BookingList
              empty={emptyState('You have no flight bookings yet.')}
              items={flights.map((b) => (
                <FlightCard key={b.bookingId} booking={b} />
              ))}
            />
          )}
          {activeTab === 'hotels' && (
            <BookingList
              empty={emptyState('You have no hotel bookings yet.')}
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
              empty={emptyState('You have no insurance bookings yet.')}
              items={insurance.map((b) => (
                <InsuranceCard key={b.bookingId} booking={b} />
              ))}
            />
          )}
          {activeTab === 'payments' && (
            <BookingList
              empty={emptyState('You have not made any custom payments yet.')}
              items={payments.map((p) => (
                <PaymentCard key={p.merchantTxnNo} payment={p} />
              ))}
            />
          )}
        </section>
      )}

      {/* Hotel cancellation modal */}
      {cancelTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => !cancelling && setCancelTarget(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-(--color-peace) p-6 shadow-2xl ring-1 ring-(--color-tertiary-button)"
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
                  {cancelTarget.city ? `, ${cancelTarget.city}` : ''} - check-in{' '}
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
                className="mt-1 w-full resize-none rounded-xl border border-(--color-tertiary-button) bg-(--color-background) px-4 py-3 text-sm text-(--color-foreground) outline-none transition-all focus:border-(--color-links) focus:bg-white focus:ring-4 focus:ring-(--color-links)/15"
              />
            </label>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setCancelTarget(null)}
                disabled={cancelling}
                className="rounded-xl border border-(--color-tertiary-button) px-4 py-2.5 text-sm font-semibold text-(--color-foreground) transition hover:bg-(--color-background) disabled:opacity-50"
              >
                Keep booking
              </button>
              <button
                onClick={() => void handleConfirmCancel()}
                disabled={cancelling}
                className="flex items-center gap-2 rounded-xl bg-(--color-danger) px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {cancelling && <Loader2 className="h-4 w-4 animate-spin" />}
                {cancelling ? 'Cancelling…' : 'Confirm cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </OrdersShell>
  );
}

function BookingList({
  items,
  empty,
}: {
  items: React.ReactNode[];
  empty: { message: string; tab: (typeof TABS)[number] };
}) {
  if (items.length === 0) {
    const { message, tab } = empty;
    return (
      <div className="group flex flex-col items-center rounded-2xl border border-dashed border-(--color-tertiary-button) bg-(--color-peace) px-6 py-14 text-center">
        <IconTile icon={tab.icon} accent={tab.accent} size="lg" />
        <p className="mt-4 text-base font-semibold text-(--color-foreground)">{message}</p>
        <p className="mt-1 text-sm text-(--color-inactive)">
          Once you book, it will show up here.
        </p>
        <Link
          href={`/?tab=${tab.homeTab}#booking`}
          className="group/btn mt-5 inline-flex items-center gap-2 rounded-xl bg-(--color-primary-button) px-5 py-2.5 text-sm font-semibold text-(--color-peace) shadow-lg transition hover:bg-(--color-secondary-button)"
        >
          {tab.cta}
          <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
        </Link>
      </div>
    );
  }
  return <div className="space-y-4">{items}</div>;
}

/** Booking card: service-coloured icon tile on the left, details on the right. */
function CardShell({ tab, children }: { tab: TabKey; children: React.ReactNode }) {
  const { icon, accent } = TAB_BY_KEY[tab];
  return (
    <article className="group flex gap-4 rounded-2xl bg-(--color-peace) p-5 shadow-sm ring-1 ring-(--color-tertiary-button) transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md sm:p-6">
      <span className="hidden sm:block">
        <IconTile icon={icon} accent={accent} />
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </article>
  );
}

function MetaRow({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-(--color-inactive)">
      <Icon className="h-4 w-4 text-(--color-links)" />
      {children}
    </span>
  );
}

function FlightCard({ booking }: { booking: FlightBookingSummary }) {
  // Older bookings were saved without a route summary, and the Benzy
  // transaction id only exists once ticketing succeeds - fall back gracefully.
  const route =
    booking.fromCode && booking.toCode
      ? `${booking.fromCode} → ${booking.toCode}`
      : 'Flight booking';
  const reference = booking.pnr
    ? `PNR ${booking.pnr}`
    : booking.transactionId
      ? `Txn ${booking.transactionId}`
      : `Booking ${booking.bookingId}`;
  return (
    <CardShell tab="flights">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-(--color-foreground)">
              {route}
            </h3>
            <StatusBadge status={booking.status} />
          </div>
          <p className="mt-1 text-sm text-(--color-inactive)">
            {booking.airline ? `${booking.airline} · ` : ''}
            {reference}
          </p>
        </div>
        <p className="text-lg font-extrabold text-(--color-foreground)">
          {formatMoney(booking.totalAmount, booking.currency)}
        </p>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
        {booking.departureDate && (
          <MetaRow icon={CalendarDays}>{formatDate(booking.departureDate)}</MetaRow>
        )}
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
    <CardShell tab="hotels">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-(--color-foreground)">
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
        <p className="text-lg font-extrabold text-(--color-foreground)">
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
            className="rounded-xl border border-(--color-danger) px-4 py-2 text-sm font-semibold text-(--color-danger) transition hover:bg-(--color-danger) hover:text-white"
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
    <CardShell tab="insurance">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-(--color-foreground)">
              {booking.policyType || 'Insurance policy'}
            </h3>
            <StatusBadge status={booking.status} />
          </div>
          <p className="mt-1 text-sm text-(--color-inactive)">
            {booking.policyNumber
              ? `Policy ${booking.policyNumber}`
              : `Booking ${booking.bookingId}`}
          </p>
        </div>
        <p className="text-lg font-extrabold text-(--color-foreground)">
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
      {booking.transactionId && (
        <Link
          href={`/booking/insurance/confirmation/${encodeURIComponent(booking.transactionId)}`}
          className="group/btn mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-(--color-links) hover:opacity-80"
        >
          View policy
          <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
        </Link>
      )}
    </CardShell>
  );
}

const PAYMENT_STATUS: Record<PaymentStatus, { label: string; cls: string }> = {
  PAID: { label: 'Paid', cls: STATUS_STYLES.Confirmed },
  INITIATED: { label: 'Pending', cls: STATUS_STYLES.Pending },
  REDIRECTED: { label: 'Pending', cls: STATUS_STYLES.Pending },
  FAILED: { label: 'Failed', cls: STATUS_STYLES.Cancelled },
  CANCELLED: { label: 'Cancelled', cls: STATUS_STYLES.Cancelled },
  EXPIRED: { label: 'Expired', cls: STATUS_STYLES.Cancelled },
  REFUND_PENDING: { label: 'Refund pending', cls: STATUS_STYLES.Refunded },
  REFUNDED: { label: 'Refunded', cls: STATUS_STYLES.Refunded },
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function PaymentCard({ payment }: { payment: CustomPayment }) {
  const status = PAYMENT_STATUS[payment.status];
  return (
    <CardShell tab="payments">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-(--color-foreground)">
              Custom payment
            </h3>
            <span
              className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${status.cls}`}
            >
              {status.label}
            </span>
          </div>
          <p className="mt-1 text-sm text-(--color-inactive)">Via ICICI Bank</p>
        </div>
        <p className="text-lg font-extrabold text-(--color-foreground)">
          {new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2,
          }).format(Number(payment.amount))}
        </p>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
        <MetaRow icon={CalendarDays}>
          {formatDateTime(payment.paidAt ?? payment.createdAt)}
        </MetaRow>
        <MetaRow icon={Hash}>Ref {payment.merchantTxnNo}</MetaRow>
      </div>
    </CardShell>
  );
}
