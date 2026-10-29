'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CheckCircle2, Clock, Download, FileText } from 'lucide-react';
import { useRequireAuth } from '@/contexts/AuthContext';
import { formatCoverage, formatInr, getPolicyDetails, type PolicyDetails } from '@/lib/insurance-api';
import { ErrorCard, Spinner, formatDay } from '@/components/Insurance/shared';

const RELATION_NAMES: Record<string, string> = {
  SELF: 'Self',
  SPOUSE: 'Spouse',
  SON: 'Son',
  DAUGHTER: 'Daughter',
  FATHER: 'Father',
  MOTHER: 'Mother',
  FRIEND: 'Friend',
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-gray-50 last:border-0 text-sm">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-800 text-right">{value}</dd>
    </div>
  );
}

export default function InsuranceConfirmationPage() {
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  const { transactionId } = useParams<{ transactionId: string }>();
  const [data, setData] = useState<PolicyDetails | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    getPolicyDetails(transactionId)
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, [authLoading, isAuthenticated, transactionId]);

  if (error) return <ErrorCard message={error} actionHref="/orders?tab=insurance" actionLabel="Go to My Bookings" />;
  if (!data) return <Spinner label="Loading your policy…" />;

  const issued = data.status === 'CONFIRMED';
  const documentFor = (policyNumber: string) =>
    data.documents.find((d) => d.policyNumber === policyNumber)?.url;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-5">
        <section className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          {issued ? (
            <CheckCircle2 className="w-14 h-14 mx-auto text-(--color-success)" />
          ) : (
            <Clock className="w-14 h-14 mx-auto text-(--color-warn)" />
          )}
          <h1 className="mt-3 text-2xl font-bold text-gray-900">
            {issued ? 'Your travel insurance is confirmed' : 'Your policy is being issued'}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {issued
              ? `We've sent the policy to ${data.contact.email || 'your email'}.`
              : 'Payment received. The insurer is finalising your policy; it will appear here and in My Bookings shortly.'}
          </p>
          <p className="mt-3 text-xs text-gray-400">Booking reference {data.bookingId}</p>

          {data.documents.length > 0 && (
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {data.documents.map((d) => (
                <a
                  key={d.url}
                  href={d.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-(--color-links) text-white text-sm font-semibold rounded-md hover:opacity-90"
                >
                  <Download className="w-4 h-4" />
                  {data.documents.length > 1 && d.policyNumber ? `Policy ${d.policyNumber}` : 'Download policy'}
                </a>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-2">Policy</h2>
          <dl>
            <Row label="Insurer" value={data.provider} />
            <Row label="Plan" value={data.planName} />
            <Row label="Policy type" value={data.policyType} />
            <Row label="Destination" value={data.destinations} />
            <Row
              label="Covered"
              value={
                data.startDate && data.endDate
                  ? `${formatDay(data.startDate)} – ${formatDay(data.endDate)}`
                  : null
              }
            />
            <Row label="Medical cover" value={data.coverage ? formatCoverage(data.coverage) : null} />
            <Row label="Amount paid" value={formatInr(data.amountPaid)} />
          </dl>
          {data.policyWordingURL && (
            <a
              href={data.policyWordingURL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-sm text-(--color-links) hover:underline"
            >
              <FileText className="w-4 h-4" /> Policy wording
            </a>
          )}
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Travellers</h2>
          <div className="space-y-3">
            {data.travellers.map((t, i) => {
              const doc = t.policyNumber ? documentFor(t.policyNumber) : undefined;
              return (
                <div key={i} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-900">{t.name}</p>
                      <p className="text-xs text-gray-500">
                        {RELATION_NAMES[t.relation] ?? t.relation}
                        {t.dob ? ` · Born ${formatDay(t.dob) || t.dob}` : ''}
                      </p>
                    </div>
                    {t.policyNumber && (
                      <span className="text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-full px-2.5 py-1">
                        Policy {t.policyNumber}
                      </span>
                    )}
                  </div>
                  <dl className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                    {t.passportNumber && (
                      <div className="flex gap-2">
                        <dt className="text-gray-500">Passport</dt>
                        <dd className="text-gray-800">{t.passportNumber}</dd>
                      </div>
                    )}
                    {t.nominee && (
                      <div className="flex gap-2">
                        <dt className="text-gray-500">Nominee</dt>
                        <dd className="text-gray-800">{t.nominee}</dd>
                      </div>
                    )}
                  </dl>
                  {doc && data.documents.length > 1 && (
                    <a href={doc} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-(--color-links) hover:underline">
                      <Download className="w-3.5 h-3.5" /> Download this policy
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {(data.contact.name || data.contact.email) && (
          <section className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-2">Contact</h2>
            <dl>
              <Row label="Name" value={data.contact.name} />
              <Row label="Email" value={data.contact.email} />
              <Row label="Mobile" value={data.contact.mobile} />
            </dl>
          </section>
        )}

        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link
            href="/orders?tab=insurance"
            className="px-5 py-2.5 text-sm font-semibold rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          >
            My Bookings
          </Link>
          <Link href="/" className="px-5 py-2.5 text-sm font-semibold rounded-md bg-(--color-links) text-white hover:opacity-90">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
