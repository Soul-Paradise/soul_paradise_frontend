'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authHeaders } from '@/lib/api';
import { useRequireAuth } from '@/contexts/AuthContext';
import { BookButton, SecondaryButton, StatusCard } from '@/components/Results/ui';
import { BookingConfirmation, type BookingVoucher } from '@/components/HotelBooking/HotelVoucher';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

// After a successful payment the backend books the hotel with the supplier,
// which can take a while. Poll until the voucher exists; past the timeout we
// reassure the customer instead (the backend finishes regardless of this tab).
const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 120000;

type View = 'booking' | 'booked' | 'failed_payment' | 'failed_booking' | 'slow';

interface HotelBookingStatus {
  bookingId: string;
  status: string;
  inProgress: boolean;
  paymentStatus: string;
  voucher: BookingVoucher | null;
}

async function getHotelBookingStatus(merchantTxnNo: string): Promise<HotelBookingStatus> {
  const res = await fetch(`${API_URL}/hotels/booking-status/${encodeURIComponent(merchantTxnNo)}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Could not load booking status');
  return res.json();
}

function ResultContent() {
  useRequireAuth();
  const router = useRouter();
  const params = useSearchParams();
  const status = (params.get('status') || '').toUpperCase();
  const merchantTxnNo = params.get('txn') || '';
  const [view, setView] = useState<View>(status === 'PAID' && merchantTxnNo ? 'booking' : 'failed_payment');
  const [voucher, setVoucher] = useState<BookingVoucher | null>(null);
  const stopped = useRef(false);

  useEffect(() => {
    if (status !== 'PAID' || !merchantTxnNo) return;
    stopped.current = false;
    const startedAt = Date.now();

    const poll = async () => {
      if (stopped.current) return;
      try {
        const s = await getHotelBookingStatus(merchantTxnNo);
        if (s.status === 'BOOKING_FAILED') {
          stopped.current = true;
          setView('failed_booking');
          return;
        }
        if (s.voucher) {
          stopped.current = true;
          setVoucher(s.voucher);
          setView('booked');
          return;
        }
      } catch {
        // Transient - keep polling until the timeout.
      }
      if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
        stopped.current = true;
        setView('slow');
        return;
      }
      setTimeout(poll, POLL_INTERVAL_MS);
    };

    void poll();
    return () => {
      stopped.current = true;
    };
  }, [status, merchantTxnNo]);

  if (view === 'booked' && voucher) {
    return <BookingConfirmation voucher={voucher} onDone={() => router.push('/')} />;
  }

  if (view === 'booking') {
    return (
      <StatusCard
        tone="loading"
        title="Confirming your stay…"
        message="Payment received. Please keep this page open while we book your room with the hotel. This can take up to two minutes."
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
            The hotel is still confirming your room. It will appear under{' '}
            <span className="font-semibold text-(--color-foreground)">My Bookings</span> and we&apos;ll email the
            voucher to you. You can safely leave this page.
          </>
        }
        actions={
          <>
            <SecondaryButton href="/orders?tab=hotels">My Bookings</SecondaryButton>
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
            Your payment was {status === 'CANCELLED' ? 'cancelled' : 'not successful'}, so no room was booked and
            you have not been charged. You can try again.
          </>
        }
        actions={<BookButton href="/?tab=hotel#booking">Search again</BookButton>}
      />
    );
  }

  return (
    <StatusCard
      tone="error"
      title="We couldn't book your room"
      message="Your payment was received, but the hotel could not confirm the booking. Our team has been notified and will refund you in full. Please contact support if you have any questions."
      actions={<BookButton href="/">Back to home</BookButton>}
    />
  );
}

export default function HotelPaymentResultPage() {
  return (
    <Suspense fallback={<StatusCard tone="loading" title="Confirming your stay…" message="" />}>
      <ResultContent />
    </Suspense>
  );
}
