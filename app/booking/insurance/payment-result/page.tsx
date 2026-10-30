'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRequireAuth } from '@/contexts/AuthContext';
import { BookButton, SecondaryButton, StatusCard } from '@/components/Results/ui';
import { getInsuranceBookingStatus } from '@/lib/insurance-api';

// After a successful payment the backend calls Benzy StartPay, which can take
// a while. Poll until the policy is issued; past the timeout we reassure the
// customer instead (the backend finishes regardless of this tab).
const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 120000;

type View = 'issuing' | 'failed_payment' | 'failed_booking' | 'slow';

function ResultContent() {
  useRequireAuth();
  const router = useRouter();
  const params = useSearchParams();
  const status = (params.get('status') || '').toUpperCase();
  const merchantTxnNo = params.get('txn') || '';
  const [view, setView] = useState<View>(status === 'PAID' && merchantTxnNo ? 'issuing' : 'failed_payment');
  const stopped = useRef(false);

  useEffect(() => {
    if (status !== 'PAID' || !merchantTxnNo) return;
    stopped.current = false;
    const startedAt = Date.now();

    const poll = async () => {
      if (stopped.current) return;
      try {
        const s = await getInsuranceBookingStatus(merchantTxnNo);
        if (s.status === 'BOOKING_FAILED') {
          stopped.current = true;
          setView('failed_booking');
          return;
        }
        if (!s.inProgress && s.transactionId) {
          stopped.current = true;
          router.replace(`/booking/insurance/confirmation/${encodeURIComponent(s.transactionId)}`);
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
  }, [status, merchantTxnNo, router]);

  if (view === 'issuing') {
    return (
      <StatusCard
        tone="loading"
        title="Issuing your policy…"
        message="Payment received. Please keep this page open while the insurer issues your policy. This can take up to two minutes."
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
            The insurer is still issuing your policy. It will appear under{' '}
            <span className="font-semibold text-(--color-foreground)">My Bookings</span> and we&apos;ll email it to
            you. You can safely leave this page.
          </>
        }
        actions={
          <>
            <SecondaryButton href="/orders?tab=insurance">My Bookings</SecondaryButton>
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
            Your payment was {status === 'CANCELLED' ? 'cancelled' : 'not successful'}, so no policy was bought and
            you have not been charged. You can try again.
          </>
        }
        actions={<BookButton href="/?tab=insurance">Search again</BookButton>}
      />
    );
  }

  return (
    <StatusCard
      tone="error"
      title="We couldn't issue your policy"
      message="Your payment was received, but the insurer could not issue the policy. Our team has been notified and will refund you in full. Please contact support if you have any questions."
      actions={<BookButton href="/">Back to home</BookButton>}
    />
  );
}

export default function InsurancePaymentResultPage() {
  return (
    <Suspense fallback={<StatusCard tone="loading" title="Issuing your policy…" message="" />}>
      <ResultContent />
    </Suspense>
  );
}
