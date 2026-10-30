'use client';

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

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency || 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

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

  const handleCancel = useCallback(async () => {
    if (!transactionId || cancelling) return;
    if (
      !window.confirm(
        'Are you sure you want to cancel this booking? This action cannot be undone.',
      )
    )
      return;
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

  const statusInfo = getStatusInfo(booking.status);
  const isSuccess = ['BO0', 'TO0'].includes(booking.status);
  const isCancelled = Boolean(
    booking.cancellationId ||
      booking.refundAmount != null ||
      booking.paymentStatus?.toLowerCase().includes('cancel'),
  );
  const canCancel = isSuccess && !isCancelled;
  const isFailed = /fail|cancel/i.test(statusInfo.label);

  const showTicketStatus = booking.passengers.some(
    (p) => p.ticketStatus && p.ticketStatus !== booking.status,
  );
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
              onClick={handleCancel}
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
        title={isSuccess ? 'Booking Confirmed' : 'Booking Status'}
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
          ...(booking.flights[0]?.pnr ? [{ label: 'PNR', value: booking.flights[0].pnr }] : []),
          { label: 'Total paid', value: formatCurrency(booking.totalAmount, booking.currency) },
        ]}
      >
        <SecondaryButton onClick={handleDownload} disabled={downloading} icon={Download}>
          {downloading ? 'Preparing…' : 'Download Ticket (PDF)'}
        </SecondaryButton>
      </ConfirmationHero>

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
                <div className="w-10 h-10 rounded-xl bg-(--color-primary-tint) flex items-center justify-center text-xs font-bold text-(--color-links)">
                  {flight.airlineCode}
                </div>
                <div>
                  <div className="text-sm font-bold text-(--color-foreground)">{flight.airline}</div>
                  <div className="text-xs text-(--color-inactive)">{flight.flightNo}</div>
                </div>
                <div className="ml-auto flex items-center gap-3">
                  {flight.refundable != null && (
                    <span
                      className={`inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                        flight.refundable
                          ? 'bg-(--color-success)/10 text-(--color-success)'
                          : 'bg-(--color-danger)/10 text-(--color-danger)'
                      }`}
                    >
                      {flight.refundable ? 'Refundable' : 'Non-refundable'}
                    </span>
                  )}
                  {flight.pnr && (
                    <div className="text-right">
                      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-(--color-inactive)">PNR</div>
                      <div className="text-sm font-bold text-(--color-links)">{flight.pnr}</div>
                    </div>
                  )}
                </div>
              </div>

              {flight.airlineContact && (
                <div className="text-xs text-(--color-inactive) mb-3">Airline care: {flight.airlineContact}</div>
              )}

              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-xl font-extrabold text-(--color-foreground)">{formatTime(flight.departureTime)}</div>
                  <div className="text-xs font-bold text-(--color-foreground)">
                    {flight.from}
                    {flight.departureTerminal ? ` T${flight.departureTerminal}` : ''}
                  </div>
                  <div className="text-xs text-(--color-inactive)">{flight.fromName}</div>
                  <div className="text-xs text-(--color-inactive)">{formatDate(flight.departureTime)}</div>
                </div>

                <div className="flex-1 flex flex-col items-center px-2">
                  <div className="text-xs text-(--color-inactive) mb-1">{flight.duration}</div>
                  <div className="w-full flex items-center">
                    <div className="h-px flex-1 border-t border-dashed border-(--color-tertiary-button)" />
                    <Plane className="w-4 h-4 text-(--color-links) ml-1" />
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-xl font-extrabold text-(--color-foreground)">{formatTime(flight.arrivalTime)}</div>
                  <div className="text-xs font-bold text-(--color-foreground)">
                    {flight.to}
                    {flight.arrivalTerminal ? ` T${flight.arrivalTerminal}` : ''}
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
                <th className={th}>Ticket Number</th>
                {showTicketStatus && <th className={th}>Ticket Status</th>}
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
                  <td className={td}>{pax.ticketNumber || 'Pending'}</td>
                  {showTicketStatus && (
                    <td className={td}>
                      {pax.ticketStatus && pax.ticketStatus !== booking.status ? pax.ticketStatus : '-'}
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

      {(booking.cancellationId || booking.refundAmount != null || booking.cancellationCharge != null) && (
        <ConfirmationSection title="Cancellation & Refund">
          <dl>
            <ConfirmationRow label="Cancellation ID" value={booking.cancellationId} />
            {booking.refundAmount != null && (
              <ConfirmationRow label="Refund Amount" value={formatCurrency(booking.refundAmount, booking.currency)} />
            )}
            {booking.cancellationCharge != null && (
              <ConfirmationRow
                label="Cancellation Charge"
                value={formatCurrency(booking.cancellationCharge, booking.currency)}
              />
            )}
          </dl>
        </ConfirmationSection>
      )}

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

      {(booking.contactEmail || booking.contactMobile) && (
        <ConfirmationSection title="Contact">
          <dl>
            <ConfirmationRow label="Email" value={booking.contactEmail} />
            <ConfirmationRow label="Mobile" value={booking.contactMobile} />
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
