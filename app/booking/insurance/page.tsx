'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

// ── Types ──────────────────────────────────────────────────────────────────

interface PremiumDistribution {
  travellerRefId: number;
  relation: string;
  birthDate: string;
  base: number;
  tax: number;
  total: number;
}

interface Premium {
  base: number;
  tax: number;
  total: number;
  currency: string;
  netTotal: number;
  premiumDistributions: PremiumDistribution[];
}

interface Coverage {
  amount: number;
  currency: string;
}

interface InsuranceQuote {
  quoteId: string | null;
  planId: string;
  providerName: string;
  providerImageURL: string;
  planName: string;
  isWithSubLimits: boolean;
  coverage: Coverage;
  premium: Premium;
  highlights: string[];
  specialHighlights: string[];
  policyWordingURL: string;
  isRecommended: boolean;
  policyType: string;
  minTripDays: number;
  maxTripDays: number;
}

interface ProviderSummary {
  providerName: string;
  quotesCount: number;
}

interface CoverageSummary {
  coverageCurrency: string;
  minCoverage: number;
  maxCoverage: number;
  quotesCount: number;
}

interface QuoteResponse {
  providerSummary: ProviderSummary[];
  coverageSummary: CoverageSummary[];
  quotes: {
    individualQuotes?: InsuranceQuote[];
    familyQuotes?: InsuranceQuote[];
    friendsQuotes?: InsuranceQuote[];
    studentQuotes?: InsuranceQuote[];
    annualMultiTripQuotes?: InsuranceQuote[];
    [key: string]: InsuranceQuote[] | undefined;
  };
  tui?: string;
}

interface ProvidersResponse {
  provider: string[];
  insuranceType: string[];
  providerCheckList: Record<string, number>;
  tui: string;
  code: string;
  msg: string[];
}

// Provider names differ between GetProviderCheckList ("ICICILombardNew",
// "TATAAIG", …) and quoteslisting responses ("ICICI Lombard", …).
// Normalize for fuzzy matching.
const normalizeProvider = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

