'use client';

import { useEffect, useState, useCallback, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
  searchFlights,
  type FlightResult,
  type FlightSearchParams,
  type FlightSearchResponse,
} from '@/lib/flights-api';
import { FlightCard } from '@/components/FlightResults/FlightCard';
import { SearchSummary } from '@/components/FlightResults/SearchSummary';
import { DateStrip } from '@/components/FlightResults/DateStrip';
import { NoticeBanner } from '@/components/FlightResults/NoticeBanner';
import { SortTabs, type SortOption } from '@/components/FlightResults/SortTabs';
import {
  FilterSidebar,
  getTimeRange,
  type FilterState,
} from '@/components/FlightResults/FilterSidebar';

function createEmptyFilterState(maxPrice: number): FilterState {
  return {
    stops: new Set(),
    refundableOnly: false,
    departureTimeRanges: new Set(),
    arrivalTimeRanges: new Set(),
    airlines: new Set(),
    priceRange: [0, maxPrice || 999999],
    connectingAirports: new Set(),
  };
}

function parseDurationMinutes(d: string): number {
  if (d.startsWith('PT')) {
    const hours = parseInt(d.match(/(\d+)H/)?.[1] || '0', 10);
    const mins = parseInt(d.match(/(\d+)M/)?.[1] || '0', 10);
    return hours * 60 + mins;
  }
  const hours = parseInt(d.match(/(\d+)\s*h/)?.[1] || '0', 10);
  const mins = parseInt(d.match(/(\d+)\s*m/)?.[1] || '0', 10);
  return hours * 60 + mins;
}

function FlightSearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [results, setResults] = useState<FlightSearchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('cheapest');
  const [filterState, setFilterState] = useState<FilterState>(createEmptyFilterState(0));
  const [showNotices, setShowNotices] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

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

  const doSearch = useCallback(async () => {
    if (!from || !to || !departDate) {
      setError('Missing required search parameters');
      setLoading(false);
      return;
    }

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

      // Initialize filter state with max price from results
      if (data.flights.length > 0) {
        const maxPrice = Math.max(...data.flights.map((f) => f.grossFare));
        setFilterState(createEmptyFilterState(maxPrice));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to search flights. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [from, to, departDate, returnDate, adults, children, infants, cabin, tripType, directOnly, refundableOnly, nearbyAirports]);

  useEffect(() => {
    doSearch();
  }, [doSearch]);

  // Apply all filters
  const filteredFlights = useMemo(() => {
    if (!results?.flights) return [];

    let flights = [...results.flights];

    // Stops
    if (filterState.stops.size > 0) {
      flights = flights.filter((f) => {
        const stopKey = Math.min(f.stops, 2);
        return filterState.stops.has(stopKey);
      });
    }

    // Refundable
    if (filterState.refundableOnly) {
      flights = flights.filter((f) => f.refundable);
    }

    // Departure time ranges
    if (filterState.departureTimeRanges.size > 0) {
      flights = flights.filter((f) =>
        filterState.departureTimeRanges.has(getTimeRange(f.departureTime)),
      );
    }

    // Arrival time ranges
    if (filterState.arrivalTimeRanges.size > 0) {
      flights = flights.filter((f) =>
        filterState.arrivalTimeRanges.has(getTimeRange(f.arrivalTime)),
      );
    }

    // Airlines
    if (filterState.airlines.size > 0) {
      flights = flights.filter((f) => filterState.airlines.has(f.airlineCode));
    }

    // Price range
    flights = flights.filter(
      (f) =>
        f.grossFare >= filterState.priceRange[0] &&
        f.grossFare <= filterState.priceRange[1],
    );

    // Connecting airports
    if (filterState.connectingAirports.size > 0) {
      flights = flights.filter((f) => {
        if (f.stops === 0) return false;
        return f.connections?.some((c) =>
          filterState.connectingAirports.has(c.airport),
        );
      });
    }

    // Sort
    flights.sort((a, b) => {
      switch (sortBy) {
        case 'cheapest':
          return a.grossFare - b.grossFare;
        case 'fastest':
          return parseDurationMinutes(a.duration) - parseDurationMinutes(b.duration);
        case 'bestValue': {
          // Weighted: 50% price, 30% duration, 20% departure convenience
          const maxPrice = Math.max(...flights.map((f) => f.grossFare)) || 1;
          const maxDur = Math.max(...flights.map((f) => parseDurationMinutes(f.duration))) || 1;
          const scoreA =
            0.5 * (a.grossFare / maxPrice) +
            0.3 * (parseDurationMinutes(a.duration) / maxDur) +
            0.2 * (a.recommended ? 0 : 1);
          const scoreB =
            0.5 * (b.grossFare / maxPrice) +
            0.3 * (parseDurationMinutes(b.duration) / maxDur) +
            0.2 * (b.recommended ? 0 : 1);
          return scoreA - scoreB;
        }
        default:
          return 0;
      }
    });

    return flights;
  }, [results, filterState, sortBy]);

  const hasActiveFilters =
    filterState.stops.size > 0 ||
    filterState.refundableOnly ||
    filterState.departureTimeRanges.size > 0 ||
    filterState.arrivalTimeRanges.size > 0 ||
    filterState.airlines.size > 0 ||
    filterState.connectingAirports.size > 0 ||
    (results &&
      results.flights.length > 0 &&
      filterState.priceRange[1] < Math.max(...results.flights.map((f) => f.grossFare)));

  const clearFilters = () => {
    if (results?.flights.length) {
      const maxPrice = Math.max(...results.flights.map((f) => f.grossFare));
      setFilterState(createEmptyFilterState(maxPrice));
    }
  };

  const handleNearbyAirportsChange = useCallback(
    (value: boolean) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('nearbyAirports', value.toString());
      router.replace(`${pathname}?${params.toString()}`);
    },
    [searchParams, router, pathname],
  );

  return (
    <main className="min-h-screen bg-gray-100">
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
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-lg p-8 text-center mb-4">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-(--color-links) mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Searching flights...
            </h3>
            <p className="text-sm text-gray-500">
              This may take up to 30 seconds as we search across multiple
              airlines for the best fares.
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
          {/* Date Strip */}
          {departDate && (
            <div className="mb-4">
              <DateStrip
                departDate={departDate}
                cheapestPrice={
                  results.flights.length > 0
                    ? Math.min(...results.flights.map((f) => f.grossFare))
                    : null
                }
                currency={results.currency}
                searchParams={{
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
                }}
              />
            </div>
          )}

          {/* Notices */}
          {showNotices && results.notices?.length > 0 && (
            <div className="mb-4">
              <NoticeBanner
                notices={results.notices}
                onDismiss={() => setShowNotices(false)}
              />
            </div>
          )}

          {results.flights.length > 0 ? (
            <div className="flex gap-5">
              {/* Filter Sidebar - Desktop */}
              <div className="hidden lg:block w-[280px] flex-shrink-0">
                <div className="sticky top-[85px]">
                  <FilterSidebar
                    flights={results.flights}
                    filterState={filterState}
                    onFilterChange={setFilterState}
                    currency={results.currency}
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
                      flights={results.flights}
                      filterState={filterState}
                      onFilterChange={setFilterState}
                      currency={results.currency}
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
                    totalResults={results.totalResults}
                    filteredCount={filteredFlights.length}
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
                    {hasActiveFilters && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full" />
                    )}
                  </button>
                </div>

                {/* Flight cards */}
                {filteredFlights.length > 0 ? (
                  <div className="space-y-3">
                    {filteredFlights.map((flight) => (
                      <FlightCard
                        key={flight.index}
                        flight={flight}
                        currency={results.currency}
                        searchId={results.searchId}
                        tripType={tripType}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-lg p-8 text-center">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No flights match your filters
                    </h3>
                    <p className="text-sm text-gray-500 mb-3">
                      Try adjusting your filters to see more results.
                    </p>
                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters}
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        Clear all filters
                      </button>
                    )}
                  </div>
                )}
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
    </main>
  );
}

export default function FlightSearchPage() {
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
      <FlightSearchResults />
    </Suspense>
  );
}
