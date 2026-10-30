'use client';

import { useState } from 'react';
import type { InsuranceSearch } from '@/lib/insurance-api';
import { AlertTriangle } from 'lucide-react';
import { ResultsEmpty, ResultsLoader, StepHeader } from '@/components/Results/ui';

export function formatDay(ymd: string | null | undefined): string {
  if (!ymd) return '';
  const d = new Date(ymd.slice(0, 10) + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return ymd;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function tripDays(start: string, end: string): number {
  const ms = new Date(end + 'T00:00:00').getTime() - new Date(start + 'T00:00:00').getTime();
  return Math.round(ms / 86_400_000) + 1;
}

/** Header on every insurance step - the same step header as flights and hotels. */
export function TripSummaryBar({ search, title, backHref }: { search: InsuranceSearch; title?: string; backHref: string; backLabel?: string }) {
  const n = search.travellers.length;
  const subtitle = [
    search.countryNames.join(', '),
    `${formatDay(search.startDate)} - ${formatDay(search.endDate)}`,
    `${n} traveller${n !== 1 ? 's' : ''}`,
  ].join(' · ');
  return <StepHeader title={title || 'Travel Insurance'} subtitle={subtitle} backHref={backHref} />;
}

/** Insurer logo with a text fallback when the image is missing or broken. */
export function ProviderLogo({ src, label, size = 'md' }: { src: string; label: string; size?: 'md' | 'lg' }) {
  const [broken, setBroken] = useState(false);
  const box = size === 'lg' ? 'h-14 w-28' : 'h-11 w-24';
  if (!src || broken) {
    return (
      <div className={`${box} shrink-0 rounded-md border border-gray-100 bg-gray-50 flex items-center justify-center px-1`}>
        <span className="text-[11px] font-semibold text-gray-500 text-center leading-tight">{label}</span>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- insurer logos come from Benzy's CDN
    <img
      src={src}
      alt={label}
      onError={() => setBroken(true)}
      className={`${box} shrink-0 object-contain rounded-md border border-gray-100 bg-white p-1`}
    />
  );
}

export function Spinner({ label }: { label: string }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <ResultsLoader title={label} rows={2} />
    </div>
  );
}

export function ErrorCard({
  message,
  actionHref = '/?tab=insurance',
  actionLabel = 'Search Again',
}: {
  message: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <ResultsEmpty icon={AlertTriangle} title="Something went wrong" message={message} action={{ label: actionLabel, href: actionHref }} />
    </div>
  );
}
