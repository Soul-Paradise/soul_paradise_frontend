'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

// ── Types ──────────────────────────────────────────────────────────────────

interface Benefit {
  name: string;
  sumInsured: string;
  deductible: string;
}

interface Question {
  title: string;
  questionCode: string;
  selectionType: string;
  category: string;
}

interface PremiumDistribution {
  travellerRefId: number;
  relation: string;
  birthDate: string;
  base: number;
  tax: number;
  total: number;
}

interface PlanDetails {
  planId: string;
  providerName: string;
  providerImageURL: string;
  planName: string;
  coverage: { amount: number; currency: string };
  premium: {
    base: number;
    tax: number;
    total: number;
    currency: string;
    netTotal: number;
    premiumDistributions: PremiumDistribution[];
  };
  policyWordingURL: string;
  coverageDetails: {
    benefits: Benefit[];
    planCode: string;
    notes: string[];
    questions: Question[];
    termsAndConditions: string[];
  };
  highlights: string[];
  specialHighlights: string[];
  isWithSubLimits: boolean;
  planType: string;
  policyType: string;
  minTripDays: number;
  maxTripDays: number;
  commission: number;
  tds: number;
}

// ── Inner Page ─────────────────────────────────────────────────────────────

function PlanDetailsInner() {
  const params = useParams<{ planId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const planId = params.planId;
  const policyType = searchParams.get('policyType') || 'INDIVIDUAL';
  const countryNames = searchParams.get('countryNames') || '';
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  const tenureInMonths = Number(searchParams.get('tenureInMonths') || '0');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [plan, setPlan] = useState<PlanDetails | null>(null);
  const [activeTab, setActiveTab] = useState<'benefits' | 'notes' | 'questions'>('benefits');

  useEffect(() => {
    let travellers: Array<{ id: number; birthdate: string; relation: string }> = [];
    try {
      travellers = JSON.parse(searchParams.get('travellers') || '[]');
    } catch {
      travellers = [];
    }

    const fetchPlan = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${API_URL}/insurance/plan-details`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planId,
            policyType,
            countryNames: countryNames.split(',').filter(Boolean),
            startDate,
            endDate,
            isPED: false,
            tenureInMonths,
            travellers,
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: PlanDetails = await res.json();
        setPlan(json);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load plan details.');
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [planId, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center flex-col gap-4">
        <div className="w-14 h-14 border-4 border-green-200 border-t-[var(--color-success)] rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Loading plan details...</p>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 text-center max-w-sm">
          <svg className="w-12 h-12 text-red-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-600 mb-4">{error || 'Plan not found.'}</p>
          <button onClick={() => router.back()} className="text-[var(--color-success)] hover:underline text-sm">
            ← Go back
          </button>
        </div>
      </div>
    );
  }

  const hasQuestions = plan.coverageDetails.questions.length > 0;
  const hasNotes = plan.coverageDetails.notes.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="font-semibold text-gray-800 text-sm">{plan.planName}</h1>
            <p className="text-xs text-gray-500">{plan.providerName} · {countryNames} · {startDate} → {endDate}</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        {/* Plan Header Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex flex-wrap items-start gap-4 justify-between">
            <div className="flex items-start gap-4">
              {plan.providerImageURL ? (
                <img
                  src={plan.providerImageURL}
                  alt={plan.providerName}
                  className="h-14 w-32 object-contain rounded border border-gray-100 p-1 flex-shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <div className="h-14 w-32 rounded border border-gray-100 bg-gray-50 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-gray-500 px-2 text-center">{plan.providerName}</span>
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold text-gray-800">{plan.planName}</h2>
                <p className="text-sm text-gray-500 mt-0.5">{plan.providerName} · {plan.planType} Plan</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                    {plan.policyType}
                  </span>
                  {plan.isWithSubLimits && (
                    <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-full">
                      Sub-limits Apply
                    </span>
                  )}
                  {plan.minTripDays > 0 && (
                    <span className="px-2.5 py-1 bg-gray-50 text-gray-600 text-xs font-medium rounded-full">
                      {plan.minTripDays}–{plan.maxTripDays} days
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs text-gray-400">Total Premium</p>
              <p className="text-3xl font-bold text-gray-800">₹{Math.round(plan.premium.total).toLocaleString()}</p>
              <p className="text-xs text-gray-400">incl. ₹{Math.round(plan.premium.tax)} tax</p>
              <p className="text-sm text-gray-500 mt-1">
                Coverage: <span className="font-semibold">{plan.coverage.currency} {plan.coverage.amount.toLocaleString()}</span>
              </p>
            </div>
          </div>

          {/* Highlights */}
          {plan.highlights.length > 0 && (
            <div className="mt-5 pt-5 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Key Highlights</h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {plan.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="mt-5 pt-5 border-t border-gray-100 flex flex-wrap gap-3">
            {plan.policyWordingURL && (
              <a
                href={plan.policyWordingURL}
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
            {plan.coverageDetails.termsAndConditions.map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                T&C {plan.coverageDetails.termsAndConditions.length > 1 ? i + 1 : ''}
              </a>
            ))}
          </div>
        </div>

        {/* Per-Traveller Breakdown */}
        {plan.premium.premiumDistributions.length > 1 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Premium Breakdown by Traveller</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 pr-4 text-gray-500 font-medium">Traveller</th>
                    <th className="text-left py-2 pr-4 text-gray-500 font-medium">Relation</th>
                    <th className="text-right py-2 pr-4 text-gray-500 font-medium">Base</th>
                    <th className="text-right py-2 pr-4 text-gray-500 font-medium">Tax</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.premium.premiumDistributions.map((d, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="py-2.5 pr-4 text-gray-700">#{d.travellerRefId + 1}</td>
                      <td className="py-2.5 pr-4 text-gray-600">{d.relation}</td>
                      <td className="py-2.5 pr-4 text-right text-gray-700">₹{Math.round(d.base).toLocaleString()}</td>
                      <td className="py-2.5 pr-4 text-right text-gray-500">₹{Math.round(d.tax).toLocaleString()}</td>
                      <td className="py-2.5 text-right font-semibold text-gray-800">₹{Math.round(d.total).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Coverage Details Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Tab Headers */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('benefits')}
              className={`px-5 py-3.5 text-sm font-medium transition-colors ${activeTab === 'benefits' ? 'border-b-2 border-[var(--color-success)] text-[var(--color-success)]' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Benefits ({plan.coverageDetails.benefits.length})
            </button>
            {hasNotes && (
              <button
                onClick={() => setActiveTab('notes')}
                className={`px-5 py-3.5 text-sm font-medium transition-colors ${activeTab === 'notes' ? 'border-b-2 border-[var(--color-success)] text-[var(--color-success)]' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Notes
              </button>
            )}
            {hasQuestions && (
              <button
                onClick={() => setActiveTab('questions')}
                className={`px-5 py-3.5 text-sm font-medium transition-colors ${activeTab === 'questions' ? 'border-b-2 border-[var(--color-success)] text-[var(--color-success)]' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Health Questions ({plan.coverageDetails.questions.length})
              </button>
            )}
          </div>

          {/* Tab Content */}
          <div className="p-5">
            {activeTab === 'benefits' && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2.5 pr-4 text-gray-500 font-medium">Benefit</th>
                      <th className="text-left py-2.5 pr-4 text-gray-500 font-medium">Sum Insured</th>
                      <th className="text-left py-2.5 text-gray-500 font-medium">Deductible</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plan.coverageDetails.benefits.map((b, i) => (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-3 pr-4 text-gray-700 font-medium">{b.name}</td>
                        <td className="py-3 pr-4 text-gray-600">{b.sumInsured || '—'}</td>
                        <td className="py-3 text-gray-500">{b.deductible || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'notes' && hasNotes && (
              <ul className="space-y-2">
                {plan.coverageDetails.notes.map((note, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-amber-500 mt-0.5">•</span>
                    {note}
                  </li>
                ))}
              </ul>
            )}

            {activeTab === 'questions' && hasQuestions && (
              <div className="space-y-3">
                <p className="text-sm text-amber-600 bg-amber-50 border border-amber-100 rounded-lg p-3">
                  The following health questions will be asked during the booking process.
                </p>
                <ul className="space-y-2">
                  {plan.coverageDetails.questions.map((q, i) => (
                    <li key={i} className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                      <p className="text-sm font-medium text-gray-700">{q.title}</p>
                      <div className="flex gap-3 mt-1.5">
                        <span className="text-xs text-gray-400">Type: {q.selectionType}</span>
                        <span className="text-xs text-gray-400">Category: {q.category}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Book Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-gray-400">Total Premium</p>
            <p className="text-xl font-bold text-gray-800">₹{Math.round(plan.premium.total).toLocaleString()}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.back()}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back to Results
            </button>
            <button
              type="button"
              className="px-6 py-2.5 bg-[var(--color-success)] text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors"
              onClick={() => {
                // Future: navigate to booking form
                alert('Booking form coming soon!');
              }}
            >
              Proceed to Book →
            </button>
          </div>
        </div>
      </div>

      {/* Bottom padding for sticky footer */}
      <div className="h-24" />
    </div>
  );
}

// ── Page Export ────────────────────────────────────────────────────────────

export default function InsurancePlanDetailsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-green-200 border-t-[var(--color-success)] rounded-full animate-spin" />
      </div>
    }>
      <PlanDetailsInner />
    </Suspense>
  );
}
