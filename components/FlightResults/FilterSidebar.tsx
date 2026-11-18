'use client';

import { useState } from 'react';
import { FilterCheckbox, FilterPanel, FilterSection, filterChip } from '@/components/Results/ui';
import type { FlightFacets } from '@/lib/flights-api';
import type { QueryParams } from '@/lib/results-api';
import type { SortOption } from './SortTabs';

/**
 * Selected flight filters. Filtering itself happens on the server
 * (GET /flights/results/:id); this state only becomes query params.
 */
export interface FilterState {
  stops: Set<number>;
  departureTimeRanges: Set<string>;
  arrivalTimeRanges: Set<string>;
  airlines: Set<string>;
  connectingAirports: Set<string>;
  /** null = no price cap. */
  maxPrice: number | null;
}

export function createEmptyFilterState(): FilterState {
  return {
    stops: new Set(),
    departureTimeRanges: new Set(),
    arrivalTimeRanges: new Set(),
    airlines: new Set(),
    connectingAirports: new Set(),
    maxPrice: null,
  };
}

export function hasActiveFlightFilters(f: FilterState): boolean {
  return (
    f.stops.size > 0 ||
    f.departureTimeRanges.size > 0 ||
    f.arrivalTimeRanges.size > 0 ||
    f.airlines.size > 0 ||
    f.connectingAirports.size > 0 ||
    f.maxPrice !== null
  );
}

/** Server query for the results endpoint (defaults left out). */
export function flightFilterQuery(f: FilterState, sort: SortOption): QueryParams {
  return {
    sort: sort === 'cheapest' ? undefined : sort,
    stops: [...f.stops],
    dep: [...f.departureTimeRanges],
    arr: [...f.arrivalTimeRanges],
    airlines: [...f.airlines],
    via: [...f.connectingAirports],
    maxPrice: f.maxPrice ?? undefined,
  };
}

interface FilterSidebarProps {
  facets: FlightFacets;
  filterState: FilterState;
  onFilterChange: (state: FilterState) => void;
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
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    key: 'afternoon',
    label: '12pm - 6pm',
    subLabel: 'Afternoon',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m-7.07-2.93l.707-.707m10.728 0l.707.707M3 12h1m16 0h1M7.757 7.757l-.707-.707m10.486 0l.707-.707M16 12a4 4 0 01-6.928 2A4 4 0 0116 12z" />
      </svg>
    ),
  },
  {
    key: 'night',
    label: '11pm - 05am',
    subLabel: 'Night',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    ),
  },
];

const toggleSetValue = <T,>(set: Set<T>, value: T): Set<T> => {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
};

