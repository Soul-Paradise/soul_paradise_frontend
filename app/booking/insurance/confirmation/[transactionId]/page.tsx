'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Download, FileText } from 'lucide-react';
import { useRequireAuth } from '@/contexts/AuthContext';
import { formatCoverage, formatInr, getPolicyDetails, type PolicyDetails } from '@/lib/insurance-api';
import { ErrorCard, Spinner, formatDay } from '@/components/Insurance/shared';
import {
  BookButton,
  ConfirmationHero,
  ConfirmationPage,
  ConfirmationRow,
  ConfirmationSection,
  SecondaryButton,
} from '@/components/Results/ui';

const RELATION_NAMES: Record<string, string> = {
  SELF: 'Self',
  SPOUSE: 'Spouse',
  SON: 'Son',
  DAUGHTER: 'Daughter',
  FATHER: 'Father',
  MOTHER: 'Mother',
  FRIEND: 'Friend',
};

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
    <ConfirmationPage
      actions={
        <>
          <SecondaryButton href="/orders?tab=insurance">My Bookings</SecondaryButton>
          <BookButton href="/">Back to home</BookButton>
        </>
      }
    >
      <ConfirmationHero
        tone={issued ? 'success' : 'pending'}
        title={issued ? 'Your travel insurance is confirmed' : 'Your policy is being issued'}
        subtitle={
          issued
            ? `We've sent the policy to ${data.contact.email || 'your email'}.`
            : 'Payment received. The insurer is finalising your policy; it will appear here and in My Bookings shortly.'
        }
        refs={[
          { label: 'Booking ID', value: data.bookingId },
          { label: 'Insurer', value: data.provider },
          { label: 'Amount paid', value: formatInr(data.amountPaid) },
        ]}
      >
        {data.documents.map((d) => (
          <SecondaryButton key={d.url} href={d.url} external icon={Download}>
            {data.documents.length > 1 && d.policyNumber ? `Policy ${d.policyNumber}` : 'Download policy'}
          </SecondaryButton>
        ))}
      </ConfirmationHero>

      <ConfirmationSection title="Policy">
        <dl>
          <ConfirmationRow label="Insurer" value={data.provider} />
          <ConfirmationRow label="Plan" value={data.planName} />
          <ConfirmationRow label="Policy type" value={data.policyType} />
          <ConfirmationRow label="Destination" value={data.destinations} />
          <ConfirmationRow
            label="Covered"
            value={
              data.startDate && data.endDate
                ? `${formatDay(data.startDate)} – ${formatDay(data.endDate)}`
                : null
            }
          />
          <ConfirmationRow label="Medical cover" value={data.coverage ? formatCoverage(data.coverage) : null} />
          <ConfirmationRow label="Amount paid" value={formatInr(data.amountPaid)} strong />
        </dl>
        {data.policyWordingURL && (
          <a
            href={data.policyWordingURL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-(--color-links) hover:underline"
          >
            <FileText className="w-4 h-4" /> Policy wording
          </a>
        )}
      </ConfirmationSection>

      <ConfirmationSection title="Travellers">
        <div className="space-y-3">
          {data.travellers.map((t, i) => {
            const doc = t.policyNumber ? documentFor(t.policyNumber) : undefined;
            return (
              <div key={i} className="rounded-xl border border-(--color-tertiary-button) bg-(--color-background) p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-(--color-foreground)">{t.name}</p>
                    <p className="text-xs text-(--color-inactive)">
                      {RELATION_NAMES[t.relation] ?? t.relation}
                      {t.dob ? ` · Born ${formatDay(t.dob) || t.dob}` : ''}
                    </p>
                  </div>
                  {t.policyNumber && (
                    <span className="text-xs font-bold text-(--color-links) bg-(--color-primary-tint) rounded-full px-2.5 py-1">
                      Policy {t.policyNumber}
                    </span>
                  )}
                </div>
                <dl className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                  {t.passportNumber && (
                    <div className="flex gap-2">
                      <dt className="text-(--color-inactive)">Passport</dt>
                      <dd className="font-semibold text-(--color-foreground)">{t.passportNumber}</dd>
                    </div>
                  )}
                  {t.nominee && (
                    <div className="flex gap-2">
                      <dt className="text-(--color-inactive)">Nominee</dt>
                      <dd className="font-semibold text-(--color-foreground)">{t.nominee}</dd>
                    </div>
                  )}
                </dl>
                {doc && data.documents.length > 1 && (
                  <a href={doc} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-(--color-links) hover:underline">
                    <Download className="w-3.5 h-3.5" /> Download this policy
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </ConfirmationSection>

      {(data.contact.name || data.contact.email) && (
        <ConfirmationSection title="Contact">
          <dl>
            <ConfirmationRow label="Name" value={data.contact.name} />
            <ConfirmationRow label="Email" value={data.contact.email} />
            <ConfirmationRow label="Mobile" value={data.contact.mobile} />
          </dl>
        </ConfirmationSection>
      )}
    </ConfirmationPage>
  );
}
