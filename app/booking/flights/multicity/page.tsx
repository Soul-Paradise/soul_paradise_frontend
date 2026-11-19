'use client';

import { useEffect, useState, useCallback, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useRequireAuth } from '@/contexts/AuthContext';
import {
  searchMultiCityFlights,
  type FlightFacets,
  type FlightResult,
  type MultiCityLeg,
  type MultiCitySearchParams,
  type MultiCitySearchResponse,
  type MultiCitySegmentInput,
} from '@/lib/flights-api';
import type { QueryParams } from '@/lib/results-api';
import { useResultPage } from '@/lib/use-result-page';
import { useResultPageSize } from '@/contexts/PreferencesContext';
import { Pagination, ResultsBusy } from '@/components/Results/Pagination';
import { FlightCard } from '@/components/FlightResults/FlightCard';
import { NoticeBanner } from '@/components/FlightResults/NoticeBanner';
import { MultiCitySelectionBar } from '@/components/FlightResults/MultiCitySelectionBar';
import { SortTabs, type SortOption } from '@/components/FlightResults/SortTabs';
import {
  FilterSidebar,
  createEmptyFilterState,
  flightFilterQuery,
  hasActiveFlightFilters,
  type FilterState,
} from '@/components/FlightResults/FilterSidebar';

const CABIN_LABELS: Record<string, string> = {
  E: 'Economy',
  PE: 'Premium Economy',
  B: 'Business',
  F: 'First Class',
};

function formatLegDate(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function cityLabel(name: string | undefined, code: string) {
  return (name || code).split('|')[0];
}

function parseSegments(raw: string): MultiCitySegmentInput[] {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (s) => s && typeof s.from === 'string' && typeof s.to === 'string' && typeof s.departDate === 'string',
    );
  } catch {
    return [];
  }
}

/**
 * One leg's column: its own server-side page of flights (shared filters and
 * sort, its own page number). Hooks live here so the leg count can vary.
 */
