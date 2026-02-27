'use client';

import { useState, useRef, useEffect } from 'react';

export interface TravellerCounts {
  adults: number;
  children: number;
  infants: number;
}

export type CabinClass = 'E' | 'PE' | 'B' | 'F';

interface TravellerSelectorProps {
  travellers: TravellerCounts;
  cabinClass: CabinClass;
  onTravellersChange: (t: TravellerCounts) => void;
  onCabinChange: (c: CabinClass) => void;
}

const CABIN_LABELS: Record<CabinClass, string> = {
  E: 'Economy',
  PE: 'Premium Economy',
  B: 'Business',
  F: 'First Class',
};

export const TravellerSelector = ({
  travellers,
  cabinClass,
  onTravellersChange,
  onCabinChange,
}: TravellerSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalPax = travellers.adults + travellers.children + travellers.infants;

  // Click outside to close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const updateCount = (
    type: keyof TravellerCounts,
    delta: number,
  ) => {
    const newCounts = { ...travellers };
    newCounts[type] = Math.max(0, newCounts[type] + delta);

    // Enforce constraints
    if (newCounts.adults < 1) newCounts.adults = 1;
    if (newCounts.adults > 9) newCounts.adults = 9;
    if (newCounts.children > 8) newCounts.children = 8;
    if (newCounts.infants > newCounts.adults)
      newCounts.infants = newCounts.adults;
    if (newCounts.adults + newCounts.children + newCounts.infants > 9) return;

    onTravellersChange(newCounts);
  };

  const Stepper = ({
    label,
    subtitle,
    value,
    type,
    minVal,
  }: {
    label: string;
    subtitle: string;
    value: number;
    type: keyof TravellerCounts;
    minVal: number;
  }) => (
    <div className="flex items-center justify-between py-3">
      <div>
        <div className="text-sm font-semibold text-gray-900">{label}</div>
        <div className="text-xs text-gray-500">{subtitle}</div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => updateCount(type, -1)}
          disabled={value <= minVal}
          className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:border-(--color-links) hover:text-(--color-links) disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <span className="w-6 text-center font-bold text-gray-900">
          {value}
        </span>
        <button
          type="button"
          onClick={() => updateCount(type, 1)}
          disabled={totalPax >= 9}
          className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:border-(--color-links) hover:text-(--color-links) disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  );

  return (
    <div ref={containerRef} className="relative flex-1 min-w-0">
      {/* Display field */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left px-4 py-3 transition-all min-h-[80px]`}
      >
        <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">
          Travellers & Class
        </div>
        <div className="text-xl font-bold text-gray-900 leading-tight">
          {totalPax}{' '}
          <span className="text-base font-normal">
            {totalPax === 1 ? 'Traveller' : 'Travellers'}
          </span>
        </div>
        <div className="text-xs text-gray-500">{CABIN_LABELS[cabinClass]}</div>
      </button>

      {/* Popup */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 p-4 min-w-[280px]">
          {/* Passenger counts */}
          <div className="divide-y divide-gray-100">
            <Stepper
              label="Adults"
              subtitle="12+ years"
              value={travellers.adults}
              type="adults"
              minVal={1}
            />
            <Stepper
              label="Children"
              subtitle="2-11 years"
              value={travellers.children}
              type="children"
              minVal={0}
            />
            <Stepper
              label="Infants"
              subtitle="Under 2 years"
              value={travellers.infants}
              type="infants"
              minVal={0}
            />
          </div>

          {/* Cabin class */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Travel Class
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(
                Object.entries(CABIN_LABELS) as [CabinClass, string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => onCabinChange(key)}
                  className={`px-3 py-2 text-xs font-medium rounded-md border-2 transition-all ${
                    cabinClass === key
                      ? 'border-(--color-links) bg-blue-50 text-(--color-links)'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Done button */}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="mt-4 w-full py-2 bg-(--color-links) text-white text-sm font-semibold rounded-md hover:opacity-90 transition-opacity"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
};
