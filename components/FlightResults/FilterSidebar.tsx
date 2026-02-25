'use client';

import { useMemo, useState } from 'react';
import type { FlightResult } from '@/lib/flights-api';

export interface FilterState {
  stops: Set<number>;
  refundableOnly: boolean;
  departureTimeRanges: Set<string>;
  arrivalTimeRanges: Set<string>;
  airlines: Set<string>;
  priceRange: [number, number];
  connectingAirports: Set<string>;
}

interface FilterSidebarProps {
  flights: FlightResult[];
  filterState: FilterState;
  onFilterChange: (state: FilterState) => void;
  currency: string;
  nearbyAirports: boolean;
  onNearbyAirportsChange: (value: boolean) => void;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

type TimeRange = 'morning' | 'afternoon' | 'evening' | 'night';

const TIME_RANGES: { key: TimeRange; label: string; subLabel: string; icon: React.ReactNode }[] = [
  {
    key: 'morning',
    label: '05am - 12pm',
    subLabel: 'Morning',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    key: 'afternoon',
    label: '12pm - 6pm',
    subLabel: 'Afternoon',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="5" />
        <path stroke="currentColor" strokeWidth={2} d="M12 1v2m0 18v2m11-11h-2M4 12H2m17.07 7.07l-1.41-1.41M6.34 6.34L4.93 4.93m14.14 0l-1.41 1.41M6.34 17.66l-1.41 1.41" />
      </svg>
    ),
  },
  {
    key: 'evening',
    label: '6pm - 11pm',
    subLabel: 'Evening',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m-7.07-2.93l.707-.707m10.728 0l.707.707M3 12h1m16 0h1M7.757 7.757l-.707-.707m10.486 0l.707-.707M16 12a4 4 0 01-6.928 2A4 4 0 0116 12z" />
      </svg>
    ),
  },
  {
    key: 'night',
    label: '11pm - 05am',
    subLabel: 'Night',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    ),
  },
];

function getTimeRange(isoTime: string): TimeRange {
  const hour = new Date(isoTime).getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 23) return 'evening';
  return 'night';
}

