'use client';

import { useState, useRef, useEffect } from 'react';

export interface AirlineOption {
  code: string;
  name: string;
}

export const AIRLINE_OPTIONS: AirlineOption[] = [
  { code: '6E', name: 'IndiGo' },
  { code: 'AI', name: 'Air India' },
  { code: 'SG', name: 'SpiceJet' },
  { code: 'UK', name: 'Vistara' },
  { code: 'IX', name: 'Air India Express' },
  { code: 'QP', name: 'Akasa Air' },
  { code: 'I5', name: 'AirAsia India' },
  { code: 'G8', name: 'Go First' },
  { code: 'EK', name: 'Emirates' },
  { code: 'EY', name: 'Etihad Airways' },
  { code: 'QR', name: 'Qatar Airways' },
  { code: 'SQ', name: 'Singapore Airlines' },
  { code: 'TG', name: 'Thai Airways' },
  { code: 'LH', name: 'Lufthansa' },
  { code: 'BA', name: 'British Airways' },
];

interface AirlineSelectorProps {
  selected: string[];
  onChange: (codes: string[]) => void;
}

export const AirlineSelector = ({
  selected,
  onChange,
}: AirlineSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const toggleAirline = (code: string) => {
    if (selected.includes(code)) {
      onChange(selected.filter((c) => c !== code));
    } else {
      onChange([...selected, code]);
    }
  };

  const getDisplayText = () => {
    if (selected.length === 0) return 'All Airlines';
    if (selected.length <= 2) {
      return selected
        .map((code) => AIRLINE_OPTIONS.find((a) => a.code === code)?.name ?? code)
        .join(', ');
    }
    return `${selected.length} Airlines`;
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`px-4 py-2 text-sm font-semibold rounded-full border-2 transition-all flex items-center gap-1.5 ${
          selected.length > 0
            ? 'border-(--color-links) bg-(--color-links) text-white'
            : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
        }`}
      >
        {getDisplayText()}
        <svg
          className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[240px] max-h-[320px] overflow-y-auto">
          {selected.length > 0 && (
            <div className="px-3 pb-2 mb-1 border-b border-gray-100">
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs font-medium text-(--color-links) hover:underline"
              >
                Clear all
              </button>
            </div>
          )}

          {AIRLINE_OPTIONS.map((airline) => (
            <label
              key={airline.code}
              className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.includes(airline.code)}
                onChange={() => toggleAirline(airline.code)}
                className="w-4 h-4 rounded border-gray-300 text-(--color-links) focus:ring-(--color-links)"
              />
              <span className="text-sm text-gray-700">{airline.name}</span>
              <span className="text-xs text-gray-400 ml-auto">
                {airline.code}
              </span>
            </label>
          ))}

          <div className="px-3 pt-2 mt-1 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full py-1.5 bg-(--color-links) text-white text-xs font-semibold rounded-md hover:opacity-90 transition-opacity"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
