'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { ResultsEmpty, ResultsLoader } from '@/components/Results/ui';
import { useSearchParams } from 'next/navigation';
import { useRequireAuth } from '@/contexts/AuthContext';
import {
  getQuotes,
  searchFromParams,
  searchToParams,
  type InsuranceFacets,
  type InsuranceQuote,
  type InsuranceSearch,
  type QuotesResponse,
} from '@/lib/insurance-api';
import { useResultPage } from '@/lib/use-result-page';
import { useResultPageSize } from '@/contexts/PreferencesContext';
import { Pagination, ResultsBusy } from '@/components/Results/Pagination';
import { InsuranceSearchSummary } from '@/components/InsuranceResults/SearchSummary';
import { InsuranceSortTabs, type InsuranceSortOption } from '@/components/InsuranceResults/SortTabs';
import { InsuranceQuoteCard } from '@/components/InsuranceResults/QuoteCard';
import {
  InsuranceFilterSidebar,
  createEmptyInsuranceFilters,
  hasActiveInsuranceFilters,
  insuranceFilterQuery,
  type InsuranceFilterState,
} from '@/components/InsuranceResults/FilterSidebar';
import { tripDays } from '@/components/Insurance/shared';

// Laid out exactly like app/booking/flights/page.tsx - keep the two in step.
// Filtering, sorting and paging are done by the backend on the stored quotes.

function InsuranceResults({ search }: { search: InsuranceSearch }) {
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  const [results, setResults] = useState<QuotesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState<InsuranceSortOption>('cheapest');
  const [filterState, setFilterState] = useState<InsuranceFilterState>(createEmptyInsuranceFilters());
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  /** Re-runs the insurer search (retry, or the stored quotes expired); filters are kept. */
  const doSearch = useCallback(() => {
    setLoading(true);
    setError('');
    getQuotes(search)
      .then(setResults)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    let cancelled = false;
    getQuotes(search)
      .then((res) => !cancelled && setResults(res))
      .catch((e: Error) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, search]);

  const query = useMemo(() => insuranceFilterQuery(filterState, sortBy), [filterState, sortBy]);
  const perPage = useResultPageSize('insurance');
  const list = useResultPage<InsuranceQuote, InsuranceFacets>({
    kind: 'insurance',
    initial: results?.page ?? null,
    query,
    onExpired: doSearch,
    pageSize: perPage.pageSize,
  });
  const page = list.data;

  const hasActiveFilters = hasActiveInsuranceFilters(filterState);
  const clearFilters = () => setFilterState(createEmptyInsuranceFilters());
  const days = tripDays(search.startDate, search.endDate);

  const planHref = (q: InsuranceQuote) => {
    const p = searchToParams(search);
    p.set('tui', results?.tui ?? '');
    return `/booking/insurance/${encodeURIComponent(q.planId)}?${p.toString()}`;
  };

  return (
    <main className="min-h-screen bg-(--color-background)">
      <InsuranceSearchSummary search={search} />

      {/* Loading State */}
      {loading && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <ResultsLoader
            title="Searching insurance plans..."
            subtitle="This may take up to 30 seconds as we compare plans across multiple insurers for the best price."
          />
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <ResultsEmpty
            icon={AlertTriangle}
            title="Search Failed"
            message={error}
            action={{ label: 'Try Again', onClick: doSearch }}
          />
        </div>
      )}

      {/* Results */}
      {!loading && !error && results && page && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          {page.totalAll > 0 ? (
            <div className="flex gap-5">
              {/* Filter Sidebar - Desktop */}
              <div className="hidden lg:block w-[280px] flex-shrink-0">
                <div className="sticky top-[calc(9rem+var(--staging-h))] max-h-[calc(100vh-160px-var(--staging-h))] overflow-y-auto pr-1 scrollbar-hide">
                  <InsuranceFilterSidebar facets={page.facets} filterState={filterState} onFilterChange={setFilterState} />
                </div>
              </div>

              {/* Mobile Filter Overlay */}
              {showMobileFilters && (
                <div className="lg:hidden fixed inset-0 z-50 flex">
                  <div className="absolute inset-0 bg-black/40" onClick={() => setShowMobileFilters(false)} />
                  <div className="relative w-[300px] max-w-[85vw] bg-(--color-background) overflow-y-auto">
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
                    <InsuranceFilterSidebar facets={page.facets} filterState={filterState} onFilterChange={setFilterState} />
                  </div>
                </div>
              )}

              {/* Main content */}
              <div className="flex-1 min-w-0">
                <div className="mb-4">
                  <InsuranceSortTabs
                    activeSort={sortBy}
                    onSortChange={setSortBy}
                    totalResults={page.totalAll}
                    filteredCount={page.total}
                  />
                </div>

                {/* Mobile filter toggle */}
                <div className="lg:hidden mb-3">
                  <button
                    type="button"
                    onClick={() => setShowMobileFilters(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white border border-(--color-tertiary-button) rounded-full text-sm font-semibold text-(--color-foreground) hover:border-(--color-links) hover:text-(--color-links)"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Filters
                    {hasActiveFilters && <span className="w-2 h-2 bg-(--color-links) rounded-full" />}
                  </button>
                </div>

                {list.error && (
                  <div role="alert" className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                    {list.error}
                  </div>
                )}

                {page.total > 0 ? (
                  <ResultsBusy busy={list.loading} id="insurance-list">
                    <div className="space-y-3">
                      {page.items.map((q) => (
                        <InsuranceQuoteCard key={`${q.provider}-${q.planId}`} quote={q} href={planHref(q)} days={days} />
                      ))}
                    </div>
                    <Pagination
                      page={page.page}
                      totalPages={page.totalPages}
                      total={page.total}
                      pageSize={page.pageSize}
                      onPageChange={list.setPage}
                      onPageSizeChange={perPage.setPageSize}
                      noun="plans"
                      scrollTargetId="insurance-list"
                      disabled={list.loading}
                    />
                  </ResultsBusy>
                ) : (
                  <ResultsEmpty
                    icon={SlidersHorizontal}
                    title="No plans match your filters"
                    message="Try adjusting or clearing your filters to see more plans."
                    action={{ label: 'Clear all filters', onClick: clearFilters }}
                  />
                )}
              </div>
            </div>
          ) : (
            <ResultsEmpty
              icon={ShieldCheck}
              title="No plans found"
              message="No insurer offers a plan for this trip. Try different dates or destinations."
              action={{ label: 'Modify search', href: '/?tab=insurance#booking' }}
            />
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
      <main className="min-h-screen bg-(--color-background) px-4 py-10">
        <div className="mx-auto max-w-xl">
          <ResultsEmpty
            icon={ShieldCheck}
            title="Incomplete search"
            message="This search link is missing details. Please search again."
            action={{ label: 'Search Insurance', href: '/?tab=insurance#booking' }}
          />
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
        <div className="min-h-screen bg-(--color-background)">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <ResultsLoader title="Loading search..." subtitle="Getting your search ready." rows={2} />
          </div>
        </div>
      }
    >
      <KeyedResults />
    </Suspense>
  );
}