export const FilterSidebar = ({
  flights,
  filterState,
  onFilterChange,
  currency,
  nearbyAirports,
  onNearbyAirportsChange,
}: FilterSidebarProps) => {
  const [showAllAirlines, setShowAllAirlines] = useState(false);
  const [showAllAirports, setShowAllAirports] = useState(false);

  // Compute filter options from all flights
  const filterData = useMemo(() => {
    const stopsMap = new Map<number, number>();
    const airlineMap = new Map<string, { name: string; count: number; cheapest: number }>();
    const connectingMap = new Map<string, { name: string; count: number }>();
    let minPrice = Infinity;
    let maxPrice = 0;
    let hasRefundable = false;
    let hasNonRefundable = false;

    for (const f of flights) {
      // Stops with cheapest price
      const stopKey = Math.min(f.stops, 2);
      const existing = stopsMap.get(stopKey) ?? Infinity;
      stopsMap.set(stopKey, Math.min(existing, f.grossFare));

      // Airlines
      const airline = airlineMap.get(f.airlineCode);
      if (airline) {
        airline.count++;
        airline.cheapest = Math.min(airline.cheapest, f.grossFare);
      } else {
        airlineMap.set(f.airlineCode, {
          name: f.airlineName,
          count: 1,
          cheapest: f.grossFare,
        });
      }

      // Connecting airports
      if (f.connections) {
        for (const c of f.connections) {
          const ap = connectingMap.get(c.airport);
          if (ap) {
            ap.count++;
          } else {
            connectingMap.set(c.airport, { name: c.airportName || c.airport, count: 1 });
          }
        }
      }

      // Price range
      minPrice = Math.min(minPrice, f.grossFare);
      maxPrice = Math.max(maxPrice, f.grossFare);

      // Refundable
      if (f.refundable) hasRefundable = true;
      else hasNonRefundable = true;
    }

    const stops = Array.from(stopsMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([stops, cheapest]) => ({ stops, cheapest }));

    const airlines = Array.from(airlineMap.entries())
      .map(([code, data]) => ({ code, ...data }))
      .sort((a, b) => a.cheapest - b.cheapest);

    const connectingAirports = Array.from(connectingMap.entries())
      .map(([code, data]) => ({ code, ...data }))
      .sort((a, b) => b.count - a.count);

    return {
      stops,
      airlines,
      connectingAirports,
      minPrice: minPrice === Infinity ? 0 : minPrice,
      maxPrice,
      showRefundableFilter: hasRefundable && hasNonRefundable,
    };
  }, [flights]);

  const toggleSetValue = <T,>(set: Set<T>, value: T): Set<T> => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  };

  const visibleAirlines = showAllAirlines
    ? filterData.airlines
    : filterData.airlines.slice(0, 5);

  const visibleAirports = showAllAirports
    ? filterData.connectingAirports
    : filterData.connectingAirports.slice(0, 5);

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200">
        <h2 className="text-base font-bold text-gray-900">Filters</h2>
      </div>

      <div className="divide-y divide-gray-100">
        {/* Stops */}
        <div className="px-4 py-4">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Stops</h3>
          <div className="flex gap-2">
            {filterData.stops.map(({ stops, cheapest }) => {
              const isActive = filterState.stops.has(stops);
              const label = stops === 0 ? 'Non-Stop' : stops === 1 ? '1 Stop' : '2+ Stops';
              return (
                <button
                  key={stops}
                  type="button"
                  onClick={() =>
                    onFilterChange({
                      ...filterState,
                      stops: toggleSetValue(filterState.stops, stops),
                    })
                  }
                  className={`flex-1 px-2 py-2 rounded-lg border text-center transition-colors ${
                    isActive
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <div className="text-xs font-semibold">{label}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    {formatCurrency(cheapest)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Fare Type */}
        <div className="px-4 py-4">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Fare Type</h3>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filterState.refundableOnly}
              onChange={() =>
                onFilterChange({
                  ...filterState,
                  refundableOnly: !filterState.refundableOnly,
                })
              }
              className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Refundable flights only</span>
          </label>
        </div>

        {/* Nearby Airports */}
        <div className="px-4 py-4">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Nearby Airports</h3>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={nearbyAirports}
              onChange={() => onNearbyAirportsChange(!nearbyAirports)}
              className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Include nearby airports</span>
          </label>
          <p className="text-[10px] text-gray-400 mt-1.5">
            Search nearby airports to find more flight options
          </p>
        </div>

        {/* Departure Times */}
        <div className="px-4 py-4">
          <h3 className="text-sm font-bold text-gray-900 mb-1">Departure Times</h3>
          <p className="text-[10px] text-gray-400 mb-3">
            From {flights[0]?.fromName || flights[0]?.from || 'Origin'}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {TIME_RANGES.map((tr) => {
              const isActive = filterState.departureTimeRanges.has(tr.key);
              return (
                <button
                  key={tr.key}
                  type="button"
                  onClick={() =>
                    onFilterChange({
                      ...filterState,
                      departureTimeRanges: toggleSetValue(filterState.departureTimeRanges, tr.key),
                    })
                  }
                  className={`flex items-center gap-1.5 px-2 py-2 rounded-lg border text-xs transition-colors ${
                    isActive
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {tr.icon}
                  <span className="font-medium">{tr.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Arrival Times */}
        <div className="px-4 py-4">
          <h3 className="text-sm font-bold text-gray-900 mb-1">Arrival Times</h3>
          <p className="text-[10px] text-gray-400 mb-3">
            At {flights[0]?.toName || flights[0]?.to || 'Destination'}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {TIME_RANGES.map((tr) => {
              const isActive = filterState.arrivalTimeRanges.has(tr.key);
              return (
                <button
                  key={tr.key}
                  type="button"
                  onClick={() =>
                    onFilterChange({
                      ...filterState,
                      arrivalTimeRanges: toggleSetValue(filterState.arrivalTimeRanges, tr.key),
                    })
                  }
                  className={`flex items-center gap-1.5 px-2 py-2 rounded-lg border text-xs transition-colors ${
                    isActive
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {tr.icon}
                  <span className="font-medium">{tr.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Airlines */}
        {filterData.airlines.length > 0 && (
          <div className="px-4 py-4">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Airlines</h3>
            <div className="space-y-2">
              {visibleAirlines.map((airline) => {
                const isActive = filterState.airlines.has(airline.code);
                return (
                  <label key={airline.code} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={() =>
                        onFilterChange({
                          ...filterState,
                          airlines: toggleSetValue(filterState.airlines, airline.code),
                        })
                      }
                      className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="flex-1 text-sm text-gray-700 truncate">
                      {airline.name}{' '}
                      <span className="text-gray-400">({airline.count})</span>
                    </span>
                    <span className="text-xs text-gray-500 font-medium flex-shrink-0">
                      {formatCurrency(airline.cheapest)}
                    </span>
                  </label>
                );
              })}
            </div>
            {filterData.airlines.length > 5 && (
              <button
                type="button"
                onClick={() => setShowAllAirlines(!showAllAirlines)}
                className="text-xs text-blue-600 font-medium mt-2 hover:underline"
              >
                {showAllAirlines
                  ? 'Show less'
                  : `+ ${filterData.airlines.length - 5} Airlines`}
              </button>
            )}
          </div>
        )}

        {/* Price Range */}
        <div className="px-4 py-4">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Price Range</h3>
          <div className="space-y-3">
            <input
              type="range"
              min={filterData.minPrice}
              max={filterData.maxPrice}
              value={filterState.priceRange[1]}
              onChange={(e) =>
                onFilterChange({
                  ...filterState,
                  priceRange: [filterState.priceRange[0], parseInt(e.target.value)],
                })
              }
              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{formatCurrency(filterData.minPrice)}</span>
              <span>{formatCurrency(filterState.priceRange[1])}</span>
            </div>
          </div>
        </div>

        {/* Connecting Airports */}
        {filterData.connectingAirports.length > 0 && (
          <div className="px-4 py-4">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Connecting Airports</h3>
            <div className="space-y-2">
              {visibleAirports.map((ap) => {
                const isActive = filterState.connectingAirports.has(ap.code);
                return (
                  <label key={ap.code} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={() =>
                        onFilterChange({
                          ...filterState,
                          connectingAirports: toggleSetValue(
                            filterState.connectingAirports,
                            ap.code,
                          ),
                        })
                      }
                      className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="flex-1 text-sm text-gray-700 truncate">{ap.name}</span>
                  </label>
                );
              })}
            </div>
            {filterData.connectingAirports.length > 5 && (
              <button
                type="button"
                onClick={() => setShowAllAirports(!showAllAirports)}
                className="text-xs text-blue-600 font-medium mt-2 hover:underline"
              >
                {showAllAirports
                  ? 'Show less'
                  : `+ ${filterData.connectingAirports.length - 5} Airports`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export { getTimeRange };
