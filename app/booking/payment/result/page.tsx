'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRequireAuth } from '@/contexts/AuthContext';
import { BookButton, SecondaryButton, StatusCard } from '@/components/Results/ui';
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
    // Payment itself failed/cancelled - nothing to poll.
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

        // Still PENDING_PAYMENT / TICKETING - keep waiting.
        setView('ticketing');
      } catch {
        // Transient read error - keep polling until timeout.
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

  if (view === 'verifying' || view === 'ticketing') {
    return (
      <StatusCard
        tone="loading"
        title={view === 'verifying' ? 'Confirming your payment…' : 'Issuing your ticket…'}
        message={<>Please don&apos;t close or refresh this page. This can take up to a minute.</>}
      />
    );
  }

  if (view === 'slow') {
    return (
      <StatusCard
        tone="pending"
        title="Your payment went through"
        message={
          <>
            We&apos;re still issuing your ticket. You&apos;ll receive a confirmation by email shortly, and it will
            appear under <span className="font-semibold text-(--color-foreground)">My Bookings</span>. You can
            safely leave this page.
          </>
        }
        actions={
          <>
            <SecondaryButton href="/orders">My Bookings</SecondaryButton>
            <BookButton href="/">Back to home</BookButton>
          </>
        }
      />
    );
  }

  if (view === 'failed_payment') {
    return (
      <StatusCard
        tone="error"
        title="Payment not completed"
        message={
          <>
            Your payment was {status === 'CANCELLED' ? 'cancelled' : 'not successful'} and no ticket was booked.
            You can try again.
          </>
        }
        actions={<BookButton href="/booking/flights">Search flights again</BookButton>}
      />
    );
  }

  return (
    <StatusCard
      tone="error"
      title="We couldn't complete your booking"
      message={
        <>
          Your payment was received, but we were unable to issue the ticket{detail ? ` (${detail})` : ''}. Our team
          has been notified and will process a refund. Please contact support if you have any questions.
        </>
      }
      actions={<BookButton href="/">Back to home</BookButton>}
    />
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense fallback={<StatusCard tone="loading" title="Confirming your payment…" message="" />}>
      <PaymentResultContent />
    </Suspense>
  );
}
