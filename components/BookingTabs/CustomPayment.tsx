'use client';

/**
 * "Custom Payment" booking tab: any signed-in user pays an amount they type in,
 * through the same ICICI PG flow as bookings. The bank returns the browser to
 * /?tab=payment&txn=..., which reopens this tab and shows the outcome.
 *
 * Nothing about why is recorded - the history is just the user's own gateway
 * Payment rows for these ad-hoc charges.
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle2, Clock, Loader2, XCircle } from 'lucide-react';
import { api, type CustomPayment as CustomPaymentEntry, type PaymentStatus } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const QUICK_AMOUNTS = [1000, 5000, 10000, 25000];

/** Statuses where the bank hasn't told us the outcome yet. */
const PENDING: PaymentStatus[] = ['INITIATED', 'REDIRECTED'];
const POLL_MS = 3000;
const POLL_TIMEOUT_MS = 60000;

const TAB_PATH = '/?tab=payment';

const STATUS_STYLE: Record<PaymentStatus, { label: string; cls: string }> = {
  PAID: { label: 'Paid', cls: 'bg-green-50 text-green-700' },
  INITIATED: { label: 'Pending', cls: 'bg-orange-50 text-orange-700' },
  REDIRECTED: { label: 'Pending', cls: 'bg-orange-50 text-orange-700' },
  FAILED: { label: 'Failed', cls: 'bg-red-50 text-red-600' },
  CANCELLED: { label: 'Cancelled', cls: 'bg-gray-100 text-gray-600' },
  EXPIRED: { label: 'Expired', cls: 'bg-gray-100 text-gray-600' },
  REFUND_PENDING: { label: 'Refund pending', cls: 'bg-blue-50 text-[#1F7AC4]' },
  REFUNDED: { label: 'Refunded', cls: 'bg-blue-50 text-[#1F7AC4]' },
};

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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export const CustomPayment = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <p className="text-sm text-gray-600">Log in to make a custom payment.</p>
        <Link
          href={`/login?next=${encodeURIComponent(TAB_PATH)}`}
          className="px-10 py-3.5 bg-[#D34E4E] hover:bg-red-600 text-white text-sm font-bold rounded-full shadow-lg hover:shadow-xl transition-all uppercase tracking-wide"
        >
          Log in
        </Link>
      </div>
    );
  }

  return <CustomPaymentForm />;
};

const CustomPaymentForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnedTxn = searchParams.get('txn');

  const [amountInput, setAmountInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [history, setHistory] = useState<CustomPaymentEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // The payment the bank just returned us from, if any.
  const [result, setResult] = useState<CustomPaymentEntry | null>(null);
  const [resultTimedOut, setResultTimedOut] = useState(false);

  const loadHistory = useCallback(async () => {
    try {
      setHistory(await api.getCustomPayments());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payment history');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  // Back from the bank: the query string only says where to look. The status
  // shown comes from the API, polled until the gateway result has been applied.
  useEffect(() => {
    if (!returnedTxn) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const startedAt = Date.now();

    const poll = async () => {
      try {
        const p = await api.getCustomPayment(returnedTxn);
        if (cancelled) return;
        setResult(p);
        if (!PENDING.includes(p.status)) {
          void loadHistory();
          return;
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Could not fetch payment status');
        return;
      }
      if (Date.now() - startedAt >= POLL_TIMEOUT_MS) {
        setResultTimedOut(true);
        void loadHistory();
        return;
      }
      timer = setTimeout(poll, POLL_MS);
    };
    void poll();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [returnedTxn, loadHistory]);

  function dismissResult() {
    setResult(null);
    setResultTimedOut(false);
    router.replace(TAB_PATH, { scroll: false });
  }

  const amount = parseAmount(amountInput);

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (amount === null) {
      setError('Enter an amount of at least ₹1, with up to 2 decimal places.');
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
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      {/* Left: pay form + outcome */}
      <form onSubmit={handlePay} className="space-y-4">
        {returnedTxn && (result || !error) && (
          <ResultBanner
            payment={result}
            timedOut={resultTimedOut}
            onDismiss={dismissResult}
          />
        )}

        <div className="border-2 border-gray-200 rounded-xl bg-white px-5 py-4 focus-within:border-[#1F7AC4] transition-colors">
          <label
            htmlFor="custom-amount"
            className="block text-[10px] font-bold tracking-widest uppercase mb-1 text-gray-500"
          >
            Amount (INR)
          </label>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-gray-400">₹</span>
            <input
              id="custom-amount"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={amountInput}
              disabled={submitting}
              onChange={(e) => setAmountInput(e.target.value)}
              placeholder="Enter amount"
              className="w-full bg-transparent text-2xl font-bold text-gray-900 placeholder:text-gray-300 placeholder:font-semibold focus:outline-none disabled:opacity-50"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {QUICK_AMOUNTS.map((q) => (
            <button
              key={q}
              type="button"
              disabled={submitting}
              onClick={() => setAmountInput(q.toLocaleString('en-IN'))}
              className="px-4 py-1.5 rounded-full border border-gray-200 text-sm font-medium text-gray-600 hover:border-[#1F7AC4] hover:bg-blue-50 hover:text-[#1F7AC4] disabled:opacity-50 transition-colors"
            >
              {formatAmount(q)}
            </button>
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-gray-400">
            Secure payment via ICICI Bank. You&apos;ll return here once it&apos;s done.
          </p>
          <button
            type="submit"
            disabled={submitting || amount === null}
            className="shrink-0 px-10 py-3.5 bg-[#D34E4E] hover:bg-red-600 text-white text-sm font-bold rounded-full shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all uppercase tracking-wide disabled:opacity-50 disabled:hover:scale-100 disabled:hover:bg-[#D34E4E]"
          >
            {submitting ? 'Redirecting…' : 'Pay Now'}
          </button>
        </div>
      </form>

      {/* Right: history */}
      <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-[10px] font-bold tracking-widest uppercase text-gray-500">
            Payment history
          </h3>
        </div>
        {historyLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : history.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-gray-400">No payments yet.</p>
        ) : (
          <ul className="max-h-64 divide-y divide-gray-100 overflow-y-auto">
            {history.map((p) => {
              const s = STATUS_STYLE[p.status];
              return (
                <li key={p.merchantTxnNo} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900">{formatAmount(p.amount)}</p>
                    <p className="text-xs text-gray-500">{formatDate(p.paidAt ?? p.createdAt)}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${s.cls}`}>
                    {s.label}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
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
              ? 'The bank has not confirmed this payment yet. It will update in your history once it does.'
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
            : `Payment ${STATUS_STYLE[payment.status].label.toLowerCase()}`}
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
