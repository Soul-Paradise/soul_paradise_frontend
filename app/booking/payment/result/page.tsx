'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useRequireAuth } from '@/contexts/AuthContext';
import {
  getBookingStatusByTxn,
  type BookingStatusResponse,
} from '@/lib/flights-api';

// How long to keep polling for the ticket to be issued after a successful
// payment before telling the user we'll follow up (the backend keeps trying /
// flags for refund regardless of whether this tab stays open).
const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 90000;

const NON_TERMINAL = new Set(['PENDING_PAYMENT', 'TICKETING']);

type View = 'verifying' | 'ticketing' | 'failed_payment' | 'failed_ticket' | 'slow';

function PaymentResultContent() {
  useRequireAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const status = (searchParams.get('status') || '').toUpperCase();
  const merchantTxnNo = searchParams.get('txn') || '';

  const [view, setView] = useState<View>(
    status === 'PAID' ? 'verifying' : 'failed_payment',
  );
  const [detail, setDetail] = useState<string>('');
  const stopped = useRef(false);

  useEffect(() => {
    // Payment itself failed/cancelled — nothing to poll.
    if (status !== 'PAID') {
      setView('failed_payment');
      return;
    }
    if (!merchantTxnNo) {
      setView('failed_ticket');
      setDetail('Missing payment reference.');
      return;
    }

    stopped.current = false;
    const startedAt = Date.now();

    const poll = async () => {
      if (stopped.current) return;
      try {
        const s: BookingStatusResponse = await getBookingStatusByTxn(
          merchantTxnNo,
        );

        // Ticket issued: a Benzy transaction id is set and we're past the
        // in-progress states.
        if (s.transactionId && !NON_TERMINAL.has(s.status)) {
          stopped.current = true;
          router.replace(
            `/booking/flights/confirmation?transactionId=${encodeURIComponent(
              s.transactionId,
            )}`,
          );
          return;
        }

        if (s.status === 'TICKETING_FAILED') {
          stopped.current = true;
          setView('failed_ticket');
          return;
        }

        // Still PENDING_PAYMENT / TICKETING — keep waiting.
        setView('ticketing');
      } catch {
        // Transient read error — keep polling until timeout.
      }

      if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
        stopped.current = true;
        setView('slow');
        return;
      }
      if (!stopped.current) {
        setTimeout(poll, POLL_INTERVAL_MS);
      }
    };

    void poll();
    return () => {
      stopped.current = true;
    };
  }, [status, merchantTxnNo, router]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        {(view === 'verifying' || view === 'ticketing') && (
          <>
            <Spinner />
            <h1 className="mt-6 text-xl font-semibold text-gray-900">
              {view === 'verifying'
                ? 'Confirming your payment…'
                : 'Issuing your ticket…'}
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Please don&apos;t close or refresh this page. This can take up to
              a minute.
            </p>
          </>
        )}

        {view === 'slow' && (
          <>
            <h1 className="text-xl font-semibold text-gray-900">
              Your payment went through
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              We&apos;re still issuing your ticket. You&apos;ll receive a
              confirmation by email shortly, and it will appear under{' '}
              <span className="font-medium">My Bookings</span>. You can safely
              leave this page.
            </p>
            <Link
              href="/"
              className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Back to home
            </Link>
          </>
        )}

        {view === 'failed_payment' && (
          <>
            <h1 className="text-xl font-semibold text-gray-900">
              Payment not completed
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Your payment was {status === 'CANCELLED' ? 'cancelled' : 'not successful'} and
              no ticket was booked. You can try again.
            </p>
            <Link
              href="/booking/flights"
              className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Search flights again
            </Link>
          </>
        )}

        {view === 'failed_ticket' && (
          <>
            <h1 className="text-xl font-semibold text-gray-900">
              We couldn&apos;t complete your booking
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Your payment was received, but we were unable to issue the ticket
              {detail ? ` (${detail})` : ''}. Our team has been notified and
              will process a refund. Please contact support if you have any
              questions.
            </p>
            <Link
              href="/"
              className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Back to home
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <PaymentResultContent />
    </Suspense>
  );
}
