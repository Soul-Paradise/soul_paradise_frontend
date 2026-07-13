'use client';

import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, Search } from 'lucide-react';
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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [mounted, setMounted] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);

  useEffect(() => setMounted(true), []);

  // Position the portalled dropdown right under the trigger. Recomputed on
  // open and while open on any scroll/resize so it tracks the field even when
  // the field lives inside a scrollable container (e.g. the multi-city list).
  useLayoutEffect(() => {
    if (!isOpen) {
      // Clear the stale position so the portal never renders a frame at the
      // previous field's coordinates (which read as an overlap on reopen).
      setDropdownPos(null);
      return;
    }
    const updatePosition = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setDropdownPos({ top: rect.bottom, left: rect.left, width: rect.width });
      }
    };
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

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
      const target = e.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        !(dropdownRef.current && dropdownRef.current.contains(target))
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus the search input once the portalled dropdown has actually mounted.
  // (A plain [isOpen] effect fires before the portal renders, so inputRef is
  // still null and the focus is silently dropped.)
  useEffect(() => {
    if (isOpen && dropdownPos && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, dropdownPos]);

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
        className={`w-full text-left pl-6 py-3 transition-all min-h-[80px]`}
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

      {/* Dropdown — portalled to <body> and fixed-positioned so it is never
          clipped by a scrollable ancestor (e.g. the multi-city leg list). */}
      {isOpen && mounted && dropdownPos && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: dropdownPos.top + 4,
            left: dropdownPos.left,
            width: dropdownPos.width,
          }}
          className="z-[100] bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden"
        >
          {/* Search input */}
          <div className="p-3 border-b border-gray-100">
            <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  handleSearch(e.target.value);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Enter city or airport name..."
                className="flex-1 outline-none text-sm text-gray-800 placeholder-gray-400"
              />
            </div>
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
                className={`w-full text-left px-4 py-3 flex items-start gap-3 border-b border-gray-50 last:border-0 ${
                  index === highlightIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
              >
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-800 truncate">
                    {airport.cityName}, {airport.country}
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    {airport.name}
                  </div>
                </div>
                {airport.code && (
                  <span className="ml-auto text-xs text-gray-400 mt-0.5">{airport.code}</span>
                )}
              </button>
            ))}

            {!loading && query.length === 0 && (
              <div className="px-4 py-3 text-xs text-gray-400">
                Start typing to search airports
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
