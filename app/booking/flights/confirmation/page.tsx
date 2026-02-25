'use client';

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  getBookingDetails,
  type BookingDetailsResponse,
} from '@/lib/flights-api';

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
  const searchParams = useSearchParams();
  const router = useRouter();
  const transactionId = searchParams.get('transactionId') || '';

  const [booking, setBooking] = useState<BookingDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  useEffect(() => {
    loadBooking();
  }, [loadBooking]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-(--color-links) mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Loading booking details...
          </h3>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 text-center max-w-md mx-4">
          <svg
            className="w-16 h-16 text-red-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Something went wrong
          </h3>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-(--color-links) text-white text-sm font-semibold rounded-md hover:opacity-90"
          >
            Go Home
          </button>
        </div>
      </main>
    );
  }

  if (!booking) return null;

  const statusInfo = getStatusInfo(booking.status);
  const isSuccess = ['BO0', 'TO0'].includes(booking.status);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center">
          {isSuccess ? (
            <svg
              className="w-16 h-16 text-green-500 mx-auto mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ) : (
            <svg
              className="w-16 h-16 text-yellow-500 mx-auto mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
          <h1 className="text-xl font-bold text-gray-900 mb-1">
            {isSuccess ? 'Booking Confirmed!' : 'Booking Status'}
          </h1>
          <span
            className={`inline-block px-3 py-1 text-xs font-semibold border rounded-full ${statusInfo.bgColor} ${statusInfo.color}`}
          >
            {statusInfo.label}
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Booking Reference */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xs text-gray-500 uppercase font-medium mb-1">
                Booking ID
              </div>
              <div className="text-sm font-semibold text-gray-900">
                {booking.bookingId}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase font-medium mb-1">
                Transaction ID
              </div>
              <div className="text-sm font-semibold text-gray-900">
                {booking.transactionId}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase font-medium mb-1">
                Total Amount
              </div>
              <div className="text-lg font-bold text-gray-900">
                {formatCurrency(booking.totalAmount, booking.currency)}
              </div>
            </div>
          </div>
        </div>

        {/* Flight Details */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Flight Details
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {booking.flights.map((flight, i) => (
              <div key={i} className="p-4 sm:p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                    {flight.airlineCode}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      {flight.airline}
                    </div>
                    <div className="text-xs text-gray-500">
                      {flight.flightNo}
                    </div>
                  </div>
                  {flight.pnr && (
                    <div className="ml-auto text-right">
                      <div className="text-xs text-gray-500">PNR</div>
                      <div className="text-sm font-bold text-(--color-links)">
                        {flight.pnr}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900">
                      {formatTime(flight.departureTime)}
                    </div>
                    <div className="text-xs text-gray-700 font-medium">
                      {flight.from}
                      {flight.departureTerminal
                        ? ` T${flight.departureTerminal}`
                        : ''}
                    </div>
                    <div className="text-xs text-gray-500">
                      {flight.fromName}
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatDate(flight.departureTime)}
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col items-center px-2">
                    <div className="text-xs text-gray-500 mb-1">
                      {flight.duration}
                    </div>
                    <div className="w-full flex items-center">
                      <div className="h-px flex-1 bg-gray-300" />
                      <svg
                        className="w-4 h-4 text-gray-400 -ml-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900">
                      {formatTime(flight.arrivalTime)}
                    </div>
                    <div className="text-xs text-gray-700 font-medium">
                      {flight.to}
                      {flight.arrivalTerminal
                        ? ` T${flight.arrivalTerminal}`
                        : ''}
                    </div>
                    <div className="text-xs text-gray-500">
                      {flight.toName}
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatDate(flight.arrivalTime)}
                    </div>
                  </div>
                </div>

                {/* Web check-in link */}
                {flight.webCheckinUrl && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <a
                      href={flight.webCheckinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-(--color-links) hover:underline"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                      Web Check-in
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Passengers & Tickets */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Passengers
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
                  <th className="text-left px-5 py-2 font-medium">Name</th>
                  <th className="text-left px-5 py-2 font-medium">Type</th>
                  <th className="text-left px-5 py-2 font-medium">
                    Ticket Number
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {booking.passengers.map((pax, i) => (
                  <tr key={i}>
                    <td className="px-5 py-3 text-gray-900 font-medium">
                      {pax.name}
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {pax.paxType === 'ADT'
                        ? 'Adult'
                        : pax.paxType === 'CHD'
                          ? 'Child'
                          : 'Infant'}
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {pax.ticketNumber || 'Pending'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Contact Info */}
        {(booking.contactEmail || booking.contactMobile) && (
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
              Contact
            </h2>
            <div className="flex flex-wrap gap-6 text-sm">
              {booking.contactEmail && (
                <div>
                  <span className="text-xs text-gray-500">Email: </span>
                  <span className="text-gray-900">{booking.contactEmail}</span>
                </div>
              )}
              {booking.contactMobile && (
                <div>
                  <span className="text-xs text-gray-500">Mobile: </span>
                  <span className="text-gray-900">{booking.contactMobile}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => window.print()}
            className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded-md hover:bg-gray-50 transition-colors"
          >
            Print Booking
          </button>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2.5 bg-(--color-links) text-white text-sm font-semibold rounded-md hover:opacity-90 transition-opacity"
          >
            Back to Home
          </button>
        </div>
      </div>
    </main>
  );
}

export default function BookingConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-(--color-links) mb-4" />
            <p className="text-gray-500">Loading booking...</p>
          </div>
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
