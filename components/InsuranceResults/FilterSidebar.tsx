'use client';

import { useState } from 'react';
import { FilterCheckbox, FilterPanel, FilterSection, filterChip } from '@/components/Results/ui';
import type { InsuranceFacets } from '@/lib/insurance-api';
import type { QueryParams } from '@/lib/results-api';
import type { InsuranceSortOption } from './SortTabs';

// Visual twin of components/FlightResults/FilterSidebar.tsx - keep the two in step.

/**
 * Selected insurance filters. Filtering happens on the server
 * (GET /insurance/results/:id); this state only becomes query params.
 */
export interface InsuranceFilterState {
  coverBands: Set<string>;
  noSubLimitsOnly: boolean;
  categories: Set<string>;
  insurers: Set<string>;
  /** null = no price cap. */
  maxPrice: number | null;
}

export function createEmptyInsuranceFilters(): InsuranceFilterState {
  return {
    coverBands: new Set(),
    noSubLimitsOnly: false,
    categories: new Set(),
    insurers: new Set(),
    maxPrice: null,
  };
}

export function hasActiveInsuranceFilters(f: InsuranceFilterState): boolean {
  return (
    f.categories.size > 0 ||
    f.insurers.size > 0 ||
    f.coverBands.size > 0 ||
    f.noSubLimitsOnly ||
    f.maxPrice !== null
  );
}

/** Server query for the results endpoint (defaults left out). */
export function insuranceFilterQuery(f: InsuranceFilterState, sort: InsuranceSortOption): QueryParams {
  return {
    sort: sort === 'cheapest' ? undefined : sort,
    categories: [...f.categories],
    insurers: [...f.insurers],
    coverBands: [...f.coverBands],
    noSubLimits: f.noSubLimitsOnly,
    maxPrice: f.maxPrice ?? undefined,
  };
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

const toggle = <T,>(set: Set<T>, value: T): Set<T> => {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
};

interface Props {
  facets: InsuranceFacets;
  filterState: InsuranceFilterState;
  onFilterChange: (s: InsuranceFilterState) => void;
}

/** Renders the server's facets; every change is sent back to the server. */
export const InsuranceFilterSidebar = ({ facets, filterState, onFilterChange }: Props) => {
  const [showAllInsurers, setShowAllInsurers] = useState(false);

  const visibleInsurers = showAllInsurers ? facets.insurers : facets.insurers.slice(0, 5);
  const sliderValue = filterState.maxPrice ?? facets.maxPrice;

  return (
    <FilterPanel>
      {/* Plan type (e.g. Senior Citizen) - only when the results are split */}
      {facets.categories.length > 1 && (
        <FilterSection title="Plan Type">
          <div className="flex gap-2">
            {facets.categories.map(({ name, cheapest }) => (
              <button
                key={name || 'standard'}
                type="button"
                aria-pressed={filterState.categories.has(name)}
                onClick={() => onFilterChange({ ...filterState, categories: toggle(filterState.categories, name) })}
                className={`flex-1 ${filterChip(filterState.categories.has(name))}`}
              >
                <div>{name || 'Standard'}</div>
                <div className="mt-0.5 text-[10px] font-medium opacity-70">{formatCurrency(cheapest)}</div>
              </button>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Claim limits */}
      {facets.showSubLimitFilter && (
        <FilterSection title="Claim Limits" hint="Sub-limits cap how much you can claim per benefit">
          <FilterCheckbox
            checked={filterState.noSubLimitsOnly}
            onChange={() => onFilterChange({ ...filterState, noSubLimitsOnly: !filterState.noSubLimitsOnly })}
            label="Plans without sub-limits only"
          />
        </FilterSection>
      )}

      {/* Medical cover */}
      {facets.bands.length > 0 && (
        <FilterSection title="Medical Cover" hint="Sum insured for medical emergencies abroad">
          <div className="grid grid-cols-2 gap-2">
            {facets.bands.map((b) => (
              <button
                key={b.key}
                type="button"
                aria-pressed={filterState.coverBands.has(b.key)}
                onClick={() => onFilterChange({ ...filterState, coverBands: toggle(filterState.coverBands, b.key) })}
                className={filterChip(filterState.coverBands.has(b.key))}
              >
                <div className="whitespace-nowrap">{b.label}</div>
                <div className="mt-0.5 text-[10px] font-medium opacity-70">{formatCurrency(b.cheapest)}</div>
              </button>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Insurers */}
      {facets.insurers.length > 0 && (
        <FilterSection title="Insurers">
          {visibleInsurers.map((ins) => (
            <FilterCheckbox
              key={ins.name}
              checked={filterState.insurers.has(ins.name)}
              onChange={() => onFilterChange({ ...filterState, insurers: toggle(filterState.insurers, ins.name) })}
              label={
                <span className="block truncate">
                  {ins.name} <span className="text-(--color-inactive)">({ins.count})</span>
                </span>
              }
              meta={formatCurrency(ins.cheapest)}
            />
          ))}
          {facets.insurers.length > 5 && (
            <button
              type="button"
              onClick={() => setShowAllInsurers(!showAllInsurers)}
              className="mt-2 text-xs font-bold text-(--color-links) hover:underline"
            >
              {showAllInsurers ? 'Show less' : `+ ${facets.insurers.length - 5} Insurers`}
            </button>
          )}
        </FilterSection>
      )}

      {/* Price range */}
      {facets.maxPrice > facets.minPrice && (
        <FilterSection title="Price Range">
          <input
            type="range"
            aria-label="Maximum premium"
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
    </FilterPanel>
  );
};
