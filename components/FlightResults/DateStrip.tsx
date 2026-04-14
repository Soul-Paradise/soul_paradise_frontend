'use client';

import { useRef, useMemo, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { searchFlights, type FlightSearchParams } from '@/lib/flights-api';

interface DateStripProps {
  departDate: string;
  cheapestPrice: number | null;
  currency: string;
  mode?: 'depart' | 'return';
  minDate?: string;
  seamless?: boolean;
  onwardDate?: string;
  pairedReturnDate?: string;
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
  mode = 'depart',
  minDate,
  seamless = false,
  onwardDate,
  pairedReturnDate,
  searchParams: sp,
}: DateStripProps) => {
  const router = useRouter();
  const urlParams = useSearchParams();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [datePrices, setDatePrices] = useState<Record<string, number | 'loading' | null>>({});

  const dates = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const floorDate = minDate ? new Date(minDate + 'T00:00:00') : today;
    if (floorDate < today) floorDate.setTime(today.getTime());
    const base = new Date(departDate + 'T00:00:00');
    const start = new Date(base);
    // Fewer dates when rendered seamlessly side-by-side (round-trip split).
    const daysBefore = seamless ? 1 : 3;
    const totalDays = seamless ? 4 : 8;
    start.setDate(start.getDate() - daysBefore);
    if (start < floorDate) start.setTime(floorDate.getTime());
    const result: { date: Date; dateStr: string; label: string; isSelected: boolean; disabled: boolean }[] = [];
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const dateStr = toDateString(d);
      result.push({
        date: d,
        dateStr,
        label: formatStripDate(d),
        isSelected: dateStr === departDate,
        disabled: d < floorDate,
      });
    }
    return result;
  }, [departDate, minDate, seamless]);

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

    // For roundtrip context fire a single RT search per alt date (never ON);
    // for the depart strip we vary depart, for the return strip we vary
    // return. Backend splits onward vs return by from/to.
    for (const dateStr of surroundingDates) {
      const isReturn = mode === 'return';
      const rtForReturn = sp.tripType === 'roundtrip' && isReturn && !!onwardDate;
      const rtForDepart = sp.tripType === 'roundtrip' && !isReturn && !!pairedReturnDate;
      const asRoundTrip = rtForReturn || rtForDepart;
      const params: FlightSearchParams = asRoundTrip
        ? {
            from: sp.from,
            to: sp.to,
            departDate: rtForReturn ? (onwardDate as string) : dateStr,
            returnDate: rtForReturn ? dateStr : (pairedReturnDate as string),
            adults: sp.adults,
            children: sp.children,
            infants: sp.infants,
            cabin: sp.cabin,
            tripType: 'roundtrip',
            directOnly: sp.directOnly,
            refundableOnly: sp.refundableOnly,
            nearbyAirports: sp.nearbyAirports,
          }
        : {
            from: isReturn ? sp.to : sp.from,
            to: isReturn ? sp.from : sp.to,
            departDate: dateStr,
            adults: sp.adults,
            children: sp.children,
            infants: sp.infants,
            cabin: sp.cabin,
            tripType: 'oneway',
            directOnly: sp.directOnly,
            refundableOnly: sp.refundableOnly,
            nearbyAirports: sp.nearbyAirports,
          };
      searchFlights(params)
        .then((res) => {
          if (cancelled) return;
          const flights = rtForReturn
            ? (res.returnFlights ?? [])
            : res.flights;
          if (flights.length > 0) {
            const cheapest = Math.min(...flights.map((f) => f.grossFare));
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
  }, [departDate, mode, onwardDate, pairedReturnDate, sp.from, sp.to, sp.adults, sp.children, sp.infants, sp.cabin, sp.tripType, sp.directOnly, sp.refundableOnly, sp.nearbyAirports, dates]);

  const handleDateClick = (dateStr: string, disabled: boolean) => {
    if (disabled || dateStr === departDate) return;
    const params = new URLSearchParams(urlParams.toString());
    if (mode === 'return') {
      params.set('returnDate', dateStr);
    } else {
      params.set('departDate', dateStr);
      // Keep returnDate >= departDate
      const existingReturn = params.get('returnDate');
      if (existingReturn && existingReturn < dateStr) {
        params.set('returnDate', dateStr);
      }
    }
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
    <div className="bg-white border border-gray-200 rounded-lg flex items-center overflow-hidden">
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
            disabled={d.disabled}
            onClick={() => handleDateClick(d.dateStr, d.disabled)}
            className={`flex-1 min-w-[120px] px-3 py-2.5 text-center border-r border-gray-100 last:border-r-0 transition-colors ${
              d.isSelected
                ? 'bg-gray-800 text-white'
                : d.disabled
                  ? 'text-gray-300 cursor-not-allowed'
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
