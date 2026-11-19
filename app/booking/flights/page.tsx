'use client';

import { useEffect, useState, useCallback, useMemo, Suspense } from 'react';
import { AlertTriangle, Plane, SlidersHorizontal } from 'lucide-react';
import { ResultsEmpty, ResultsLoader } from '@/components/Results/ui';
import { Pagination, ResultsBusy } from '@/components/Results/Pagination';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useRequireAuth } from '@/contexts/AuthContext';
import {
  searchFlights,
  type FlightFacets,
  type FlightResult,
  type FlightSearchParams,
  type FlightSearchResponse,
} from '@/lib/flights-api';
import { useResultPage } from '@/lib/use-result-page';
import { useResultPageSize } from '@/contexts/PreferencesContext';
import { FlightCard } from '@/components/FlightResults/FlightCard';
import { SearchSummary } from '@/components/FlightResults/SearchSummary';
import { DateStrip } from '@/components/FlightResults/DateStrip';
import { SelectionBar } from '@/components/FlightResults/SelectionBar';
import { NoticeBanner } from '@/components/FlightResults/NoticeBanner';
import { SortTabs, type SortOption } from '@/components/FlightResults/SortTabs';
import {
  FilterSidebar,
  createEmptyFilterState,
  flightFilterQuery,
  hasActiveFlightFilters,
  type FilterState,
} from '@/components/FlightResults/FilterSidebar';

const ONWARD = { leg: 'onward' } as const;
const RETURN = { leg: 'return' } as const;

