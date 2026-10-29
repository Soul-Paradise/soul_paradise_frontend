'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useRequireAuth } from '@/contexts/AuthContext';
import {
  getQuotes,
  searchFromParams,
  searchToParams,
  type InsuranceQuote,
  type InsuranceSearch,
  type QuotesResponse,
} from '@/lib/insurance-api';
import { InsuranceSearchSummary } from '@/components/InsuranceResults/SearchSummary';
import { InsuranceSortTabs, type InsuranceSortOption } from '@/components/InsuranceResults/SortTabs';
import { InsuranceQuoteCard } from '@/components/InsuranceResults/QuoteCard';
import {
  InsuranceFilterSidebar,
  createEmptyInsuranceFilters,
  quoteInBand,
  type InsuranceFilterState,
} from '@/components/InsuranceResults/FilterSidebar';
import { tripDays } from '@/components/Insurance/shared';

// Laid out exactly like app/booking/flights/page.tsx - keep the two in step.

function sortQuotes(quotes: InsuranceQuote[], sortBy: InsuranceSortOption) {
  return [...quotes].sort((a, b) => {
    if (sortBy === 'cheapest') return a.price - b.price || b.coverage.amount - a.coverage.amount;
    if (sortBy === 'highestCover') return b.coverage.amount - a.coverage.amount || a.price - b.price;
    // Best value: insurer-recommended first, then most cover per rupee.
    return (
      Number(b.isRecommended) - Number(a.isRecommended) ||
      b.coverage.amount / b.price - a.coverage.amount / a.price
    );
  });
}

