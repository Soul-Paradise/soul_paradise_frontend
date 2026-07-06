'use client';

import type { FlightResult } from '@/lib/flights-api';

interface MultiCitySelectionBarProps {
  legs: Array<{ from: string; to: string }>;
  selected: Array<FlightResult | null>;
  currency: string;
  onBook: () => void;
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency || 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export const MultiCitySelectionBar = ({
  legs,
  selected,
  currency,
  onBook,
}: MultiCitySelectionBarProps) => {
  const selectedCount = selected.filter(Boolean).length;
  const canBook = selectedCount === legs.length && legs.length > 0;
  const total = selected.reduce((sum, f) => sum + (f?.grossFare || 0), 0);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
        <div className="flex-1 flex items-center gap-2 overflow-x-auto min-w-0">
          {legs.map((leg, i) => (
            <div
              key={i}
              className={`flex-shrink-0 flex items-center gap-2 border rounded-lg px-3 py-1.5 ${
                selected[i] ? 'border-green-300 bg-green-50' : 'border-dashed border-gray-300 bg-white'
              }`}
            >
              <span className="text-[11px] font-bold text-gray-500">{i + 1}</span>
              <div className="min-w-0">
                <div className="text-[12px] font-semibold text-gray-900 leading-tight whitespace-nowrap">
                  {leg.from} → {leg.to}
                </div>
                <div className="text-[11px] text-gray-500 leading-tight whitespace-nowrap">
                  {selected[i]
                    ? `${selected[i]!.airlineName.split('|')[0]} · ${formatCurrency(selected[i]!.grossFare, currency)}`
                    : 'Not selected'}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wide text-gray-400 leading-tight">
              Total ({selectedCount}/{legs.length})
            </div>
            <div className="text-xl font-bold text-gray-900 leading-tight">
              {canBook ? formatCurrency(total, currency) : '—'}
            </div>
          </div>
          <button
            type="button"
            onClick={onBook}
            disabled={!canBook}
            className="px-6 py-2.5 bg-red-500 text-white text-sm font-bold rounded hover:bg-red-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap"
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
};