function FlightSearchResults() {
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [results, setResults] = useState<FlightSearchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('cheapest');
  const [filterState, setFilterState] = useState<FilterState>(createEmptyFilterState());
  const [showNotices, setShowNotices] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [selectedOnward, setSelectedOnward] = useState<FlightResult | null>(null);
  const [selectedReturn, setSelectedReturn] = useState<FlightResult | null>(null);

  // Extract search params
  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';
  const fromName = searchParams.get('fromName') || from;
  const toName = searchParams.get('toName') || to;
  const departDate = searchParams.get('departDate') || '';
  const returnDate = searchParams.get('returnDate') || undefined;
  const adults = parseInt(searchParams.get('adults') || '1', 10);
  const children = parseInt(searchParams.get('children') || '0', 10);
  const infants = parseInt(searchParams.get('infants') || '0', 10);
  const cabin = (searchParams.get('cabin') || 'E') as FlightSearchParams['cabin'];
  const tripType = (searchParams.get('tripType') || 'oneway') as FlightSearchParams['tripType'];
  const directOnly = searchParams.get('directOnly') === 'true';
  const refundableOnly = searchParams.get('refundableOnly') === 'true';
  const nearbyAirports = searchParams.get('nearbyAirports') !== 'false';
  const totalPax = adults + children + infants;

  /**
   * One supplier search. Filters/pages afterwards never re-run it. A new search
   * (URL change) clears the filters; re-searching after the stored results
   * expired keeps them.
   */
  const doSearch = useCallback(async (resetFilters = true) => {
    if (!from || !to || !departDate) {
      setError('Missing required search parameters');
      setLoading(false);
      return;
    }

    if (resetFilters) setFilterState(createEmptyFilterState());
    setLoading(true);
    setError('');

    try {
      const params: FlightSearchParams = {
        from,
        to,
        departDate,
        returnDate,
        adults,
        children,
        infants,
        cabin,
        tripType,
        directOnly,
        refundableOnly,
        nearbyAirports,
      };

      const data = await searchFlights(params);
      setResults(data);
      setSelectedOnward(null);
      setSelectedReturn(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to search flights. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [from, to, departDate, returnDate, adults, children, infants, cabin, tripType, directOnly, refundableOnly, nearbyAirports]);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    doSearch();
  }, [authLoading, isAuthenticated, doSearch]);

  // Stored results expired (~1h): search again, keeping the user's filters.
  const reSearch = useCallback(() => {
    void doSearch(false);
  }, [doSearch]);

  // Filters + sort are sent to the server; both legs share them.
  const query = useMemo(() => flightFilterQuery(filterState, sortBy), [filterState, sortBy]);
  const perPage = useResultPageSize('flights');
  const onward = useResultPage<FlightResult, FlightFacets>({
    kind: 'flights',
    initial: results?.onward ?? null,
    query,
    fixed: ONWARD,
    onExpired: reSearch,
    pageSize: perPage.pageSize,
  });
  const ret = useResultPage<FlightResult, FlightFacets>({
    kind: 'flights',
    initial: results?.return ?? null,
    query,
    fixed: RETURN,
    onExpired: reSearch,
    pageSize: perPage.pageSize,
  });

  const onwardPage = onward.data;
  const returnPage = ret.data;
  const isRoundTrip = tripType === 'roundtrip' && !!results?.return;

  // Default-select the first flight in each column for round-trip
  useEffect(() => {
    if (!isRoundTrip) return;
    if (!selectedOnward && onwardPage?.items.length) {
      setSelectedOnward(onwardPage.items[0]);
    }
    if (!selectedReturn && returnPage?.items.length) {
      setSelectedReturn(returnPage.items[0]);
    }
  }, [isRoundTrip, onwardPage, returnPage, selectedOnward, selectedReturn]);

  const handleBookRoundTrip = useCallback(() => {
    if (!selectedOnward || !selectedReturn || !results) return;
    const params = new URLSearchParams({
      tui: results.tui,
      index: selectedOnward.index,
      returnIndex: selectedReturn.index,
      tripType,
    });
    router.push(`/booking/flights/details?${params.toString()}`);
  }, [selectedOnward, selectedReturn, results, tripType, router]);

  const hasActiveFilters = hasActiveFlightFilters(filterState);
  const clearFilters = () => setFilterState(createEmptyFilterState());

  const handleNearbyAirportsChange = useCallback(
    (value: boolean) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('nearbyAirports', value.toString());
      router.replace(`${pathname}?${params.toString()}`);
    },
    [searchParams, router, pathname],
  );

  const dateStripParams = {
    from,
    to,
    adults,
    children,
    infants,
    cabin,
    tripType,
    directOnly,
    refundableOnly,
    nearbyAirports,
  };
  const cheapest = (p: FlightSearchResponse['onward'] | undefined) =>
    p && p.totalAll > 0 ? p.facets.minPrice : null;
  const listError = onward.error || ret.error;

  const sidebar = onwardPage ? (
    <FilterSidebar
      facets={onwardPage.facets}
      filterState={filterState}
      onFilterChange={setFilterState}
      nearbyAirports={nearbyAirports}
      onNearbyAirportsChange={handleNearbyAirportsChange}
    />
  ) : null;

  const noMatch = (
    <ResultsEmpty
      icon={SlidersHorizontal}
      title="No flights match your filters"
      message="Try adjusting your filters to see more results."
      action={hasActiveFilters ? { label: 'Clear all filters', onClick: clearFilters } : undefined}
    />
  );

  return (
    <main className="min-h-screen bg-(--color-background)">
      {/* Search Header */}
      <SearchSummary
        from={from}
        to={to}
        fromName={fromName}
        toName={toName}
        departDate={departDate}
        returnDate={returnDate}
        tripType={tripType}
        totalPax={totalPax}
        cabin={cabin}
        totalResults={results?.totalResults || 0}
      />

      {/* Loading State */}
      {loading && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <ResultsLoader
            title="Searching flights..."
            subtitle="This may take up to 30 seconds as we search across multiple airlines for the best fares."
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
            action={{ label: 'Try Again', onClick: reSearch }}
          />
        </div>
      )}

      {/* Results */}
      {!loading && !error && results && onwardPage && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          {/* Notices */}
          {showNotices && results.notices?.length > 0 && (
            <div className="mb-4">
              <NoticeBanner notices={results.notices} onDismiss={() => setShowNotices(false)} />
            </div>
          )}

          {onwardPage.totalAll > 0 ? (
            <div className="flex gap-5">
              {/* Filter Sidebar - Desktop */}
              <div className="hidden lg:block w-[280px] flex-shrink-0">
                <div className="sticky top-36 max-h-[calc(100vh-160px)] overflow-y-auto pr-1 scrollbar-hide">
                  {sidebar}
                </div>
              </div>

              {/* Mobile Filter Overlay */}
              {showMobileFilters && (
                <div className="lg:hidden fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="Filters">
                  <div className="absolute inset-0 bg-black/40" onClick={() => setShowMobileFilters(false)} />
                  <div className="relative w-[300px] max-w-[85vw] bg-(--color-background) overflow-y-auto">
                    <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
                      <h2 className="text-base font-bold text-gray-900">Filters</h2>
                      <button
                        type="button"
                        aria-label="Close filters"
                        onClick={() => setShowMobileFilters(false)}
                        className="p-1 text-gray-500 hover:text-gray-700"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    {sidebar}
                  </div>
                </div>
              )}

              {/* Main content */}
              <div className="flex-1 min-w-0">
                {/* Date Strip(s) */}
                {departDate && (
                  <div className="mb-4">
                    {isRoundTrip && returnDate ? (
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        <DateStrip
                          departDate={departDate}
                          cheapestPrice={cheapest(results.onward)}
                          currency={results.currency}
                          mode="depart"
                          seamless
                          pairedReturnDate={returnDate}
                          searchParams={dateStripParams}
                        />
                        <DateStrip
                          departDate={returnDate}
                          cheapestPrice={cheapest(results.return)}
                          currency={results.currency}
                          mode="return"
                          minDate={departDate}
                          seamless
                          onwardDate={departDate}
                          searchParams={dateStripParams}
                        />
                      </div>
                    ) : (
                      <DateStrip
                        departDate={departDate}
                        cheapestPrice={cheapest(results.onward)}
                        currency={results.currency}
                        mode="depart"
                        searchParams={dateStripParams}
                      />
                    )}
                  </div>
                )}
                {/* Sort Tabs */}
                <div className="mb-4">
                  <SortTabs
                    activeSort={sortBy}
                    onSortChange={setSortBy}
                    totalResults={onwardPage.totalAll}
                    filteredCount={onwardPage.total}
                  />
                </div>

                {/* Mobile filter toggle */}
                <div className="lg:hidden mb-3">
                  <button
                    type="button"
                    onClick={() => setShowMobileFilters(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white border border-(--color-tertiary-button) rounded-full text-sm font-semibold text-(--color-foreground) hover:border-(--color-links) hover:text-(--color-links)"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Filters
                    {hasActiveFilters && <span className="w-2 h-2 bg-(--color-links) rounded-full" />}
                  </button>
                </div>

                {listError && (
                  <div role="alert" className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                    {listError}
                  </div>
                )}

                {/* Flight cards */}
                {isRoundTrip && returnPage ? (
                  onwardPage.total > 0 || returnPage.total > 0 ? (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      {[
                        { key: 'o', label: `Onward · ${fromName || from} → ${toName || to}`, page: onwardPage, list: onward, selected: selectedOnward, select: setSelectedOnward, empty: 'No onward flights match your filters.' },
                        { key: 'r', label: `Return · ${toName || to} → ${fromName || from}`, page: returnPage, list: ret, selected: selectedReturn, select: setSelectedReturn, empty: 'No return flights match your filters.' },
                      ].map((col) => (
                        <div key={col.key} id={`flights-${col.key}`} className="scroll-mt-40">
                          <div className="sticky top-36 z-10 bg-(--color-background) pb-2 mb-2">
                            <div className="bg-white border border-(--color-tertiary-button) rounded-xl px-4 py-2.5 flex items-center justify-between">
                              <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">{col.label}</div>
                              <div className="text-[11px] text-gray-500">{col.page.total} flights</div>
                            </div>
                          </div>
                          {col.page.total > 0 ? (
                            <ResultsBusy busy={col.list.loading}>
                              <div className="space-y-3">
                                {col.page.items.map((flight) => (
                                  <FlightCard
                                    key={`${col.key}-${flight.index}`}
                                    flight={flight}
                                    currency={results.currency}
                                    tui={results.tui}
                                    tripType={tripType}
                                    selectionMode
                                    selected={col.selected?.index === flight.index}
                                    onSelect={col.select}
                                  />
                                ))}
                              </div>
                              <Pagination
                                page={col.page.page}
                                totalPages={col.page.totalPages}
                                total={col.page.total}
                                pageSize={col.page.pageSize}
                                onPageChange={col.list.setPage}
                                onPageSizeChange={perPage.setPageSize}
                                noun="flights"
                                scrollTargetId={`flights-${col.key}`}
                                disabled={col.list.loading}
                              />
                            </ResultsBusy>
                          ) : (
                            <div className="rounded-2xl border border-(--color-tertiary-button) bg-white p-6 text-center text-sm text-(--color-inactive)">
                              {col.empty}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    noMatch
                  )
                ) : onwardPage.total > 0 ? (
                  <ResultsBusy busy={onward.loading} id="flights-list">
                    <div className="space-y-3">
                      {onwardPage.items.map((flight) => (
                        <FlightCard
                          key={flight.index}
                          flight={flight}
                          currency={results.currency}
                          tui={results.tui}
                          tripType={tripType}
                        />
                      ))}
                    </div>
                    <Pagination
                      page={onwardPage.page}
                      totalPages={onwardPage.totalPages}
                      total={onwardPage.total}
                      pageSize={onwardPage.pageSize}
                      onPageChange={onward.setPage}
                      onPageSizeChange={perPage.setPageSize}
                      noun="flights"
                      scrollTargetId="flights-list"
                      disabled={onward.loading}
                    />
                  </ResultsBusy>
                ) : (
                  noMatch
                )}
              </div>
            </div>
          ) : (
            <ResultsEmpty
              icon={Plane}
              title="No flights found"
              message="Try different dates or airports for more results."
              action={{ label: 'Modify search', href: '/?tab=flights#booking' }}
            />
          )}
        </div>
      )}

      {/* Sticky selection bar for round-trip */}
      {isRoundTrip && !loading && (
        <SelectionBar
          selectedOnward={selectedOnward}
          selectedReturn={selectedReturn}
          currency={results?.currency || 'INR'}
          onBook={handleBookRoundTrip}
        />
      )}
      {isRoundTrip && <div className="h-24" />}
    </main>
  );
}

export default function FlightSearchPage() {
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
      <FlightSearchResults />
    </Suspense>
  );
}
