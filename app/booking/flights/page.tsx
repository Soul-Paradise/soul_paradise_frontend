'use client';

import { useEffect, useState, useCallback, useMemo, Suspense } from 'react';
import { AlertTriangle, Plane, SlidersHorizontal } from 'lucide-react';
import { ResultsEmpty, ResultsLoader } from '@/components/Results/ui';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useRequireAuth } from '@/contexts/AuthContext';
import {
  searchFlights,
  type FlightResult,
  type FlightSearchParams,
  type FlightSearchResponse,
} from '@/lib/flights-api';
import { FlightCard } from '@/components/FlightResults/FlightCard';
import { SearchSummary } from '@/components/FlightResults/SearchSummary';
import { DateStrip } from '@/components/FlightResults/DateStrip';
import { SelectionBar } from '@/components/FlightResults/SelectionBar';
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
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
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
      setSelectedOnward(null);
      setSelectedReturn(null);

      // Initialize filter state with max price across both lists
      const allFlights = [...data.flights, ...(data.returnFlights || [])];
      if (allFlights.length > 0) {
        const maxPrice = Math.max(...allFlights.map((f) => f.grossFare));
        setFilterState(createEmptyFilterState(maxPrice));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to search flights. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [from, to, departDate, returnDate, adults, children, infants, cabin, tripType, directOnly, refundableOnly, nearbyAirports]);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    doSearch();
  }, [authLoading, isAuthenticated, doSearch]);

  const applyFiltersAndSort = useCallback((source: FlightResult[]): FlightResult[] => {
    let flights = [...source];

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
  }, [filterState, sortBy]);

  const filteredFlights = useMemo(
    () => (results?.flights ? applyFiltersAndSort(results.flights) : []),
    [results, applyFiltersAndSort],
  );
  const filteredReturnFlights = useMemo(
    () => (results?.returnFlights ? applyFiltersAndSort(results.returnFlights) : []),
    [results, applyFiltersAndSort],
  );

  const isRoundTrip = tripType === 'roundtrip' && !!results?.returnFlights;

  // Default-select the first flight in each column for round-trip
  useEffect(() => {
    if (!isRoundTrip) return;
    if (!selectedOnward && filteredFlights.length > 0) {
      setSelectedOnward(filteredFlights[0]);
    }
    if (!selectedReturn && filteredReturnFlights.length > 0) {
      setSelectedReturn(filteredReturnFlights[0]);
    }
  }, [isRoundTrip, filteredFlights, filteredReturnFlights, selectedOnward, selectedReturn]);

  const handleBookRoundTrip = useCallback(() => {
    if (!selectedOnward || !selectedReturn || !results) return;
    const params = new URLSearchParams({
      tui: results.tui,
      index: selectedOnward.index,
      netFare: String(selectedOnward.netFare),
      returnIndex: selectedReturn.index,
      returnNetFare: String(selectedReturn.netFare),
      tripType,
    });
    router.push(`/booking/flights/details?${params.toString()}`);
  }, [selectedOnward, selectedReturn, results, tripType, router]);

  const allFlights = useMemo(
    () => (results ? [...results.flights, ...(results.returnFlights || [])] : []),
    [results],
  );

  const hasActiveFilters =
    filterState.stops.size > 0 ||
    filterState.refundableOnly ||
    filterState.departureTimeRanges.size > 0 ||
    filterState.arrivalTimeRanges.size > 0 ||
    filterState.airlines.size > 0 ||
    filterState.connectingAirports.size > 0 ||
    (allFlights.length > 0 &&
      filterState.priceRange[1] < Math.max(...allFlights.map((f) => f.grossFare)));

  const clearFilters = () => {
    if (allFlights.length) {
      const maxPrice = Math.max(...allFlights.map((f) => f.grossFare));
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
            action={{ label: 'Try Again', onClick: doSearch }}
          />
        </div>
      )}

      {/* Results */}
      {!loading && !error && results && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
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
                <div className="sticky top-36 max-h-[calc(100vh-160px)] overflow-y-auto pr-1 scrollbar-hide">
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
                {/* Date Strip(s) */}
                {departDate && (
                  <div className="mb-4">
                    {isRoundTrip && returnDate ? (
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        <DateStrip
                          departDate={departDate}
                          cheapestPrice={
                            results.flights.length > 0
                              ? Math.min(...results.flights.map((f) => f.grossFare))
                              : null
                          }
                          currency={results.currency}
                          mode="depart"
                          seamless
                          pairedReturnDate={returnDate}
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
                        <DateStrip
                          departDate={returnDate}
                          cheapestPrice={
                            (results.returnFlights?.length ?? 0) > 0
                              ? Math.min(
                                  ...(results.returnFlights || []).map((f) => f.grossFare),
                                )
                              : null
                          }
                          currency={results.currency}
                          mode="return"
                          minDate={departDate}
                          seamless
                          onwardDate={departDate}
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
                    ) : (
                      <DateStrip
                        departDate={departDate}
                        cheapestPrice={
                          results.flights.length > 0
                            ? Math.min(...results.flights.map((f) => f.grossFare))
                            : null
                        }
                        currency={results.currency}
                        mode="depart"
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
                    )}
                  </div>
                )}
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
                    className="flex items-center gap-1.5 px-4 py-2 bg-white border border-(--color-tertiary-button) rounded-full text-sm font-semibold text-(--color-foreground) hover:border-(--color-links) hover:text-(--color-links)"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Filters
                    {hasActiveFilters && (
                      <span className="w-2 h-2 bg-(--color-links) rounded-full" />
                    )}
                  </button>
                </div>

                {/* Flight cards */}
                {isRoundTrip ? (
                  filteredFlights.length > 0 || filteredReturnFlights.length > 0 ? (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      <div>
                        <div className="sticky top-36 z-10 bg-(--color-background) pb-2 mb-2">
                          <div className="bg-white border border-(--color-tertiary-button) rounded-xl px-4 py-2.5 flex items-center justify-between">
                            <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                              Onward · {fromName || from} → {toName || to}
                            </div>
                            <div className="text-[11px] text-gray-500">
                              {filteredFlights.length} flights
                            </div>
                          </div>
                        </div>
                        {filteredFlights.length > 0 ? (
                          <div className="space-y-3">
                            {filteredFlights.map((flight) => (
                              <FlightCard
                                key={`o-${flight.index}`}
                                flight={flight}
                                currency={results.currency}
                                tui={results.tui}
                                tripType={tripType}
                                selectionMode
                                selected={selectedOnward?.index === flight.index}
                                onSelect={setSelectedOnward}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-(--color-tertiary-button) bg-white p-6 text-center text-sm text-(--color-inactive)">
                            No onward flights match your filters.
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="sticky top-36 z-10 bg-(--color-background) pb-2 mb-2">
                          <div className="bg-white border border-(--color-tertiary-button) rounded-xl px-4 py-2.5 flex items-center justify-between">
                            <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                              Return · {toName || to} → {fromName || from}
                            </div>
                            <div className="text-[11px] text-gray-500">
                              {filteredReturnFlights.length} flights
                            </div>
                          </div>
                        </div>
                        {filteredReturnFlights.length > 0 ? (
                          <div className="space-y-3">
                            {filteredReturnFlights.map((flight) => (
                              <FlightCard
                                key={`r-${flight.index}`}
                                flight={flight}
                                currency={results.currency}
                                tui={results.tui}
                                tripType={tripType}
                                selectionMode
                                selected={selectedReturn?.index === flight.index}
                                onSelect={setSelectedReturn}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-(--color-tertiary-button) bg-white p-6 text-center text-sm text-(--color-inactive)">
                            No return flights match your filters.
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <ResultsEmpty
                      icon={SlidersHorizontal}
                      title="No flights match your filters"
                      message="Try adjusting your filters to see more results."
                      action={hasActiveFilters ? { label: 'Clear all filters', onClick: clearFilters } : undefined}
                    />
                  )
                ) : filteredFlights.length > 0 ? (
                  <div className="space-y-3">
                    {filteredFlights.map((flight) => (
                      <FlightCard
                        key={flight.index}
                        flight={flight}
                        currency={results.currency}
                        tui={results.tui}
                        tripType={tripType}
                      />
                    ))}
                  </div>
                ) : (
                  <ResultsEmpty
                    icon={SlidersHorizontal}
                    title="No flights match your filters"
                    message="Try adjusting your filters to see more results."
                    action={hasActiveFilters ? { label: 'Clear all filters', onClick: clearFilters } : undefined}
                  />
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
