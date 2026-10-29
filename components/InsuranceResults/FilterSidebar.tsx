'use client';

import { useMemo, useState } from 'react';
import { FilterCheckbox, FilterPanel, FilterSection, filterChip } from '@/components/Results/ui';
import type { InsuranceQuote, QuotesResponse } from '@/lib/insurance-api';

// Visual twin of components/FlightResults/FilterSidebar.tsx - keep the two in step.

export interface InsuranceFilterState {
  coverBands: Set<string>;
  noSubLimitsOnly: boolean;
  categories: Set<string>;
  insurers: Set<string>;
  maxPrice: number;
}

export function createEmptyInsuranceFilters(maxPrice: number): InsuranceFilterState {
  return {
    coverBands: new Set(),
    noSubLimitsOnly: false,
    categories: new Set(),
    insurers: new Set(),
    maxPrice: maxPrice || 999999,
  };
}

export function bandKey(b: { currency: string; min: number; max: number }) {
  return `${b.currency}:${b.min}-${b.max}`;
}

export function quoteInBand(q: InsuranceQuote, key: string) {
  const [currency, range] = key.split(':');
  const [min, max] = range.split('-').map(Number);
  return q.coverage.currency === currency && q.coverage.amount >= min && q.coverage.amount <= max;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

function compact(n: number) {
  if (n >= 1_000_000) return `${n / 1_000_000}M`;
  if (n >= 1_000) return `${n / 1_000}K`;
  return String(n);
}

const toggle = <T,>(set: Set<T>, value: T): Set<T> => {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
};

interface Props {
  data: QuotesResponse;
  filterState: InsuranceFilterState;
  onFilterChange: (s: InsuranceFilterState) => void;
}

export const InsuranceFilterSidebar = ({ data, filterState, onFilterChange }: Props) => {
  const [showAllInsurers, setShowAllInsurers] = useState(false);

  const filterData = useMemo(() => {
    const quotes = data.quotes;
    const insurerMap = new Map<string, { count: number; cheapest: number }>();
    const categoryMap = new Map<string, number>();
    let minPrice = Infinity;
    let maxPrice = 0;
    let withSub = false;
    let withoutSub = false;

    for (const q of quotes) {
      const ins = insurerMap.get(q.providerLabel);
      if (ins) {
        ins.count++;
        ins.cheapest = Math.min(ins.cheapest, q.price);
      } else {
        insurerMap.set(q.providerLabel, { count: 1, cheapest: q.price });
      }
      categoryMap.set(q.category, Math.min(categoryMap.get(q.category) ?? Infinity, q.price));
      minPrice = Math.min(minPrice, q.price);
      maxPrice = Math.max(maxPrice, q.price);
      if (q.isWithSubLimits) withSub = true;
      else withoutSub = true;
    }

    const bands = data.coverageBands
      .map((b) => {
        const key = bandKey(b);
        const inBand = quotes.filter((q) => quoteInBand(q, key));
        return { key, label: `${b.currency} ${compact(b.min)} - ${compact(b.max)}`, cheapest: Math.min(...inBand.map((q) => q.price)) };
      })
      .filter((b) => Number.isFinite(b.cheapest));

    return {
      bands,
      insurers: [...insurerMap].map(([name, d]) => ({ name, ...d })).sort((a, b) => a.cheapest - b.cheapest),
      categories: [...categoryMap].map(([name, cheapest]) => ({ name, cheapest })),
      minPrice: minPrice === Infinity ? 0 : minPrice,
      maxPrice,
      showSubLimitFilter: withSub && withoutSub,
    };
  }, [data]);

  const visibleInsurers = showAllInsurers ? filterData.insurers : filterData.insurers.slice(0, 5);

  return (
    <FilterPanel>
      {/* Plan type (e.g. Senior Citizen) - only when the results are split */}
      {filterData.categories.length > 1 && (
        <FilterSection title="Plan Type">
          <div className="flex gap-2">
            {filterData.categories.map(({ name, cheapest }) => (
              <button
                key={name || 'standard'}
                type="button"
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
      {filterData.showSubLimitFilter && (
        <FilterSection title="Claim Limits" hint="Sub-limits cap how much you can claim per benefit">
          <FilterCheckbox
            checked={filterState.noSubLimitsOnly}
            onChange={() => onFilterChange({ ...filterState, noSubLimitsOnly: !filterState.noSubLimitsOnly })}
            label="Plans without sub-limits only"
          />
        </FilterSection>
      )}

      {/* Medical cover */}
      {filterData.bands.length > 0 && (
        <FilterSection title="Medical Cover" hint="Sum insured for medical emergencies abroad">
          <div className="grid grid-cols-2 gap-2">
            {filterData.bands.map((b) => (
              <button
                key={b.key}
                type="button"
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
      {filterData.insurers.length > 0 && (
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
          {filterData.insurers.length > 5 && (
            <button
              type="button"
              onClick={() => setShowAllInsurers(!showAllInsurers)}
              className="mt-2 text-xs font-bold text-(--color-links) hover:underline"
            >
              {showAllInsurers ? 'Show less' : `+ ${filterData.insurers.length - 5} Insurers`}
            </button>
          )}
        </FilterSection>
      )}

      {/* Price range */}
      {filterData.maxPrice > filterData.minPrice && (
        <FilterSection title="Price Range">
          <input
            type="range"
            min={filterData.minPrice}
            max={filterData.maxPrice}
            value={Math.min(filterState.maxPrice, filterData.maxPrice)}
            onChange={(e) => onFilterChange({ ...filterState, maxPrice: parseInt(e.target.value) })}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-(--color-links)"
          />
          <div className="mt-2 flex items-center justify-between text-xs text-(--color-inactive)">
            <span>{formatCurrency(filterData.minPrice)}</span>
            <span className="font-semibold text-(--color-foreground)">
              {formatCurrency(Math.min(filterState.maxPrice, filterData.maxPrice))}
            </span>
          </div>
        </FilterSection>
      )}
    </FilterPanel>
  );
};
