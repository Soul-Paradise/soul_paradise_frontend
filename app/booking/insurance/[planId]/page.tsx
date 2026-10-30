'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Check, ChevronDown, ChevronUp, FileText, HeartPulse, Sparkles } from 'lucide-react';
import { useRequireAuth } from '@/contexts/AuthContext';
import {
  formatCoverage,
  formatInr,
  getPlanDetails,
  searchFromParams,
  searchToParams,
  travellerLabel,
  type InsurancePlan,
} from '@/lib/insurance-api';
import { ErrorCard, ProviderLogo, Spinner, TripSummaryBar } from '@/components/Insurance/shared';
import { BookButton } from '@/components/Results/ui';

const BENEFITS_PREVIEW = 8;

function PlanDetails() {
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  const { planId } = useParams<{ planId: string }>();
  const params = useSearchParams();
  const search = useMemo(() => searchFromParams(params), [params]);
  const tui = params.get('tui') || '';

  const [plan, setPlan] = useState<InsurancePlan | null>(null);
  const [error, setError] = useState('');
  const [allBenefits, setAllBenefits] = useState(false);

  useEffect(() => {
    if (authLoading || !isAuthenticated || !search || !tui) return;
    let cancelled = false;
    getPlanDetails(search, planId, tui)
      .then((p) => !cancelled && setPlan(p))
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, search, planId, tui]);

  if (!search || !tui) {
    return <ErrorCard message="Your search session has expired. Please search again." />;
  }
  const resultsHref = `/booking/insurance?${searchToParams(search).toString()}`;
  if (error) return <ErrorCard message={error} actionHref={resultsHref} actionLabel="Back to plans" />;
  if (!plan) return <Spinner label="Loading plan details…" />;

  const bookHref = `/booking/insurance/${encodeURIComponent(planId)}/book?${params.toString()}`;
  const benefits = allBenefits ? plan.benefits : plan.benefits.slice(0, BENEFITS_PREVIEW);
  const documents = [
    ...(plan.policyWordingURL ? [{ label: 'Policy wording', url: plan.policyWordingURL }] : []),
    ...plan.termsAndConditions.map((url, i) => ({
      label: plan.termsAndConditions.length > 1 ? `Terms & conditions (${i + 1})` : 'Terms & conditions',
      url,
    })),
  ];

  return (
    <main className="min-h-screen bg-(--color-background) pb-28">
      <TripSummaryBar search={search} title={plan.planName} backHref={resultsHref} backLabel="Back to plans" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {/* Plan header */}
        <section className="bg-white rounded-2xl border border-(--color-tertiary-button) shadow-sm p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-5 sm:justify-between">
            <div className="flex items-start gap-4 min-w-0">
              <ProviderLogo src={plan.providerLogo} label={plan.providerLabel} size="lg" />
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-gray-900">{plan.planName}</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {plan.providerLabel}
                  {plan.planType ? ` · ${plan.planType}` : ''}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="px-2.5 py-1 bg-blue-50 text-(--color-links) text-xs font-semibold rounded-full">
                    {formatCoverage(plan.coverage)} medical cover
                  </span>
                  <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
                    {plan.isWithSubLimits ? 'Sub-limits apply' : 'No sub-limits'}
                  </span>
                </div>
              </div>
            </div>
            <div className="sm:text-right shrink-0">
              <p className="text-3xl font-bold text-gray-900">{formatInr(plan.price)}</p>
              <p className="text-xs text-gray-500">Total for {search.travellers.length} traveller{search.travellers.length === 1 ? '' : 's'}</p>
            </div>
          </div>

          {plan.travellerPrices.length > 1 && (
            <div className="mt-5 pt-5 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Price per traveller</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {plan.travellerPrices.map((t, i) => (
                  <div key={t.travellerRefId} className="flex justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm">
                    <span className="text-gray-600">
                      {search.travellers[t.travellerRefId] ? travellerLabel(search.travellers, t.travellerRefId) : `Traveller ${i + 1}`}
                    </span>
                    <span className="font-semibold text-gray-900">{formatInr(t.price)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Highlights */}
        {(plan.specialHighlights.length > 0 || plan.highlights.length > 0) && (
          <section className="bg-white rounded-2xl border border-(--color-tertiary-button) shadow-sm p-5 sm:p-6">
            <h3 className="text-base font-bold text-(--color-foreground) mb-4">Highlights</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {plan.specialHighlights.map((h, i) => (
                <li key={`s${i}`} className="flex items-start gap-2 text-sm text-amber-900 bg-amber-50 rounded-lg px-3 py-2">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  {h}
                </li>
              ))}
              {plan.highlights.map((h, i) => (
                <li key={`h${i}`} className="flex items-start gap-2 text-sm text-gray-700">
                  <Check className="w-4 h-4 text-(--color-success) shrink-0 mt-0.5" />
                  {h}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Benefits */}
        {plan.benefits.length > 0 && (
          <section className="bg-white rounded-2xl border border-(--color-tertiary-button) shadow-sm p-5 sm:p-6">
            <h3 className="text-base font-bold text-(--color-foreground) mb-4">What&apos;s covered</h3>
            <div className="overflow-x-auto -mx-5 sm:mx-0 px-5 sm:px-0">
              <table className="w-full text-sm min-w-[480px]">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-400">
                    <th className="py-2 pr-4 font-semibold">Benefit</th>
                    <th className="py-2 pr-4 font-semibold">Cover up to</th>
                    <th className="py-2 font-semibold">You pay first (deductible)</th>
                  </tr>
                </thead>
                <tbody>
                  {benefits.map((b, i) => (
                    <tr key={i} className="border-b border-gray-50 align-top">
                      <td className="py-3 pr-4 font-medium text-gray-800">{b.name.trim()}</td>
                      <td className="py-3 pr-4 text-gray-600">{b.sumInsured?.trim() || '—'}</td>
                      <td className="py-3 text-gray-500">{b.deductible?.trim() || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {plan.benefits.length > BENEFITS_PREVIEW && (
              <button
                type="button"
                onClick={() => setAllBenefits((v) => !v)}
                className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-(--color-links) hover:underline"
              >
                {allBenefits ? (
                  <>
                    Show fewer <ChevronUp className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Show all {plan.benefits.length} benefits <ChevronDown className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </section>
        )}

        {/* Health declaration + notes + documents */}
        {(plan.questions.length > 0 || plan.notes.length > 0 || documents.length > 0) && (
          <section className="bg-white rounded-2xl border border-(--color-tertiary-button) shadow-sm p-5 sm:p-6 space-y-5">
            {plan.questions.length > 0 && (
              <div className="flex items-start gap-3 rounded-lg bg-blue-50 px-4 py-3">
                <HeartPulse className="w-5 h-5 text-(--color-links) shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700">
                  This insurer asks a short health declaration for each traveller, including any
                  pre-existing medical conditions. You&apos;ll answer it on the next step.
                </p>
              </div>
            )}
            {plan.notes.length > 0 && (
              <ul className="space-y-1.5">
                {plan.notes.map((n, i) => (
                  <li key={i} className="text-sm text-gray-600">• {n}</li>
                ))}
              </ul>
            )}
            {documents.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {documents.map((d) => (
                  <a
                    key={d.url}
                    href={d.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    <FileText className="w-4 h-4" /> {d.label}
                  </a>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {/* Sticky footer */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur border-t border-(--color-tertiary-button) shadow-[0_-8px_24px_rgba(14,34,56,0.08)] z-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <div>
            <p className="text-xl font-bold text-gray-900">{formatInr(plan.price)}</p>
            <p className="text-xs text-gray-500">Total, all-inclusive</p>
          </div>
          <BookButton href={bookHref}>Continue</BookButton>
        </div>
      </div>
    </main>
  );
}

export default function InsurancePlanPage() {
  return (
    <Suspense fallback={<Spinner label="Loading…" />}>
      <PlanDetails />
    </Suspense>
  );
}