/** Renders the server's facets; every change is sent back to the server. */
export const FilterSidebar = ({
  facets,
  filterState,
  onFilterChange,
  nearbyAirports,
  onNearbyAirportsChange,
}: FilterSidebarProps) => {
  const [showAllAirlines, setShowAllAirlines] = useState(false);
  const [showAllAirports, setShowAllAirports] = useState(false);

  const visibleAirlines = showAllAirlines ? facets.airlines : facets.airlines.slice(0, 5);
  const visibleAirports = showAllAirports ? facets.connectingAirports : facets.connectingAirports.slice(0, 5);
  const sliderValue = filterState.maxPrice ?? facets.maxPrice;

  return (
    <FilterPanel>
      {/* Stops */}
      <FilterSection title="Stops">
        <div className="flex gap-2">
          {facets.stops.map(({ stops, cheapest }) => {
            const isActive = filterState.stops.has(stops);
            const label = stops === 0 ? 'Non-Stop' : stops === 1 ? '1 Stop' : '2+ Stops';
            return (
              <button
                key={stops}
                type="button"
                aria-pressed={isActive}
                onClick={() => onFilterChange({ ...filterState, stops: toggleSetValue(filterState.stops, stops) })}
                className={`flex-1 ${filterChip(isActive)}`}
              >
                <div>{label}</div>
                <div className="mt-0.5 text-[10px] font-medium">{formatCurrency(cheapest)}</div>
              </button>
            );
          })}
        </div>
      </FilterSection>

      {/* No "Refundable flights only" filter: it keyed off Benzy's yes/no
          Refundable flag, which can contradict the airline's fare rules. */}

      {/* Nearby Airports */}
      <FilterSection title="Nearby Airports" hint="Search nearby airports to find more flight options">
        <FilterCheckbox
          checked={nearbyAirports}
          onChange={() => onNearbyAirportsChange(!nearbyAirports)}
          label="Include nearby airports"
        />
      </FilterSection>

      {/* Departure Times */}
      <FilterSection title="Departure Times" hint={`From ${facets.fromLabel || 'Origin'}`}>
        <div className="grid grid-cols-2 gap-2">
          {TIME_RANGES.map((tr) => {
            const isActive = filterState.departureTimeRanges.has(tr.key);
            return (
              <button
                key={tr.key}
                type="button"
                aria-pressed={isActive}
                onClick={() =>
                  onFilterChange({
                    ...filterState,
                    departureTimeRanges: toggleSetValue(filterState.departureTimeRanges, tr.key),
                  })
                }
                className={`flex items-center justify-center gap-1.5 ${filterChip(isActive)}`}
              >
                {tr.icon}
                <span>{tr.label}</span>
              </button>
            );
          })}
        </div>
      </FilterSection>

      {/* Arrival Times */}
      <FilterSection title="Arrival Times" hint={`At ${facets.toLabel || 'Destination'}`}>
        <div className="grid grid-cols-2 gap-2">
          {TIME_RANGES.map((tr) => {
            const isActive = filterState.arrivalTimeRanges.has(tr.key);
            return (
              <button
                key={tr.key}
                type="button"
                aria-pressed={isActive}
                onClick={() =>
                  onFilterChange({
                    ...filterState,
                    arrivalTimeRanges: toggleSetValue(filterState.arrivalTimeRanges, tr.key),
                  })
                }
                className={`flex items-center justify-center gap-1.5 ${filterChip(isActive)}`}
              >
                {tr.icon}
                <span>{tr.label}</span>
              </button>
            );
          })}
        </div>
      </FilterSection>

      {/* Airlines */}
      {facets.airlines.length > 0 && (
        <FilterSection title="Airlines">
          {visibleAirlines.map((airline) => (
            <FilterCheckbox
              key={airline.code}
              checked={filterState.airlines.has(airline.code)}
              onChange={() =>
                onFilterChange({ ...filterState, airlines: toggleSetValue(filterState.airlines, airline.code) })
              }
              label={
                <span className="block truncate">
                  {airline.name} <span className="text-(--color-inactive)">({airline.count})</span>
                </span>
              }
              meta={formatCurrency(airline.cheapest)}
            />
          ))}
          {facets.airlines.length > 5 && (
            <button
              type="button"
              onClick={() => setShowAllAirlines(!showAllAirlines)}
              className="mt-2 text-xs font-bold text-(--color-links) hover:underline"
            >
              {showAllAirlines ? 'Show less' : `+ ${facets.airlines.length - 5} Airlines`}
            </button>
          )}
        </FilterSection>
      )}

      {/* Price Range */}
      {facets.maxPrice > facets.minPrice && (
        <FilterSection title="Price Range">
          <input
            type="range"
            aria-label="Maximum price"
            min={facets.minPrice}
            max={facets.maxPrice}
            value={sliderValue}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              onFilterChange({ ...filterState, maxPrice: v >= facets.maxPrice ? null : v });
            }}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-(--color-links)"
          />
          <div className="mt-2 flex items-center justify-between text-xs text-(--color-inactive)">
            <span>{formatCurrency(facets.minPrice)}</span>
            <span className="font-semibold text-(--color-foreground)">{formatCurrency(sliderValue)}</span>
          </div>
        </FilterSection>
      )}

      {/* Connecting Airports */}
      {facets.connectingAirports.length > 0 && (
        <FilterSection title="Connecting Airports">
          {visibleAirports.map((ap) => (
            <FilterCheckbox
              key={ap.code}
              checked={filterState.connectingAirports.has(ap.code)}
              onChange={() =>
                onFilterChange({
                  ...filterState,
                  connectingAirports: toggleSetValue(filterState.connectingAirports, ap.code),
                })
              }
              label={<span className="block truncate">{ap.name}</span>}
            />
          ))}
          {facets.connectingAirports.length > 5 && (
            <button
              type="button"
              onClick={() => setShowAllAirports(!showAllAirports)}
              className="mt-2 text-xs font-bold text-(--color-links) hover:underline"
            >
              {showAllAirports ? 'Show less' : `+ ${facets.connectingAirports.length - 5} Airports`}
            </button>
          )}
        </FilterSection>
      )}
    </FilterPanel>
  );
};
