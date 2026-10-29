'use client';

import { useMemo, useState } from 'react';
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
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200">
        <h2 className="text-base font-bold text-gray-900">Filters</h2>
      </div>

      <div className="divide-y divide-gray-100">
        {/* Plan type (e.g. Senior Citizen) - only when the results are split */}
        {filterData.categories.length > 1 && (
          <div className="px-4 py-4">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Plan Type</h3>
            <div className="flex gap-2">
              {filterData.categories.map(({ name, cheapest }) => {
                const isActive = filterState.categories.has(name);
                return (
                  <button
                    key={name || 'standard'}
                    type="button"
                    onClick={() => onFilterChange({ ...filterState, categories: toggle(filterState.categories, name) })}
                    className={`flex-1 px-2 py-2 rounded-lg border text-center transition-colors ${
                      isActive ? 'border-blue-500 bg-blue-50 text-(--color-secondary-button)' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-xs font-semibold">{name || 'Standard'}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{formatCurrency(cheapest)}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Claim limits */}
        {filterData.showSubLimitFilter && (
          <div className="px-4 py-4">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Claim Limits</h3>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filterState.noSubLimitsOnly}
                onChange={() => onFilterChange({ ...filterState, noSubLimitsOnly: !filterState.noSubLimitsOnly })}
                className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Plans without sub-limits only</span>
            </label>
            <p className="text-[10px] text-gray-400 mt-1.5">Sub-limits cap how much you can claim per benefit</p>
          </div>
        )}

        {/* Medical cover */}
        {filterData.bands.length > 0 && (
          <div className="px-4 py-4">
            <h3 className="text-sm font-bold text-gray-900 mb-1">Medical Cover</h3>
            <p className="text-[10px] text-gray-400 mb-3">Sum insured for medical emergencies abroad</p>
            <div className="grid grid-cols-2 gap-2">
              {filterData.bands.map((b) => {
                const isActive = filterState.coverBands.has(b.key);
                return (
                  <button
                    key={b.key}
                    type="button"
                    onClick={() => onFilterChange({ ...filterState, coverBands: toggle(filterState.coverBands, b.key) })}
                    className={`px-2 py-2 rounded-lg border text-center transition-colors ${
                      isActive ? 'border-blue-500 bg-blue-50 text-(--color-secondary-button)' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-xs font-medium whitespace-nowrap">{b.label}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{formatCurrency(b.cheapest)}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Insurers */}
        {filterData.insurers.length > 0 && (
          <div className="px-4 py-4">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Insurers</h3>
            <div className="space-y-2">
              {visibleInsurers.map((ins) => (
                <label key={ins.name} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filterState.insurers.has(ins.name)}
                    onChange={() => onFilterChange({ ...filterState, insurers: toggle(filterState.insurers, ins.name) })}
                    className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="flex-1 text-sm text-gray-700 truncate">
                    {ins.name} <span className="text-gray-400">({ins.count})</span>
                  </span>
                  <span className="text-xs text-gray-500 font-medium flex-shrink-0">{formatCurrency(ins.cheapest)}</span>
                </label>
              ))}
            </div>
            {filterData.insurers.length > 5 && (
              <button
                type="button"
                onClick={() => setShowAllInsurers(!showAllInsurers)}
                className="text-xs text-(--color-links) font-medium mt-2 hover:underline"
              >
                {showAllInsurers ? 'Show less' : `+ ${filterData.insurers.length - 5} Insurers`}
              </button>
            )}
          </div>
        )}

        {/* Price range */}
        {filterData.maxPrice > filterData.minPrice && (
          <div className="px-4 py-4">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Price Range</h3>
            <div className="space-y-3">
              <input
                type="range"
                min={filterData.minPrice}
                max={filterData.maxPrice}
                value={Math.min(filterState.maxPrice, filterData.maxPrice)}
                onChange={(e) => onFilterChange({ ...filterState, maxPrice: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{formatCurrency(filterData.minPrice)}</span>
                <span>{formatCurrency(Math.min(filterState.maxPrice, filterData.maxPrice))}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
