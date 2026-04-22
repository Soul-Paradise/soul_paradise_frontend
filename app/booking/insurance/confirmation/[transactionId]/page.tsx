'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

// ── Types (match backend ProcessInsuranceItineraryListingResponse) ─────────

interface ContactInfo {
  FName: string;
  LName: string;
  Email: string;
  Mobile: string;
  Phone: string;
}

interface ReviewInsurance {
  SupplierName: string;
  TravelDate: string;
  NumberOfDays: number;
  ConfirmationNumber: string;
  PolicyType: string;
  TravelLocation: string;
  Status: string;
  Details: string;
}

interface PaxAddress {
  Line1: string;
  Line2: string;
  PinCode: string;
  City: string;
  State: string;
}

interface PaxDetails {
  PaxName: string;
  DOB: string;
  PolicyNumber: string;
  PassportNumber: string;
  NomineeDetails: string;
  Address?: PaxAddress;
  Relation: string;
}

interface FareSummary {
  BaseFare: number;
  TaxesAndCharges: number;
  GrossAmount: number;
  NetAmount: number;
  Discount: number;
  TotalAmount: number;
  TDSAmount: number;
  Comission: number;
  YourCost: number;
}

interface ItineraryResponse {
  TUI: string;
  TransactionId: number;
  FyearID: string;
  ContactInfo: ContactInfo;
  ReviewInsurance: ReviewInsurance;
  PaxDetails: PaxDetails[];
  FareSummary: FareSummary;
  Code: string;
  Msg: string[];
  IsBilled: boolean;
  PolicyWordingURL: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const money = (n: number) => `₹${Math.round(n).toLocaleString()}`;

type StatusKind = 'success' | 'pending' | 'hold' | 'failed' | 'cancelled' | 'unknown';

interface StatusInfo {
  kind: StatusKind;
  label: string;
  badgeClass: string;
  bannerClass: string;
  iconClass: string;
  title: string;
  description: string;
}

const statusInfo = (s: string): StatusInfo => {
  const code = (s || '').toUpperCase();

  // Booked / Success
  if (['B0', 'BO0', 'SUCCESS', 'COMPLETED', 'BOOKED'].includes(code)) {
    return {
      kind: 'success',
      label: 'Confirmed',
      badgeClass: 'bg-green-100 text-green-700',
      bannerClass: 'bg-green-50 border-green-200',
      iconClass: 'bg-green-500',
      title: 'Policy Booked Successfully!',
      description: 'Your travel insurance policy has been issued. Your documents are available below.',
    };
  }

  // In Progress — provider hasn't issued policy yet
  if (['IP', 'INPROGRESS', 'IN_PROGRESS', 'PENDING', 'PROCESSING'].includes(code)) {
    return {
      kind: 'pending',
      label: 'In Progress',
      badgeClass: 'bg-amber-100 text-amber-700',
      bannerClass: 'bg-amber-50 border-amber-200',
      iconClass: 'bg-amber-500',
      title: 'Booking In Progress',
      description:
        'Your payment has been received and the booking is being processed by the insurer. This usually completes within a few minutes. Refresh to check the latest status.',
    };
  }

  // On Hold
  if (['H0', 'HOLD', 'ON_HOLD'].includes(code)) {
    return {
      kind: 'hold',
      label: 'On Hold',
      badgeClass: 'bg-blue-100 text-blue-700',
      bannerClass: 'bg-blue-50 border-blue-200',
      iconClass: 'bg-blue-500',
      title: 'Booking On Hold',
      description:
        'The insurer has placed this booking on hold pending additional checks or documentation. Our team will reach out if any action is required from your side.',
    };
  }

  // Failed
  if (['F0', 'BF', 'BO1', 'TO1', 'FAILED', 'REJECTED'].includes(code)) {
    return {
      kind: 'failed',
      label: 'Failed',
      badgeClass: 'bg-red-100 text-red-700',
      bannerClass: 'bg-red-50 border-red-200',
      iconClass: 'bg-red-500',
      title: 'Booking Failed',
      description:
        'The insurer could not issue this policy. If your account has been charged, a refund will be initiated automatically. Please try another plan or contact support.',
    };
  }

  // Cancelled
  if (['C0', 'CN', 'CANCELLED', 'CANCELED'].includes(code)) {
    return {
      kind: 'cancelled',
      label: 'Cancelled',
      badgeClass: 'bg-gray-200 text-gray-700',
      bannerClass: 'bg-gray-50 border-gray-200',
      iconClass: 'bg-gray-500',
      title: 'Booking Cancelled',
      description: 'This policy has been cancelled. Any applicable refund will be processed as per the insurer’s policy.',
    };
  }

  return {
    kind: 'unknown',
    label: s || 'Unknown',
    badgeClass: 'bg-gray-100 text-gray-600',
    bannerClass: 'bg-gray-50 border-gray-200',
    iconClass: 'bg-gray-400',
    title: 'Booking Status Unknown',
    description: 'We couldn’t determine the current status. Please refresh or contact support with your Transaction ID.',
  };
};

// ── Inner ──────────────────────────────────────────────────────────────────

function ConfirmationInner() {
  const router = useRouter();
  const { transactionId } = useParams<{ transactionId: string }>();

  const [data, setData] = useState<ItineraryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchItinerary = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/insurance/booking/${transactionId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: ItineraryResponse = await res.json();
      setData(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load booking.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!transactionId) return;
    fetchItinerary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center flex-col gap-4">
        <div className="w-14 h-14 border-4 border-green-200 border-t-[var(--color-success)] rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Loading your booking...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 text-center max-w-sm">
          <svg className="w-12 h-12 text-red-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-600 mb-4">{error || 'Booking not found.'}</p>
          <button onClick={() => router.push('/')} className="text-[var(--color-success)] hover:underline text-sm">
            ← Back to home
          </button>
        </div>
      </div>
    );
  }

