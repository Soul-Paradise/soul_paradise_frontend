'use client';

/**
 * "Custom Payment" booking tab: a signed-in user pays an amount they type in,
 * through the same ICICI PG flow as bookings. Laid out like the other tabs -
 * one bordered field bar and the red action button.
 *
 * The bank returns the browser to /?tab=payment&txn=..., which reopens this tab
 * and shows the outcome. Past payments are listed under My Orders.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle2, Clock, IndianRupee, Landmark, Wallet, XCircle } from 'lucide-react';
import { api, type CustomPayment as CustomPaymentEntry, type PaymentStatus } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { ActionButton, ActionRow, FIELD_GROUP, FIELD_SUB, FIELD_VALUE, FieldLabel, TabHeader, fieldCell } from './ui';

/** Statuses where the bank hasn't told us the outcome yet. */
const PENDING: PaymentStatus[] = ['INITIATED', 'REDIRECTED'];
const POLL_MS = 3000;
const POLL_TIMEOUT_MS = 60000;

const TAB_PATH = '/?tab=payment';

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

function formatAmount(value: string | number): string {
  return inr.format(typeof value === 'string' ? Number(value) : value);
}

/** "5,000" / "5000.5" → 5000.5; anything else → null. */
function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/,/g, '').trim();
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return n >= 1 ? n : null;
}

export const CustomPayment = () => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnedTxn = searchParams.get('txn');

  const [amountInput, setAmountInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The payment the bank just returned us from, if any.
  const [result, setResult] = useState<CustomPaymentEntry | null>(null);
  const [resultTimedOut, setResultTimedOut] = useState(false);

  // Back from the bank: the query string only says where to look. The status
  // shown comes from the API, polled until the gateway result has been applied.
  useEffect(() => {
    if (!returnedTxn || !isAuthenticated) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const startedAt = Date.now();

    const poll = async () => {
      try {
        const p = await api.getCustomPayment(returnedTxn);
        if (cancelled) return;
        setResult(p);
        if (!PENDING.includes(p.status)) return;
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Could not fetch payment status');
        return;
      }
      if (Date.now() - startedAt >= POLL_TIMEOUT_MS) {
        setResultTimedOut(true);
        return;
      }
      timer = setTimeout(poll, POLL_MS);
    };
    void poll();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [returnedTxn, isAuthenticated]);

  function dismissResult() {
    setResult(null);
    setResultTimedOut(false);
    router.replace(TAB_PATH, { scroll: false });
  }

  const amount = parseAmount(amountInput);

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (amount === null) {
      setError('Please enter an amount of at least ₹1 (up to 2 decimal places).');
      return;
    }
    if (!isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent(TAB_PATH)}`);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const { redirectUrl } = await api.createCustomPayment(amount);
      // Hand the browser to ICICI's hosted page; it returns to this tab.
      window.location.href = redirectUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start the payment');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handlePay} className="space-y-5">
      {returnedTxn && isAuthenticated && (result || !error) && (
        <ResultBanner payment={result} timedOut={resultTimedOut} onDismiss={dismissResult} />
      )}

      <TabHeader tagline="Make a Payment to Soul Paradise" />

      {/* Main fields row - same bordered container as every tab */}
      <div className={FIELD_GROUP}>
        <div className="grid grid-cols-1 sm:flex sm:items-stretch divide-y divide-gray-200 sm:divide-y-0">
          {/* Amount */}
          <label
            htmlFor="custom-amount"
            className={`sm:flex-[2] min-w-0 cursor-text sm:border-r sm:border-gray-200 focus-within:bg-blue-50/70 group ${fieldCell()}`}
          >
            <div className="group-focus-within:[&>div]:text-(--color-links)">
              <FieldLabel icon={Wallet}>Amount (INR)</FieldLabel>
            </div>
            <div className="flex items-center gap-1">
              <IndianRupee className="w-6 h-6 text-gray-900 flex-shrink-0" strokeWidth={2.5} />
              <input
                id="custom-amount"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={amountInput}
                disabled={submitting}
                onChange={(e) => {
                  setAmountInput(e.target.value);
                  setError(null);
                }}
                placeholder="0"
                className="w-full min-w-0 bg-transparent text-3xl font-extrabold leading-none text-gray-900 placeholder:text-gray-400 focus:outline-none disabled:opacity-50"
              />
            </div>
            <div className={FIELD_SUB}>Enter the amount you want to pay</div>
          </label>

          {/* Pay via */}
          <div className="sm:flex-1 min-w-0 text-left px-5 py-4 min-h-[88px]">
            <FieldLabel icon={Landmark}>Pay Via</FieldLabel>
            <div className={`${FIELD_VALUE} truncate`}>ICICI Bank</div>
            <div className={FIELD_SUB}>UPI, Cards &amp; Net Banking</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* PAY NOW button - same as every tab */}
      <ActionRow>
        {isAuthenticated && (
          <Link href="/orders?tab=payments" className="text-sm font-semibold text-[#1F7AC4] hover:underline">
            View past payments
          </Link>
        )}
        <ActionButton type="submit" disabled={submitting}>
          {submitting ? 'Redirecting…' : 'Pay Now'}
        </ActionButton>
      </ActionRow>
    </form>
  );
};

function ResultBanner({
  payment,
  timedOut,
  onDismiss,
}: {
  payment: CustomPaymentEntry | null;
  timedOut: boolean;
  onDismiss: () => void;
}) {
  const dismiss = (
    <button
      type="button"
      onClick={onDismiss}
      className="shrink-0 text-xs font-semibold text-gray-500 hover:text-gray-800"
    >
      Dismiss
    </button>
  );

  if (!payment || PENDING.includes(payment.status)) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4">
        <Clock className={`h-5 w-5 shrink-0 text-orange-600 ${timedOut ? '' : 'animate-pulse'}`} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-gray-900">
            {timedOut ? 'Still waiting for the bank' : 'Confirming payment…'}
          </p>
          <p className="text-xs text-gray-600">
            {timedOut
              ? 'The bank has not confirmed this payment yet. Check My Orders in a little while.'
              : 'Checking the result with ICICI. This usually takes a few seconds.'}
          </p>
        </div>
        {timedOut && dismiss}
      </div>
    );
  }

  const paid = payment.status === 'PAID';
  return (
    <div
      className={`flex items-start gap-3 rounded-xl border p-4 ${
        paid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
      }`}
    >
      {paid ? (
        <CheckCircle2 className="h-5 w-5 shrink-0 text-green-700" />
      ) : (
        <XCircle className="h-5 w-5 shrink-0 text-red-600" />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-gray-900">
          {paid
            ? `Payment of ${formatAmount(payment.amount)} completed successfully`
            : 'Payment was not completed'}
        </p>
        <p className="text-xs text-gray-600">
          {paid
            ? `Reference ${payment.merchantTxnNo}`
            : `${formatAmount(payment.amount)} was not charged. You can try again.`}
        </p>
      </div>
      {dismiss}
    </div>
  );
}
