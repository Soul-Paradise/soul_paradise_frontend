'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRequireAuth } from '@/contexts/AuthContext';
import { getInsuranceBookingStatus } from '@/lib/insurance-api';

// After a successful payment the backend calls Benzy StartPay, which can take
// a while. Poll until the policy is issued; past the timeout we reassure the
// customer instead (the backend finishes regardless of this tab).
const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 120000;

type View = 'issuing' | 'failed_payment' | 'failed_booking' | 'slow';

function Spinner() {
  return <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-(--color-links)" />;
}

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

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        {view === 'issuing' && (
          <>
            <Spinner />
            <h1 className="mt-6 text-xl font-semibold text-gray-900">Issuing your policy…</h1>
            <p className="mt-2 text-sm text-gray-500">
              Payment received. Please keep this page open while the insurer issues your policy. This can take up to two
              minutes.
            </p>
          </>
        )}

        {view === 'slow' && (
          <>
            <h1 className="text-xl font-semibold text-gray-900">Your payment went through</h1>
            <p className="mt-2 text-sm text-gray-600">
              The insurer is still issuing your policy. It will appear under{' '}
              <span className="font-medium">My Bookings</span> and we&apos;ll email it to you. You can safely leave this
              page.
            </p>
            <Link
              href="/orders?tab=insurance"
              className="mt-6 inline-block rounded-md bg-(--color-links) px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              Go to My Bookings
            </Link>
          </>
        )}

        {view === 'failed_payment' && (
          <>
            <h1 className="text-xl font-semibold text-gray-900">Payment not completed</h1>
            <p className="mt-2 text-sm text-gray-600">
              Your payment was {status === 'CANCELLED' ? 'cancelled' : 'not successful'}, so no policy was bought and
              you have not been charged. You can try again.
            </p>
            <Link
              href="/?tab=insurance"
              className="mt-6 inline-block rounded-md bg-(--color-links) px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              Search again
            </Link>
          </>
        )}

        {view === 'failed_booking' && (
          <>
            <h1 className="text-xl font-semibold text-gray-900">We couldn&apos;t issue your policy</h1>
            <p className="mt-2 text-sm text-gray-600">
              Your payment was received, but the insurer could not issue the policy. Our team has been notified and
              will refund you in full. Please contact support if you have any questions.
            </p>
            <Link
              href="/"
              className="mt-6 inline-block rounded-md bg-(--color-links) px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              Back to home
            </Link>
          </>
        )}
      </div>
    </main>
  );
}

export default function InsurancePaymentResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <ResultContent />
    </Suspense>
  );
}