  const status = statusInfo(data.ReviewInsurance.Status);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button onClick={() => router.push('/')} className="p-2 rounded-lg hover:bg-gray-100">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="font-semibold text-gray-800 text-sm">Booking Confirmation</h1>
            <p className="text-xs text-gray-500">Transaction ID: {data.TransactionId}</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        {/* Status banner */}
        <div className={`rounded-xl p-6 border ${status.bannerClass}`}>
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${status.iconClass}`}>
              <StatusIcon kind={status.kind} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <h2 className="text-xl font-bold text-gray-800">{status.title}</h2>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${status.badgeClass}`}>
                  {status.label}
                </span>
              </div>
              <p className="text-sm text-gray-700 mt-2">{status.description}</p>
              {data.ReviewInsurance.ConfirmationNumber && (
                <p className="text-sm text-gray-600 mt-3">
                  Confirmation Number:{' '}
                  <span className="font-mono font-semibold">{data.ReviewInsurance.ConfirmationNumber}</span>
                </p>
              )}
              {data.ContactInfo.Email && (
                <p className="text-xs text-gray-500 mt-1">
                  {status.kind === 'success' ? 'Confirmation' : 'Updates will be'} sent to{' '}
                  <span className="font-medium">{data.ContactInfo.Email}</span>
                </p>
              )}
              {(status.kind === 'pending' || status.kind === 'hold' || status.kind === 'unknown') && (
                <button
                  type="button"
                  onClick={() => fetchItinerary(true)}
                  disabled={refreshing}
                  className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-60"
                >
                  <svg
                    className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {refreshing ? 'Checking…' : 'Check again'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Trip summary */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Trip Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <InfoCell label="Insurer" value={data.ReviewInsurance.SupplierName} />
            <InfoCell label="Policy Type" value={data.ReviewInsurance.PolicyType} />
            <InfoCell label="Destination" value={data.ReviewInsurance.TravelLocation} />
            <InfoCell label="Coverage" value={data.ReviewInsurance.Details} />
            <InfoCell label="Travel Date" value={data.ReviewInsurance.TravelDate} />
            <InfoCell
              label="Duration"
              value={`${data.ReviewInsurance.NumberOfDays} day${data.ReviewInsurance.NumberOfDays !== 1 ? 's' : ''}`}
            />
            <InfoCell label="Billed" value={data.IsBilled ? 'Yes' : 'No'} />
            <InfoCell label="FY" value={data.FyearID} />
          </div>
        </section>

        {/* Passengers */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Passengers ({data.PaxDetails.length})
          </h3>
          <div className="space-y-3">
            {data.PaxDetails.map((p, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between flex-wrap gap-2 mb-3">
                  <div>
                    <p className="font-semibold text-gray-800">{p.PaxName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {p.Relation} · DOB: {p.DOB}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Policy Number</p>
                    <p className="text-sm font-mono font-semibold text-gray-800">
                      {p.PolicyNumber || <span className="text-gray-400 font-sans font-normal">Pending</span>}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {p.PassportNumber && (
                    <div>
                      <p className="text-gray-400">Passport</p>
                      <p className="text-gray-700 font-medium">{p.PassportNumber}</p>
                    </div>
                  )}
                  {p.NomineeDetails && (
                    <div>
                      <p className="text-gray-400">Nominee</p>
                      <p className="text-gray-700 font-medium">{p.NomineeDetails}</p>
                    </div>
                  )}
                  {(p.Address?.Line1 || p.Address?.City) && (
                    <div className="md:col-span-2">
                      <p className="text-gray-400">Address</p>
                      <p className="text-gray-700">
                        {[p.Address.Line1, p.Address.Line2, p.Address.City, p.Address.State, p.Address.PinCode]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Fare summary */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Fare Summary</h3>
          <div className="space-y-2 text-sm">
            <FareRow label="Base Fare" value={money(data.FareSummary.BaseFare)} />
            <FareRow label="Taxes & Charges" value={money(data.FareSummary.TaxesAndCharges)} />
            {data.FareSummary.Discount > 0 && (
              <FareRow label="Discount" value={`− ${money(data.FareSummary.Discount)}`} positive />
            )}
            <div className="pt-2 border-t border-gray-100">
              <FareRow label="Total Amount" value={money(data.FareSummary.TotalAmount)} bold />
            </div>
            {data.FareSummary.YourCost > 0 && data.FareSummary.YourCost !== data.FareSummary.TotalAmount && (
              <FareRow label="Your Cost" value={money(data.FareSummary.YourCost)} positive />
            )}
          </div>
        </section>

        {/* Actions */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Documents</h3>
          <div className="flex flex-wrap gap-3">
            {data.PolicyWordingURL && (
              <a
                href={data.PolicyWordingURL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Policy Wording
              </a>
            )}
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>
          </div>
        </section>

        {/* CTA */}
        <div className="flex justify-end">
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2.5 bg-[var(--color-success)] text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Small components ───────────────────────────────────────────────────────

function StatusIcon({ kind }: { kind: StatusKind }) {
  const common = 'w-6 h-6 text-white';
  if (kind === 'success') {
    return (
      <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
      </svg>
    );
  }
  if (kind === 'pending') {
    return (
      <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  if (kind === 'failed') {
    return (
      <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
      </svg>
    );
  }
  if (kind === 'hold') {
    return (
      <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 9v6m4-6v6m-9 5h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    );
  }
  if (kind === 'cancelled') {
    return (
      <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  return (
    <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01" />
    </svg>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-800 mt-0.5">{value || '—'}</p>
    </div>
  );
}

function FareRow({
  label,
  value,
  bold,
  positive,
}: {
  label: string;
  value: string;
  bold?: boolean;
  positive?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-gray-600 ${bold ? 'font-semibold text-gray-800' : ''}`}>{label}</span>
      <span
        className={`${bold ? 'text-lg font-bold text-gray-800' : 'font-medium'} ${
          positive ? 'text-green-600' : 'text-gray-700'
        }`}
      >
        {value}
      </span>
    </div>
  );
}

// ── Page Export ────────────────────────────────────────────────────────────

export default function BookingConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-green-200 border-t-[var(--color-success)] rounded-full animate-spin" />
        </div>
      }
    >
      <ConfirmationInner />
    </Suspense>
  );
}
