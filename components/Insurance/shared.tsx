'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { InsuranceSearch } from '@/lib/insurance-api';
import { InsuranceSearchSummary } from '@/components/InsuranceResults/SearchSummary';

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

/** Header on every insurance step - the same boxed summary as the results page. */
export function TripSummaryBar({ search, backHref }: { search: InsuranceSearch; title?: string; backHref: string; backLabel?: string }) {
  return <InsuranceSearchSummary search={search} backHref={backHref} />;
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-(--color-links) mb-4" />
        <h3 className="text-lg font-semibold text-gray-900">{label}</h3>
      </div>
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg p-8 text-center">
        <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <p className="text-sm text-gray-500 mb-4">{message}</p>
        <Link
          href={actionHref}
          className="inline-block px-6 py-2 bg-(--color-links) text-white text-sm font-semibold rounded-md hover:opacity-90 transition-opacity"
        >
          {actionLabel}
        </Link>
      </div>
    </div>
  );
}
