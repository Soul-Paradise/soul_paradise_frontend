'use client';
import { TripInsuranceOfferCard } from '@/components/Insurance/TripInsuranceOffer';

import { AirlineLogo } from '@/components/AirlineLogo';
import { useEffect, useState, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  getBookingDetails,
  downloadTicketPdf,
  cancelBooking,
  type BookingDetailsResponse,
} from '@/lib/flights-api';
import { useRequireAuth } from '@/contexts/AuthContext';
import { AlertTriangle, Download, ExternalLink, Plane } from 'lucide-react';
import { FareRulesAccordion } from '@/components/FlightBookingDetails/FareRulesAccordion';
import {
  BookButton,
  ConfirmationHero,
  ConfirmationPage,
  ConfirmationRow,
  ConfirmationSection,
  ResultsEmpty,
  ResultsLoader,
  SecondaryButton,
  StepState,
} from '@/components/Results/ui';

function formatTime(isoString: string) {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatDate(isoString: string) {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Benzy BookingDate "2020-05-21 02:24:24" -> "21 May 2020". */
function formatBookingDate(raw: string) {
  const d = new Date(raw.replace(' ', 'T'));
  return Number.isNaN(d.getTime())
    ? raw
    : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency || 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

const STATE_STYLE: Record<string, { color: string; bgColor: string }> = {
  confirmed: { color: 'text-green-700', bgColor: 'bg-green-50 border-green-200' },
  held: { color: 'text-sky-700', bgColor: 'bg-sky-50 border-sky-200' },
  partial: { color: 'text-amber-800', bgColor: 'bg-amber-50 border-amber-200' },
  pending: { color: 'text-yellow-800', bgColor: 'bg-yellow-50 border-yellow-200' },
  failed: { color: 'text-red-700', bgColor: 'bg-red-50 border-red-200' },
  cancelled: { color: 'text-red-700', bgColor: 'bg-red-50 border-red-200' },
};

/** "1" -> "T1"; terminals arrive normalised ("Terminal 3" -> "3"). */
const terminal = (t?: string) => (t ? ` · T${t}` : '');

// Fallback for older API responses without statusLabel/statusState.
function getStatusInfo(status: string): {
  label: string;
  color: string;
  bgColor: string;
} {
  switch (status) {
    case 'BO0':
      return {
        label: 'Booked',
        color: 'text-green-700',
        bgColor: 'bg-green-50 border-green-200',
      };
    case 'TO0':
      return {
        label: 'Ticketed',
        color: 'text-green-700',
        bgColor: 'bg-green-50 border-green-200',
      };
    case 'BO1':
      return {
        label: 'Booking Failed',
        color: 'text-red-700',
        bgColor: 'bg-red-50 border-red-200',
      };
    case 'TO1':
      return {
        label: 'Ticketing Failed',
        color: 'text-red-700',
        bgColor: 'bg-red-50 border-red-200',
      };
    default:
      return {
        label: status || 'Processing',
        color: 'text-yellow-700',
        bgColor: 'bg-yellow-50 border-yellow-200',
      };
  }
}

function ConfirmationContent() {
  useRequireAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const transactionId = searchParams.get('transactionId') || '';

  const [booking, setBooking] = useState<BookingDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelMessage, setCancelMessage] = useState('');
  const [confirmCancel, setConfirmCancel] = useState(false);

  const handleDownload = useCallback(async () => {
    if (!transactionId || downloading) return;
    setDownloading(true);
    try {
      await downloadTicketPdf(transactionId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Download failed';
      setError(msg);
    } finally {
      setDownloading(false);
    }
  }, [transactionId, downloading]);

  const loadBooking = useCallback(async () => {
    if (!transactionId) {
      setError('No booking reference found.');
      setLoading(false);
      return;
    }

    try {
      const data = await getBookingDetails(transactionId);
      setBooking(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load booking details.');
    } finally {
      setLoading(false);
    }
  }, [transactionId]);

  // Runs from the confirmation dialog, which shows the fare's cancellation
  // charges first (RetrieveBooking.Rules) instead of a bare browser confirm().
  const handleCancel = useCallback(async () => {
    if (!transactionId || cancelling) return;
    setConfirmCancel(false);
    setCancelling(true);
    setError('');
    setCancelMessage('');
    try {
      const result = await cancelBooking(transactionId);
      setCancelMessage(result.message || 'Cancellation request submitted.');
      await loadBooking();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Cancellation failed';
      setError(msg);
    } finally {
      setCancelling(false);
    }
  }, [transactionId, cancelling, loadBooking]);

  useEffect(() => {
    loadBooking();
  }, [loadBooking]);

  if (loading) {
    return (
      <StepState>
        <ResultsLoader title="Loading booking details..." rows={2} />
      </StepState>
    );
  }

  if (error) {
    return (
      <StepState>
        <ResultsEmpty
          icon={AlertTriangle}
          title="Something went wrong"
          message={error}
          action={{ label: 'Go Home', href: '/' }}
        />
      </StepState>
    );
  }

  if (!booking) return null;

  // The backend decodes Benzy's codes, including round trips ("TO0,TR0") and
  // cancellations (CancellationID is 0 / RefundAmount null until cancelled).
  const legacy = getStatusInfo(booking.status);
  const state = booking.statusState ?? (['BO0', 'TO0'].includes(booking.status) ? 'confirmed' : /fail/i.test(legacy.label) ? 'failed' : 'pending');
  const statusInfo = { label: booking.statusLabel || legacy.label, ...(STATE_STYLE[state] ?? STATE_STYLE.pending) };
  const isCancelled = booking.cancelled ?? state === 'cancelled';
  const isSuccess = (state === 'confirmed' || state === 'partial') && !isCancelled;
  const canCancel = isSuccess;
  const isFailed = state === 'failed' || isCancelled;
  const fareRules = booking.fareRules ?? [];

  const showTicketStatus = booking.passengers.some(
    (p) => p.ticketStatus && p.ticketStatus !== statusInfo.label,
  );
  // Per-flight ticket numbers matter when legs were ticketed separately.
  const multiTicket = booking.passengers.some(
    (p) => new Set((p.tickets ?? []).map((t) => t.ticketNumber).filter(Boolean)).size > 1,
  );
  const showAddOns = booking.passengers.some((p) => (p.addOns ?? []).length > 0);
  const showPassport = booking.passengers.some(
    (p) => p.passportNo || p.nationality || p.passportExpiry,
  );
  const showAge = booking.passengers.some((p) => p.age != null);

  const th = 'text-left px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-(--color-inactive)';
  const td = 'px-5 py-3 text-(--color-inactive)';

  return (
    <ConfirmationPage
      actions={
        <>
          {canCancel && (
            <button
              type="button"
              onClick={() => setConfirmCancel(true)}
              disabled={cancelling}
              className="inline-flex items-center justify-center rounded-full border border-(--color-danger) bg-white px-5 py-2.5 text-sm font-bold text-(--color-danger) transition-colors hover:bg-(--color-danger) hover:text-white disabled:opacity-60"
            >
              {cancelling ? 'Cancelling…' : 'Cancel Booking'}
            </button>
          )}
          <SecondaryButton href="/orders">My Bookings</SecondaryButton>
          <BookButton onClick={() => router.push('/')}>Back to home</BookButton>
        </>
      }
    >
      <ConfirmationHero
        tone={isSuccess ? 'success' : isFailed ? 'error' : 'pending'}
        title={
          isCancelled
            ? 'Booking Cancelled'
            : state === 'partial'
              ? 'Booking Partly Confirmed'
              : isSuccess
                ? 'Booking Confirmed'
                : 'Booking Status'
        }
        badge={
          <span
            className={`inline-block px-3 py-1 text-xs font-semibold border rounded-full ${statusInfo.bgColor} ${statusInfo.color}`}
          >
            {statusInfo.label}
          </span>
        }
        subtitle={
          booking.contactEmail && (
            <>
              Your e-ticket has been sent to{' '}
              <span className="font-semibold text-(--color-foreground)">{booking.contactEmail}</span>
            </>
          )
        }
        refs={[
          { label: 'Booking ID', value: booking.bookingId },
          { label: 'Transaction ID', value: booking.transactionId },
          ...(booking.flights[0]?.pnr
            ? [{ label: booking.flights[0].airlinePnr ? 'Airline PNR' : 'PNR', value: booking.flights[0].pnr }]
            : []),
          ...(booking.bookingDate ? [{ label: 'Booked on', value: formatBookingDate(booking.bookingDate) }] : []),
          { label: 'Total paid', value: formatCurrency(booking.totalAmount, booking.currency) },
        ]}
      >
        <SecondaryButton onClick={handleDownload} disabled={downloading} icon={Download}>
          {downloading ? 'Preparing…' : 'Download Ticket (PDF)'}
        </SecondaryButton>
      </ConfirmationHero>

      {confirmCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="cancel-title">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmCancel(false)} />
          <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:p-6">
            <h2 id="cancel-title" className="text-lg font-bold text-(--color-foreground)">Cancel this booking?</h2>
            <p className="mt-1 text-sm text-(--color-inactive)">
              The airline&apos;s cancellation charges below apply. The final refund is confirmed by the airline
              after cancellation and will be shown on this page. This cannot be undone.
            </p>
            {fareRules.length > 0 ? (
              <div className="mt-4">
                <FareRulesAccordion fareRules={fareRules} />
              </div>
            ) : (
              <p className="mt-4 rounded-lg bg-(--color-background) px-4 py-3 text-sm text-(--color-inactive)">
                The airline has not published cancellation charges for this ticket. Charges apply as per airline
                rules.
              </p>
            )}
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <SecondaryButton onClick={() => setConfirmCancel(false)}>Keep booking</SecondaryButton>
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex items-center justify-center rounded-full bg-(--color-danger) px-5 py-2.5 text-sm font-bold text-white hover:opacity-90"
              >
                Yes, cancel booking
              </button>
            </div>
          </div>
        </div>
      )}

      {isSuccess && !isCancelled && (
        <TripInsuranceOfferCard service="FLIGHT" bookingId={booking.transactionId || booking.bookingId} />
      )}

      {cancelMessage && (
        <div className="rounded-2xl border border-(--color-success)/30 bg-(--color-success)/10 p-4 text-center text-sm font-semibold text-(--color-success)">
          {cancelMessage}
        </div>
      )}

      <ConfirmationSection title="Flight Details" flush>
        <div className="divide-y divide-(--color-tertiary-button)">
          {booking.flights.map((flight, i) => (
            <div key={i} className="p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <AirlineLogo
                  code={flight.airlineCode}
                  name={flight.airline}
                  size={40}
                  fallback={
                    <div className="w-10 h-10 rounded-xl bg-(--color-primary-tint) flex items-center justify-center text-xs font-bold text-(--color-links)">
                      {flight.airlineCode}
                    </div>
                  }
                />
                <div>
                  <div className="text-sm font-bold text-(--color-foreground)">{flight.airline}</div>
                  <div className="text-xs text-(--color-inactive)">
                    {flight.airlineCode && !flight.flightNo.toUpperCase().startsWith(flight.airlineCode)
                      ? `${flight.airlineCode} ${flight.flightNo}`
                      : flight.flightNo}
                    {flight.operatingAirlineCode && (
                      <span className="ml-1">· Operated by {flight.operatingAirlineCode}</span>
                    )}
                  </div>
                </div>
                <div className="ml-auto flex items-center gap-3">
                  {/* No Refundable/Non-refundable badge: the yes/no flag can
                      contradict the ticket's fare rules shown on this page. */}
                  {flight.pnr && (
                    <div className="text-right">
                      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-(--color-inactive)">
                        {flight.airlinePnr ? 'Airline PNR' : 'PNR'}
                      </div>
                      <div className="text-sm font-bold text-(--color-links)">{flight.pnr}</div>
                      {flight.airlinePnr && flight.crsPnr && flight.crsPnr !== flight.airlinePnr && (
                        <div className="text-[10px] text-(--color-inactive)">Booking ref {flight.crsPnr}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Aircraft / class / baggage - as printed on the e-ticket */}
              <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-(--color-inactive)">
                {flight.aircraft && <span>Aircraft: <span className="font-semibold text-(--color-foreground)">{flight.aircraft}</span></span>}
                {flight.cabin && <span>Class: <span className="font-semibold text-(--color-foreground)">{flight.cabin}</span></span>}
                <span>
                  Check-in: <span className="font-semibold text-(--color-foreground)">{flight.baggage || 'As per airline policy'}</span>
                </span>
                <span>
                  Cabin: <span className="font-semibold text-(--color-foreground)">{flight.cabinBaggage || 'As per airline policy'}</span>
                </span>
                {flight.airlineContact && <span>Airline care: {flight.airlineContact}</span>}
              </div>

              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-xl font-extrabold text-(--color-foreground)">{formatTime(flight.departureTime)}</div>
                  <div className="text-xs font-bold text-(--color-foreground)">
                    {flight.from}
                    {terminal(flight.departureTerminal)}
                  </div>
                  <div className="text-xs text-(--color-inactive)">{flight.fromName}</div>
                  <div className="text-xs text-(--color-inactive)">{formatDate(flight.departureTime)}</div>
                </div>

                <div className="flex-1 flex flex-col items-center px-2">
                  <div className="text-xs text-(--color-inactive) mb-1">{flight.duration}</div>
                  <div className="w-full flex items-center">
                    <div className="h-px flex-1 border-t border-dashed border-(--color-tertiary-button)" />
                    <Plane className="w-4 h-4 text-(--color-links) ml-1" aria-hidden="true" />
                  </div>
                  {(flight.hops ?? []).length > 0 && (
                    <div className="mt-1 text-[11px] text-(--color-inactive) text-center">
                      {flight.hops!.map((h) => `Technical stop: ${h.name}${h.duration ? ` (${h.duration})` : ''}`).join(' · ')}
                    </div>
                  )}
                </div>

                <div className="text-center">
                  <div className="text-xl font-extrabold text-(--color-foreground)">{formatTime(flight.arrivalTime)}</div>
                  <div className="text-xs font-bold text-(--color-foreground)">
                    {flight.to}
                    {terminal(flight.arrivalTerminal)}
                  </div>
                  <div className="text-xs text-(--color-inactive)">{flight.toName}</div>
                  <div className="text-xs text-(--color-inactive)">{formatDate(flight.arrivalTime)}</div>
                </div>
              </div>

              {flight.webCheckinUrl && (
                <div className="mt-4 pt-3 border-t border-(--color-tertiary-button)">
                  <a
                    href={flight.webCheckinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-(--color-links) hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Web Check-in
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      </ConfirmationSection>

      <ConfirmationSection title="Passengers" flush>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-(--color-background)">
              <tr>
                <th className={th}>Name</th>
                <th className={th}>Type</th>
                {showAge && <th className={th}>Age</th>}
                <th className={th}>{multiTicket ? 'Ticket Numbers' : 'Ticket Number'}</th>
                {showTicketStatus && <th className={th}>Ticket Status</th>}
                {showAddOns && <th className={th}>Seat / Meal / Baggage</th>}
                {showPassport && <th className={th}>Passport</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-(--color-tertiary-button)">
              {booking.passengers.map((pax, i) => (
                <tr key={i}>
                  <td className="px-5 py-3 font-bold text-(--color-foreground)">{pax.name}</td>
                  <td className={td}>
                    {pax.paxType === 'ADT' ? 'Adult' : pax.paxType === 'CHD' ? 'Child' : 'Infant'}
                  </td>
                  {showAge && <td className={td}>{pax.age != null ? pax.age : '-'}</td>}
                  <td className={td}>
                    {multiTicket ? (
                      <div className="space-y-0.5">
                        {(pax.tickets ?? []).map((t, ti) => (
                          <div key={ti}>
                            <span className="font-semibold text-(--color-foreground)">{t.ticketNumber || 'Pending'}</span>
                            <span className="ml-1 text-xs">{t.flight}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      pax.ticketNumber || 'Pending'
                    )}
                  </td>
                  {showTicketStatus && (
                    <td className={td}>
                      {pax.ticketStatus && pax.ticketStatus !== statusInfo.label ? pax.ticketStatus : '-'}
                    </td>
                  )}
                  {showAddOns && (
                    <td className={td}>
                      {(pax.addOns ?? []).length ? (
                        <div className="space-y-0.5">
                          {pax.addOns!.map((a, ai) => (
                            <div key={ai}>
                              <span className="font-semibold text-(--color-foreground)">{a.item}</span>
                              {a.flight && <span className="ml-1 text-xs">{a.flight}</span>}
                            </div>
                          ))}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                  )}
                  {showPassport && (
                    <td className={td}>
                      {pax.passportNo || pax.nationality ? (
                        <div className="space-y-0.5">
                          {pax.passportNo && (
                            <div className="font-semibold text-(--color-foreground)">{pax.passportNo}</div>
                          )}
                          {pax.nationality && <div className="text-xs">{pax.nationality}</div>}
                          {pax.passportExpiry && <div className="text-xs">Exp: {pax.passportExpiry}</div>}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ConfirmationSection>

      {booking.crossSell && booking.crossSell.length > 0 && (
        <ConfirmationSection title="Add-ons" flush>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-(--color-background)">
                <tr>
                  <th className={th}>Item</th>
                  <th className={th}>Status</th>
                  <th className={`${th} text-right`}>Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--color-tertiary-button)">
                {booking.crossSell.map((item, i) => (
                  <tr key={i}>
                    <td className="px-5 py-3 font-bold text-(--color-foreground)">{item.code}</td>
                    <td className={td}>{item.status}</td>
                    <td className="px-5 py-3 text-right font-semibold text-(--color-foreground)">
                      {formatCurrency(item.amount, booking.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ConfirmationSection>
      )}

      {isCancelled && (
        <ConfirmationSection title="Cancellation & Refund">
          <dl>
            <ConfirmationRow label="Cancellation ID" value={booking.cancellationId || null} />
            <ConfirmationRow label="Amount paid" value={formatCurrency(booking.totalAmount, booking.currency)} />
            <ConfirmationRow
              label="Refund amount"
              value={
                booking.refundAmount != null
                  ? formatCurrency(booking.refundAmount, booking.currency)
                  : 'Being processed by the airline'
              }
            />
            {booking.cancellationCharge != null && (
              <ConfirmationRow
                label="Cancellation charges"
                value={formatCurrency(booking.cancellationCharge, booking.currency)}
              />
            )}
          </dl>
        </ConfirmationSection>
      )}

      {/* Has its own "Fare Rules" card + heading. */}
      {fareRules.length > 0 && !isCancelled && <FareRulesAccordion fareRules={fareRules} />}

      <ConfirmationSection title="Payment">
        <dl>
          <ConfirmationRow label="Payment Status" value={booking.paymentStatus} />
          <ConfirmationRow
            label="Sector"
            value={booking.sectorType ? booking.sectorType.charAt(0) + booking.sectorType.slice(1).toLowerCase() : null}
          />
          <ConfirmationRow label="Invoice" value={booking.invoice} />
          {booking.fareBreakdown && booking.fareBreakdown.addOns > 0 && (
            <>
              <ConfirmationRow label="Ticket Fare" value={formatCurrency(booking.fareBreakdown.ticketFare, booking.currency)} />
              <ConfirmationRow label="Add-ons" value={formatCurrency(booking.fareBreakdown.addOns, booking.currency)} />
            </>
          )}
          <ConfirmationRow label="Total Paid" value={formatCurrency(booking.totalAmount, booking.currency)} strong />
        </dl>
      </ConfirmationSection>

      {(booking.contactEmail || booking.contactMobile || booking.gstTin) && (
        <ConfirmationSection title="Contact">
          <dl>
            <ConfirmationRow label="Email" value={booking.contactEmail} />
            <ConfirmationRow label="Mobile" value={booking.contactMobile} />
            {booking.gstTin && <ConfirmationRow label="GST company" value={booking.gstCompanyName || null} />}
            {booking.gstTin && <ConfirmationRow label="GSTIN" value={booking.gstTin} />}
          </dl>
        </ConfirmationSection>
      )}
    </ConfirmationPage>
  );
}

export default function BookingConfirmationPage() {
  return (
    <Suspense
      fallback={
        <StepState>
          <ResultsLoader title="Loading booking..." rows={2} />
        </StepState>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