function InsuranceResults({ search }: { search: InsuranceSearch }) {
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  const [results, setResults] = useState<QuotesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState<InsuranceSortOption>('cheapest');
  const [filterState, setFilterState] = useState<InsuranceFilterState>(createEmptyInsuranceFilters(0));
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const doSearch = useCallback(() => {
    setLoading(true);
    setError('');
    getQuotes(search)
      .then((res) => {
        setResults(res);
        setFilterState(createEmptyInsuranceFilters(Math.max(0, ...res.quotes.map((q) => q.price))));
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    let cancelled = false;
    getQuotes(search)
      .then((res) => {
        if (cancelled) return;
        setResults(res);
        setFilterState(createEmptyInsuranceFilters(Math.max(0, ...res.quotes.map((q) => q.price))));
      })
      .catch((e: Error) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, search]);

  const filteredQuotes = useMemo(() => {
    if (!results) return [];
    const f = filterState;
    return sortQuotes(
      results.quotes.filter(
        (q) =>
          (f.categories.size === 0 || f.categories.has(q.category)) &&
          (f.insurers.size === 0 || f.insurers.has(q.providerLabel)) &&
          (f.coverBands.size === 0 || [...f.coverBands].some((k) => quoteInBand(q, k))) &&
          (!f.noSubLimitsOnly || !q.isWithSubLimits) &&
          q.price <= f.maxPrice,
      ),
      sortBy,
    );
  }, [results, filterState, sortBy]);

  const maxPrice = results ? Math.max(0, ...results.quotes.map((q) => q.price)) : 0;
  const hasActiveFilters =
    filterState.categories.size > 0 ||
    filterState.insurers.size > 0 ||
    filterState.coverBands.size > 0 ||
    filterState.noSubLimitsOnly ||
    filterState.maxPrice < maxPrice;
  const clearFilters = () => setFilterState(createEmptyInsuranceFilters(maxPrice));
  const days = tripDays(search.startDate, search.endDate);

  const planHref = (q: InsuranceQuote) => {
    const p = searchToParams(search);
    p.set('tui', results?.tui ?? '');
    return `/booking/insurance/${encodeURIComponent(q.planId)}?${p.toString()}`;
  };

  return (
    <main className="min-h-screen bg-gray-100">
      <InsuranceSearchSummary search={search} />

      {/* Loading State */}
      {loading && (
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-lg p-8 text-center mb-4">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-(--color-links) mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Searching insurance plans...</h3>
            <p className="text-sm text-gray-500">
              This may take up to 30 seconds as we compare plans across multiple insurers for the best price.
            </p>
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-5 mb-3 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-200 rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                </div>
                <div className="space-y-2 text-right">
                  <div className="h-5 bg-gray-200 rounded w-20 ml-auto" />
                  <div className="h-8 bg-gray-200 rounded w-16 ml-auto" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-lg p-8 text-center">
            <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Search Failed</h3>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <button
              onClick={doSearch}
              className="px-6 py-2 bg-(--color-links) text-white text-sm font-semibold rounded-md hover:opacity-90 transition-opacity"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && !error && results && (
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {results.quotes.length > 0 ? (
            <div className="flex gap-5">
              {/* Filter Sidebar - Desktop */}
              <div className="hidden lg:block w-[280px] flex-shrink-0">
                <div className="sticky top-[85px] max-h-[calc(100vh-100px)] overflow-y-auto pr-1">
                  <InsuranceFilterSidebar data={results} filterState={filterState} onFilterChange={setFilterState} />
                </div>
              </div>

              {/* Mobile Filter Overlay */}
              {showMobileFilters && (
                <div className="lg:hidden fixed inset-0 z-50 flex">
                  <div className="absolute inset-0 bg-black/40" onClick={() => setShowMobileFilters(false)} />
                  <div className="relative w-[300px] max-w-[85vw] bg-gray-50 overflow-y-auto">
                    <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
                      <h2 className="text-base font-bold text-gray-900">Filters</h2>
                      <button
                        type="button"
                        onClick={() => setShowMobileFilters(false)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <InsuranceFilterSidebar data={results} filterState={filterState} onFilterChange={setFilterState} />
                  </div>
                </div>
              )}

              {/* Main content */}
              <div className="flex-1 min-w-0">
                <div className="mb-4">
                  <InsuranceSortTabs
                    activeSort={sortBy}
                    onSortChange={setSortBy}
                    totalResults={results.quotes.length}
                    filteredCount={filteredQuotes.length}
                  />
                </div>

                {/* Mobile filter toggle */}
                <div className="lg:hidden mb-3">
                  <button
                    type="button"
                    onClick={() => setShowMobileFilters(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Filters
                    {hasActiveFilters && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                  </button>
                </div>

                {filteredQuotes.length > 0 ? (
                  <div className="space-y-3">
                    {filteredQuotes.map((q) => (
                      <InsuranceQuoteCard key={`${q.provider}-${q.planId}`} quote={q} href={planHref(q)} days={days} />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-lg p-8 text-center">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No plans match your filters</h3>
                    <p className="text-sm text-gray-500 mb-3">Try adjusting or clearing your filters to see more plans.</p>
                    <button type="button" onClick={clearFilters} className="text-sm font-medium text-(--color-links) hover:underline">
                      Clear all filters
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg p-8 text-center">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No plans found</h3>
              <p className="text-sm text-gray-500">
                No insurer offers a plan for this trip. Try different dates or destinations.
              </p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

/** A new search remounts the results, so filters and data never leak between searches. */
function KeyedResults() {
  const params = useSearchParams();
  const search = useMemo(() => searchFromParams(params), [params]);
  if (!search) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg p-8 text-center max-w-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Incomplete search</h3>
          <p className="text-sm text-gray-500 mb-4">This search link is missing details. Please search again.</p>
          <Link
            href="/?tab=insurance"
            className="inline-block px-6 py-2 bg-(--color-links) text-white text-sm font-semibold rounded-md hover:opacity-90"
          >
            Search Insurance
          </Link>
        </div>
      </main>
    );
  }
  return <InsuranceResults key={params.toString()} search={search} />;
}

export default function InsuranceResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-(--color-links)" />
        </div>
      }
    >
      <KeyedResults />
    </Suspense>
  );
}
