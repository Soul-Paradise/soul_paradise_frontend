'use client';

import { useRef, useMemo, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { searchFlights, type FlightSearchParams } from '@/lib/flights-api';

interface DateStripProps {
  departDate: string;
  cheapestPrice: number | null;
  currency: string;
  searchParams: {
    from: string;
    to: string;
    adults: number;
    children: number;
    infants: number;
    cabin: FlightSearchParams['cabin'];
    tripType: FlightSearchParams['tripType'];
    directOnly: boolean;
    refundableOnly: boolean;
    nearbyAirports: boolean;
  };
}

function formatStripDate(date: Date) {
  const day = date.toLocaleDateString('en-IN', { weekday: 'short' });
  const dayNum = date.getDate().toString().padStart(2, '0');
  const month = date.toLocaleDateString('en-IN', { month: 'short' });
  return `${day}, ${dayNum} ${month}`;
}

function toDateString(date: Date) {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export const DateStrip = ({
  departDate,
  cheapestPrice,
  currency,
  searchParams: sp,
}: DateStripProps) => {
  const router = useRouter();
  const urlParams = useSearchParams();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [datePrices, setDatePrices] = useState<Record<string, number | 'loading' | null>>({});

  const dates = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const base = new Date(departDate + 'T00:00:00');
    const start = new Date(base);
    start.setDate(start.getDate() - 3);
    if (start < today) start.setTime(today.getTime());
    const result: { date: Date; dateStr: string; label: string; isSelected: boolean }[] = [];
    for (let i = 0; i < 8; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const dateStr = toDateString(d);
      result.push({
        date: d,
        dateStr,
        label: formatStripDate(d),
        isSelected: dateStr === departDate,
      });
    }
    return result;
  }, [departDate]);

  // Fetch prices for surrounding dates in background
  useEffect(() => {
    let cancelled = false;
    const surroundingDates = dates
      .filter((d) => !d.isSelected)
      .map((d) => d.dateStr);

    // Mark all as loading
    const initial: Record<string, 'loading'> = {};
    for (const ds of surroundingDates) {
      initial[ds] = 'loading';
    }
    setDatePrices(initial);

    // Fetch each date in parallel
    for (const dateStr of surroundingDates) {
      searchFlights({
        from: sp.from,
        to: sp.to,
        departDate: dateStr,
        adults: sp.adults,
        children: sp.children,
        infants: sp.infants,
        cabin: sp.cabin,
        tripType: sp.tripType,
        directOnly: sp.directOnly,
        refundableOnly: sp.refundableOnly,
        nearbyAirports: sp.nearbyAirports,
      })
        .then((res) => {
          if (cancelled) return;
          if (res.flights.length > 0) {
            const cheapest = Math.min(...res.flights.map((f) => f.grossFare));
            setDatePrices((prev) => ({ ...prev, [dateStr]: cheapest }));
          } else {
            setDatePrices((prev) => ({ ...prev, [dateStr]: null }));
          }
        })
        .catch(() => {
          if (cancelled) return;
          setDatePrices((prev) => ({ ...prev, [dateStr]: null }));
        });
    }

    return () => {
      cancelled = true;
    };
  }, [departDate, sp.from, sp.to, sp.adults, sp.children, sp.infants, sp.cabin, sp.tripType, sp.directOnly, sp.refundableOnly, sp.nearbyAirports, dates]);

  const handleDateClick = (dateStr: string) => {
    if (dateStr === departDate) return;
    const params = new URLSearchParams(urlParams.toString());
    params.set('departDate', dateStr);
    router.push(`/booking/flights?${params.toString()}`);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const amount = direction === 'left' ? -200 : 200;
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  const renderPrice = (dateStr: string, isSelected: boolean) => {
    if (isSelected) {
      return cheapestPrice ? (
        <span className="font-semibold">{formatCurrency(cheapestPrice)}</span>
      ) : (
        '--'
      );
    }
    const price = datePrices[dateStr];
    if (price === 'loading') {
      return (
        <span className="inline-block w-3 h-3 border border-gray-300 border-t-gray-500 rounded-full animate-spin" />
      );
    }
    if (typeof price === 'number') {
      return <span className="font-semibold">{formatCurrency(price)}</span>;
    }
    return '--';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg flex items-center">
      {/* Left arrow */}
      <button
        type="button"
        onClick={() => scroll('left')}
        className="px-2 py-4 text-teal-600 hover:bg-gray-50 flex-shrink-0 border-r border-gray-200"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Dates */}
      <div ref={scrollRef} className="flex-1 flex overflow-x-auto scrollbar-hide">
        {dates.map((d) => (
          <button
            key={d.dateStr}
            type="button"
            onClick={() => handleDateClick(d.dateStr)}
            className={`flex-1 min-w-[120px] px-3 py-2.5 text-center border-r border-gray-100 last:border-r-0 transition-colors ${
              d.isSelected
                ? 'bg-gray-800 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <div
              className={`text-xs font-medium ${d.isSelected ? 'text-white' : 'text-gray-500'}`}
            >
              {d.label}
            </div>
            <div
              className={`text-xs mt-1 ${d.isSelected ? 'text-gray-200' : 'text-green-600'}`}
            >
              {renderPrice(d.dateStr, d.isSelected)}
            </div>
          </button>
        ))}
      </div>

      {/* Right arrow */}
      <button
        type="button"
        onClick={() => scroll('right')}
        className="px-2 py-4 text-teal-600 hover:bg-gray-50 flex-shrink-0 border-l border-gray-200"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
};