function MultiCityLegColumn({
  leg,
  query,
  currency,
  tui,
  selected,
  onSelect,
  onTotal,
  onExpired,
  hasActiveFilters,
  onClearFilters,
}: {
  leg: MultiCityLeg;
  query: QueryParams;
  currency: string;
  tui: string;
  selected: FlightResult | null;
  onSelect: (legIndex: number, flight: FlightResult) => void;
  onTotal: (legIndex: number, total: number) => void;
  onExpired: () => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}) {
  const fixed = useMemo(() => ({ leg: String(leg.legIndex) }), [leg.legIndex]);
  const perPage = useResultPageSize('flights');
  const { data, setPage, loading, error } = useResultPage<FlightResult, FlightFacets>({
    kind: 'flights',
    initial: leg.page,
    query,
    fixed,
    onExpired,
    pageSize: perPage.pageSize,
  });
  const page = data ?? leg.page;

  // Default pick: the first flight of the current page, until the user chooses.
  useEffect(() => {
    if (!selected && page.items[0]) onSelect(leg.legIndex, page.items[0]);
  }, [selected, page, leg.legIndex, onSelect]);

  useEffect(() => {
    onTotal(leg.legIndex, page.total);
  }, [page.total, leg.legIndex, onTotal]);

  const columnId = `mc-leg-${leg.legIndex}`;
  return (
    <section
      id={columnId}
      className="flex-shrink-0 w-[calc(50%-0.5rem)] min-w-[340px] max-h-[calc(100vh-15rem)] overflow-y-auto snap-start pr-1"
    >
      <div className="sticky top-0 z-10 bg-gray-100 pb-2">
        <div className="bg-white border border-gray-200 rounded-md px-3 py-2 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide truncate">
              Flight {leg.legIndex + 1} · {cityLabel(leg.fromName, leg.from)} → {cityLabel(leg.toName, leg.to)}
            </div>
            <div className="text-[11px] text-gray-500">{formatLegDate(leg.departDate)}</div>
          </div>
          <div className="text-[11px] text-gray-500 flex-shrink-0">{page.total} flights</div>
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {page.total > 0 ? (
        <ResultsBusy busy={loading}>
          <div className="space-y-3">
            {page.items.map((flight) => (
              <FlightCard
                key={`${leg.legIndex}-${flight.index}`}
                flight={flight}
                currency={currency}
                tui={tui}
                tripType="multicity"
                selectionMode
                selected={selected?.index === flight.index}
                onSelect={(f) => onSelect(leg.legIndex, f)}
              />
            ))}
          </div>
          <Pagination
            page={page.page}
            totalPages={page.totalPages}
            total={page.total}
            pageSize={page.pageSize}
            onPageChange={(p) => {
              setPage(p);
              document.getElementById(columnId)?.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            noun="flights"
            scrollTargetId={columnId}
            disabled={loading}
            onPageSizeChange={(n) => {
              perPage.setPageSize(n);
              document.getElementById(columnId)?.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </ResultsBusy>
      ) : (
        <div className="bg-white rounded-lg p-6 text-center text-sm text-gray-500">
          {hasActiveFilters ? (
            <>
              No flights match your filters for this leg.{' '}
              <button onClick={onClearFilters} className="text-(--color-links) hover:underline font-medium">
                Clear filters
              </button>
            </>
          ) : (
            'No flights found for this leg. Try different dates or airports.'
          )}
        </div>
      )}
    </section>
  );
}

function MultiCityResults() {
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [results, setResults] = useState<MultiCitySearchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('cheapest');
  const [filterState, setFilterState] = useState<FilterState>(createEmptyFilterState());
  const [showNotices, setShowNotices] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [selected, setSelected] = useState<Array<FlightResult | null>>([]);
  const [legTotals, setLegTotals] = useState<Record<number, number>>({});

  const segmentsRaw = searchParams.get('segments') || '';
  const adults = parseInt(searchParams.get('adults') || '1', 10);
  const children = parseInt(searchParams.get('children') || '0', 10);
  const infants = parseInt(searchParams.get('infants') || '0', 10);
  const cabin = (searchParams.get('cabin') || 'E') as MultiCitySearchParams['cabin'];
  const directOnly = searchParams.get('directOnly') === 'true';
  const refundableOnly = searchParams.get('refundableOnly') === 'true';
  const nearbyAirports = searchParams.get('nearbyAirports') !== 'false';
  const totalPax = adults + children + infants;

  /** One supplier search; filters/pages afterwards are answered server-side. */
  const doSearch = useCallback(async (resetFilters = true) => {
    const segments = parseSegments(segmentsRaw);
    if (segments.length < 2) {
      setError('Invalid multi-city itinerary. Please start a new search.');
      setLoading(false);
      return;
    }

    if (resetFilters) setFilterState(createEmptyFilterState());
    setLoading(true);
    setError('');

    try {
      const data = await searchMultiCityFlights({
        segments,
        adults,
        children,
        infants,
        cabin,
        directOnly,
        refundableOnly,
        nearbyAirports,
      });
      setResults(data);
      setSelected(data.legs.map(() => null));
      setLegTotals({});
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to search flights. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [segmentsRaw, adults, children, infants, cabin, directOnly, refundableOnly, nearbyAirports]);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    doSearch();
  }, [authLoading, isAuthenticated, doSearch]);

  // Stored results expired: search again, keeping the user's filters.
  const reSearch = useCallback(() => {
    void doSearch(false);
  }, [doSearch]);

  const query = useMemo(() => flightFilterQuery(filterState, sortBy), [filterState, sortBy]);
  const filteredCount = Object.values(legTotals).reduce((n, t) => n + t, 0);
  const totalAll = results ? results.legs.reduce((n, l) => n + l.page.totalAll, 0) : 0;

  const selectLeg = useCallback((legIndex: number, flight: FlightResult) => {
    setSelected((prev) => prev.map((f, i) => (i === legIndex ? flight : f)));
  }, []);
  const setLegTotal = useCallback((legIndex: number, total: number) => {
    setLegTotals((prev) => (prev[legIndex] === total ? prev : { ...prev, [legIndex]: total }));
  }, []);

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

  const handleBook = useCallback(() => {
    if (!results) return;
    if (selected.some((f) => !f)) return;
    // Each leg carries its OWN search TUI (DM: distinct per leg; IM: shared).
    const legs = selected.map((f, i) => ({
      tui: results.legs[i].tui,
      flightIndex: f!.index,
    }));
    const params = new URLSearchParams({
      tripType: results.tripType,
      legs: JSON.stringify(legs),
    });
    router.push(`/booking/flights/details/multicity?${params.toString()}`);
  }, [results, selected, router]);

  return (
    <main className="min-h-screen bg-gray-100">
      {/* Search Header - multi-city itinerary, styled like SearchSummary */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-0 flex-1 min-w-0 overflow-x-auto">
              {(results?.legs ?? parseSegments(segmentsRaw)).map((leg: any, i: number) => (
                <div
                  key={i}
                  className={`border border-gray-200 px-4 py-2 min-w-[150px] flex-shrink-0 ${
                    i === 0 ? 'rounded-l-lg' : 'border-l-0'
                  }`}
                >
                  <div className="text-[10px] text-gray-400 font-medium uppercase">
                    Flight {i + 1}
                  </div>
                  <div className="text-sm font-bold text-gray-900 truncate">
                    {leg.from} → {leg.to}
                  </div>
                  <div className="text-xs text-gray-500 whitespace-nowrap">
                    {formatLegDate(leg.departDate)}
                  </div>
                </div>
              ))}
              {/* Travellers & Class */}
              <div className="border border-gray-200 border-l-0 rounded-r-lg px-4 py-2 min-w-[140px] flex-shrink-0">
                <div className="text-[10px] text-gray-400 font-medium uppercase">
                  Travellers & Class
                </div>
                <div className="text-sm font-bold text-gray-900">
                  {totalPax.toString().padStart(2, '0')}{' '}
                  {totalPax === 1 ? 'Traveller' : 'Travellers'}
                </div>
                <div className="text-xs text-gray-500">{CABIN_LABELS[cabin] || 'Economy'}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Link
                href="/"
                className="px-4 py-2 border-2 border-red-500 text-red-500 text-xs font-bold rounded-md hover:bg-red-50 transition-colors uppercase tracking-wide whitespace-nowrap"
              >
                Modify Search
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-lg p-8 text-center mb-4">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-(--color-links) mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Searching your multi-city itinerary...
            </h3>
            <p className="text-sm text-gray-500">
              This may take up to 30 seconds as we search each leg across airlines.
            </p>
          </div>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white border border-gray-200 rounded-lg p-5 mb-3 animate-pulse"
            >
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
              onClick={reSearch}
              className="px-6 py-2 bg-(--color-links) text-white text-sm font-semibold rounded-md hover:opacity-90 transition-opacity"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && !error && results && (
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4 pb-28">
          {showNotices && results.notices?.length > 0 && (
            <div className="mb-4">
              <NoticeBanner notices={results.notices} onDismiss={() => setShowNotices(false)} />
            </div>
          )}

          {totalAll > 0 ? (
            <div className="flex gap-5">
              {/* Filter Sidebar - Desktop */}
              <div className="hidden lg:block w-[280px] flex-shrink-0">
                <div className="sticky top-[calc(85px+var(--staging-h))] max-h-[calc(100vh-100px-var(--staging-h))] overflow-y-auto pr-1">
                  <FilterSidebar
                    facets={results.facets}
                    filterState={filterState}
                    onFilterChange={setFilterState}
                    nearbyAirports={nearbyAirports}
                    onNearbyAirportsChange={handleNearbyAirportsChange}
                  />
                </div>
              </div>

              {/* Mobile Filter Overlay */}
              {showMobileFilters && (
                <div className="lg:hidden fixed inset-0 z-50 flex">
                  <div
                    className="absolute inset-0 bg-black/40"
                    onClick={() => setShowMobileFilters(false)}
                  />
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
                    <FilterSidebar
                      facets={results.facets}
                      filterState={filterState}
                      onFilterChange={setFilterState}
                      nearbyAirports={nearbyAirports}
                      onNearbyAirportsChange={handleNearbyAirportsChange}
                    />
                  </div>
                </div>
              )}

              {/* Main content */}
              <div className="flex-1 min-w-0">
                {/* Sort Tabs */}
                <div className="mb-4">
                  <SortTabs
                    activeSort={sortBy}
                    onSortChange={setSortBy}
                    totalResults={totalAll}
                    filteredCount={filteredCount}
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

                {/* Leg columns: two fill the width 50/50 (like round-trip);
                    3+ legs keep ~50% and the board scrolls horizontally. Each
                    column scrolls vertically on its own. */}
                <div className="flex gap-4 overflow-x-auto pb-2 snap-x">
                  {results.legs.map((leg) => (
                    <MultiCityLegColumn
                      key={`${results.resultId}-${leg.legIndex}`}
                      leg={leg}
                      query={query}
                      currency={results.currency}
                      tui={results.tui}
                      selected={selected[leg.legIndex] ?? null}
                      onSelect={selectLeg}
                      onTotal={setLegTotal}
                      onExpired={reSearch}
                      hasActiveFilters={hasActiveFilters}
                      onClearFilters={clearFilters}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg p-8 text-center">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No flights found</h3>
              <p className="text-sm text-gray-500">
                Try different dates or airports for more results.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Sticky selection bar */}
      {!loading && !error && results && (
        <MultiCitySelectionBar
          legs={results.legs.map((l) => ({
            from: cityLabel(l.fromName, l.from),
            to: cityLabel(l.toName, l.to),
          }))}
          selected={selected}
          currency={results.currency}
          onBook={handleBook}
        />
      )}
    </main>
  );
}

export default function MultiCityFlightPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-(--color-links) mb-4" />
            <p className="text-gray-500">Loading search...</p>
          </div>
        </div>
      }
    >
      <MultiCityResults />
    </Suspense>
  );
}
