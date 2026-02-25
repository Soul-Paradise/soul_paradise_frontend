'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { searchAirports, type Airport } from '@/lib/flights-api';

interface AirportPickerProps {
  label: string;
  value: Airport | null;
  onChange: (airport: Airport) => void;
  placeholder?: string;
}

export const AirportPicker = ({
  label,
  value,
  onChange,
  placeholder = 'City or Airport',
}: AirportPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Airport[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleSearch = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 1) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchAirports(q, 8);
        setResults(data);
        setHighlightIndex(-1);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

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

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (airport: Airport) => {
    onChange(airport);
    setIsOpen(false);
    setQuery('');
    setResults([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && highlightIndex >= 0) {
      e.preventDefault();
      handleSelect(results[highlightIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative flex-1 min-w-0">
      {/* Display field */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`w-full text-left px-4 py-3 transition-all min-h-[80px] ${
          isOpen ? 'bg-blue-50/50' : 'bg-white hover:bg-gray-50'
        }`}
      >
        <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">
          {label}
        </div>
        {value ? (
          <div>
            <div className="text-xl font-bold text-gray-900 leading-tight">
              {value.cityName}
            </div>
            <div className="text-xs text-gray-500 truncate mt-0.5">
              {value.code}, {value.name}
            </div>
          </div>
        ) : (
          <div className="text-gray-400 text-sm mt-1">{placeholder}</div>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
          {/* Search input */}
          <div className="p-3 border-b border-gray-100">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                handleSearch(e.target.value);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Type city or airport name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-(--color-links) focus:border-(--color-links) outline-none"
            />
          </div>

          {/* Results */}
          <div className="max-h-64 overflow-y-auto">
            {loading && (
              <div className="px-4 py-3 text-sm text-gray-400">
                Searching...
              </div>
            )}

            {!loading && query.length > 0 && results.length === 0 && (
              <div className="px-4 py-3 text-sm text-gray-400">
                No airports found
              </div>
            )}

            {results.map((airport, index) => (
              <button
                key={airport.code}
                type="button"
                onClick={() => handleSelect(airport)}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                  index === highlightIndex
                    ? 'bg-blue-50'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
                  {airport.code}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">
                    {airport.cityName}, {airport.country}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {airport.name}
                  </div>
                </div>
              </button>
            ))}

            {!loading && query.length === 0 && (
              <div className="px-4 py-3 text-xs text-gray-400">
                Start typing to search airports
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