function providerMatches(a: string, b: string): boolean {
  const na = normalizeProvider(a);
  const nb = normalizeProvider(b);
  if (!na || !nb) return false;
  return na === nb || na.startsWith(nb) || nb.startsWith(na);
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatCoverage(c: Coverage): string {
  return `${c.currency} ${c.amount.toLocaleString()}`;
}

function formatCoverageRange(s: CoverageSummary): string {
  const fmt = (n: number) => n >= 1_000_000 ? `${n / 1_000_000}M` : n >= 1_000 ? `${n / 1_000}K` : `${n}`;
  return `${s.coverageCurrency} ${fmt(s.minCoverage)}–${fmt(s.maxCoverage)}`;
}

function getQuotesList(data: QuoteResponse): InsuranceQuote[] {
  const all: InsuranceQuote[] = [];
  for (const key of Object.keys(data.quotes)) {
    const arr = data.quotes[key];
    if (Array.isArray(arr)) all.push(...arr);
  }
  return all;
}

// ── Quote Card ─────────────────────────────────────────────────────────────

function QuoteCard({
  quote,
  searchParams,
  tui,
}: {
  quote: InsuranceQuote;
  searchParams: URLSearchParams;
  tui: string;
}) {
  const router = useRouter();

  const handleSelect = () => {
    const p = new URLSearchParams(searchParams);
    if (tui) p.set('tui', tui);
    router.push(`/booking/insurance/${quote.planId}?${p.toString()}`);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-md transition-all p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        {quote.providerImageURL ? (
          <img
            src={quote.providerImageURL}
            alt={quote.providerName}
            className="h-10 w-24 object-contain rounded border border-gray-100 p-1 flex-shrink-0"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div className="h-10 w-24 rounded border border-gray-100 bg-gray-50 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-medium text-gray-500 text-center leading-tight px-1">
              {quote.providerName}
            </span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-800 text-sm leading-tight">{quote.planName}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{quote.providerName}</p>
        </div>
        {quote.isRecommended && (
          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full flex-shrink-0">
            Recommended
          </span>
        )}
      </div>

      {/* Coverage */}
      <div className="flex gap-4 flex-wrap">
        <div>
          <p className="text-xs text-gray-400">Coverage</p>
          <p className="text-sm font-semibold text-gray-700">{formatCoverage(quote.coverage)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Plan Type</p>
          <p className="text-sm font-semibold text-gray-700">{quote.policyType}</p>
        </div>
        {quote.isWithSubLimits && (
          <div>
            <p className="text-xs text-gray-400">Sub-limits</p>
            <p className="text-sm font-semibold text-amber-600">Applicable</p>
          </div>
        )}
      </div>

      {/* Highlights */}
      {quote.highlights.length > 0 && (
        <ul className="space-y-1">
          {quote.highlights.slice(0, 2).map((h, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
              <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              {h}
            </li>
          ))}
        </ul>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-auto">
        <div>
          <p className="text-xs text-gray-400">Premium (incl. taxes)</p>
          <p className="text-2xl font-bold text-gray-800">
            ₹{Math.round(quote.premium.total).toLocaleString()}
          </p>
          {quote.premium.tax > 0 && (
            <p className="text-xs text-gray-400">incl. ₹{Math.round(quote.premium.tax)} tax</p>
          )}
        </div>
        <div className="flex flex-col gap-2 items-end">
          {quote.policyWordingURL && (
            <a
              href={quote.policyWordingURL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-500 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              Policy Wording
            </a>
          )}
          <button
            type="button"
            onClick={handleSelect}
            className="px-5 py-2.5 bg-[var(--color-success)] text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Filter Sidebar ─────────────────────────────────────────────────────────

function FilterSidebar({
  providers,
  providerSummary,
  coverageSummary,
  selectedProviders,
  selectedCoverage,
  onProvidersChange,
  onCoverageChange,
}: {
  providers: string[];
  providerSummary: ProviderSummary[];
  coverageSummary: CoverageSummary[];
  selectedProviders: string[];
  selectedCoverage: string | null;
  onProvidersChange: (p: string[]) => void;
  onCoverageChange: (c: string | null) => void;
}) {
  const toggleProvider = (name: string) => {
    onProvidersChange(
      selectedProviders.includes(name)
        ? selectedProviders.filter((p) => p !== name)
        : [...selectedProviders, name],
    );
  };

  const countFor = (name: string): number =>
    providerSummary.find((p) => providerMatches(p.providerName, name))?.quotesCount ?? 0;

  const labelFor = (name: string): string =>
    providerSummary.find((p) => providerMatches(p.providerName, name))?.providerName ?? name;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-6 sticky top-4">
      {/* Providers */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Insurance Provider</h4>
        <div className="space-y-2">
          {providers.map((name) => (
            <label key={name} className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedProviders.includes(name)}
                onChange={() => toggleProvider(name)}
                className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm text-gray-700 flex-1">{labelFor(name)}</span>
              <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                {countFor(name)}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Coverage */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Coverage Amount</h4>
        <div className="space-y-2">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="radio"
              checked={selectedCoverage === null}
              onChange={() => onCoverageChange(null)}
              className="w-4 h-4 border-gray-300 text-green-600 focus:ring-green-500"
            />
            <span className="text-sm text-gray-700">All</span>
          </label>
          {coverageSummary.map((c) => {
            const key = `${c.minCoverage}-${c.maxCoverage}`;
            return (
              <label key={key} className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  checked={selectedCoverage === key}
                  onChange={() => onCoverageChange(key)}
                  className="w-4 h-4 border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-gray-700 flex-1">{formatCoverageRange(c)}</span>
                <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                  {c.quotesCount}
                </span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Inner Page (consumes useSearchParams) ──────────────────────────────────

function InsuranceResultsInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const policyType = searchParams.get('policyType') || 'INDIVIDUAL';
  const countryNames = searchParams.get('countryNames') || '';
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<QuoteResponse | null>(null);
  const [providers, setProviders] = useState<string[]>([]);
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [selectedCoverage, setSelectedCoverage] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'price' | 'coverage'>('price');

  useEffect(() => {
    const countryCodes = searchParams.get('countryCodes') || '';
    const tenureInMonths = Number(searchParams.get('tenureInMonths') || '0');
    let travellersRaw: Array<{ id: number; birthdate: string; relation: string }> = [];
    try {
      travellersRaw = JSON.parse(searchParams.get('travellers') || '[]');
    } catch {
      travellersRaw = [];
    }

    const fetchAll = async () => {
      setLoading(true);
      setError('');
      try {
        const [providersRes, quotesRes] = await Promise.all([
          fetch(`${API_URL}/insurance/providers`),
          fetch(`${API_URL}/insurance/quotes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              policyType,
              countryCodes: countryCodes.split(',').filter(Boolean),
              countryNames: countryNames.split(',').filter(Boolean),
              startDate,
              endDate,
              tenureInMonths,
              isPed: false,
              travellers: travellersRaw,
            }),
          }),
        ]);
        if (!quotesRes.ok) throw new Error(`HTTP ${quotesRes.status}`);
        const quotesJson: QuoteResponse = await quotesRes.json();
        setData(quotesJson);
        if (providersRes.ok) {
          const providersJson: ProvidersResponse = await providersRes.json();
          setProviders(providersJson.provider ?? []);
        } else {
          setProviders([]);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to fetch quotes. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [searchParams]);

  const allQuotes = data ? getQuotesList(data) : [];

  const filteredQuotes = allQuotes
    .filter((q) => {
      if (
        selectedProviders.length > 0 &&
        !selectedProviders.some((sp) => providerMatches(sp, q.providerName))
      ) return false;
      if (selectedCoverage) {
        const [min, max] = selectedCoverage.split('-').map(Number);
        if (q.coverage.amount < min || q.coverage.amount > max) return false;
      }
      return true;
    })
    .sort((a, b) =>
      sortBy === 'price'
        ? a.premium.total - b.premium.total
        : b.coverage.amount - a.coverage.amount,
    );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Summary Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 flex flex-wrap items-center gap-2 text-sm text-gray-700">
            <span className="font-semibold">{countryNames}</span>
            <span className="text-gray-300">|</span>
            <span>{startDate} → {endDate}</span>
            <span className="text-gray-300">|</span>
            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
              {policyType}
            </span>
          </div>
          {!loading && data && (
            <span className="text-sm text-gray-500 font-medium">
              {filteredQuotes.length} plan{filteredQuotes.length !== 1 ? 's' : ''} found
            </span>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-14 h-14 border-4 border-green-200 border-t-[var(--color-success)] rounded-full animate-spin" />
            <p className="text-gray-500 text-sm">Searching best insurance plans...</p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {!loading && !error && data && (
          <div className="flex gap-6">
            {/* Sidebar */}
            <aside className="hidden lg:block w-60 flex-shrink-0">
              <FilterSidebar
                providers={providers}
                providerSummary={data.providerSummary || []}
                coverageSummary={data.coverageSummary || []}
                selectedProviders={selectedProviders}
                selectedCoverage={selectedCoverage}
                onProvidersChange={setSelectedProviders}
                onCoverageChange={setSelectedCoverage}
              />
            </aside>

            {/* Results */}
            <div className="flex-1 min-w-0">
              {/* Sort bar */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">
                  {filteredQuotes.length} plan{filteredQuotes.length !== 1 ? 's' : ''}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Sort by:</span>
                  <button
                    onClick={() => setSortBy('price')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${sortBy === 'price' ? 'bg-[var(--color-success)] text-white border-[var(--color-success)]' : 'border-gray-300 text-gray-600 hover:border-gray-400'}`}
                  >
                    Lowest Price
                  </button>
                  <button
                    onClick={() => setSortBy('coverage')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${sortBy === 'coverage' ? 'bg-[var(--color-success)] text-white border-[var(--color-success)]' : 'border-gray-300 text-gray-600 hover:border-gray-400'}`}
                  >
                    Highest Coverage
                  </button>
                </div>
              </div>

              {filteredQuotes.length === 0 ? (
                <div className="text-center py-16">
                  <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-500 font-medium">No plans match your filters</p>
                  <button
                    onClick={() => { setSelectedProviders([]); setSelectedCoverage(null); }}
                    className="mt-3 text-sm text-[var(--color-success)] hover:underline"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredQuotes.map((quote) => (
                    <QuoteCard
                      key={`${quote.planId}-${quote.providerName}`}
                      quote={quote}
                      searchParams={searchParams}
                      tui={data.tui ?? ''}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page Export ────────────────────────────────────────────────────────────

export default function InsuranceResultsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-green-200 border-t-[var(--color-success)] rounded-full animate-spin" />
      </div>
    }>
      <InsuranceResultsInner />
    </Suspense>
  );
}
