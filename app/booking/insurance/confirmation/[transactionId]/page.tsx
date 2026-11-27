'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Download, FileText, Loader2 } from 'lucide-react';
import { useRequireAuth } from '@/contexts/AuthContext';
import { formatCoverage, formatInr, getPolicyDetails, type PolicyDetails } from '@/lib/insurance-api';
import { downloadInsurancePolicy } from '@/lib/bookings-api';
import { showToast } from '@/lib/toast';
import { ErrorCard, Spinner, formatDay } from '@/components/Insurance/shared';
import {
  BookButton,
  ConfirmationHero,
  ConfirmationPage,
  ConfirmationRow,
  ConfirmationSection,
  SecondaryButton,
} from '@/components/Results/ui';

/** Our states that mean "paid, the insurer hasn't issued the policy yet". */
const PENDING = new Set(['PROCESSING', 'ISSUANCE_PENDING', 'PENDING_PAYMENT', 'PAYMENT_REVIEW']);
/** Re-load the policy while it is pending (the backend re-checks Benzy meanwhile). */
const PENDING_REFRESH_MS = 30_000;

export default function InsuranceConfirmationPage() {
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  const { transactionId } = useParams<{ transactionId: string }>();
  const [data, setData] = useState<PolicyDetails | null>(null);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const load = () =>
      getPolicyDetails(transactionId)
        .then((d) => {
          if (cancelled) return;
          setData(d);
          if (PENDING.has(d.status)) timer = setTimeout(load, PENDING_REFRESH_MS);
        })
        .catch((e: Error) => !cancelled && setError(e.message));
    void load();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [authLoading, isAuthenticated, transactionId]);

  if (error) return <ErrorCard message={error} actionHref="/orders?tab=insurance" actionLabel="Go to My Bookings" />;
  if (!data) return <Spinner label="Loading your policy…" />;

  // Success ONLY for an issued policy (Benzy confirmed it) - same rule as flights and hotels.
  const issued = data.status === 'CONFIRMED';
  const failed = data.status === 'BOOKING_FAILED';
  const downloadPolicy = async () => {
    setDownloading(true);
    try {
      await downloadInsurancePolicy(data.transactionId, data.bookingId);
    } catch (e) {
      showToast({ title: 'Download failed', body: e instanceof Error ? e.message : 'Please try again.', type: 'error' });
    } finally {
      setDownloading(false);
    }
  };

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
        tone={issued ? 'success' : failed ? 'error' : 'pending'}
        title={
          issued
            ? 'Your travel insurance is confirmed'
            : failed
              ? "We couldn't issue your policy"
              : 'Your policy is being issued'
        }
        subtitle={
          issued
            ? `We've emailed your policy documents to ${data.contact.email || 'your email'}.`
            : failed
              ? 'Your payment was received, but the insurer could not issue the policy. Our team has been notified and will refund you in full.'
              : "Payment received. The insurer is finalising your policy - this page updates on its own, and we'll email your documents as soon as it is issued."
        }
        refs={[
          { label: 'Booking ID', value: data.bookingId },
          { label: 'Insurer', value: data.provider },
          { label: 'Amount paid', value: formatInr(data.amountPaid) },
        ]}
      >
        {issued && data.policyAvailable && (
          <SecondaryButton onClick={() => void downloadPolicy()} icon={downloading ? Loader2 : Download} disabled={downloading}>
            Download policy
          </SecondaryButton>
        )}
        {issued &&
          data.documents.map((d, i) => (
            <SecondaryButton key={d.url} href={d.url} external icon={FileText}>
              {data.documents.length > 1 ? `Insurer policy ${d.policyNumber || i + 1}` : "Insurer's policy document"}
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
                ? `${formatDay(data.startDate)} – ${formatDay(data.endDate)}${data.days ? ` (${data.days} days)` : ''}`
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
          {data.travellers.map((t, i) => (
            <div key={i} className="rounded-xl border border-(--color-tertiary-button) bg-(--color-background) p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-(--color-foreground)">{t.name}</p>
                  <p className="text-xs text-(--color-inactive)">
                    {t.relation}
                    {t.dob ? ` · Born ${formatDay(t.dob) || t.dob}` : ''}
                  </p>
                </div>
                {issued && t.policyNumber && (
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
            </div>
          ))}
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
