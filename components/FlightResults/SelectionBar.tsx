'use client';

import type { FlightResult } from '@/lib/flights-api';

interface SelectionBarProps {
  selectedOnward: FlightResult | null;
  selectedReturn: FlightResult | null;
  currency: string;
  onBook: () => void;
  onShowOnwardDetails?: () => void;
  onShowReturnDetails?: () => void;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatDuration(d: string) {
  if (d.startsWith('PT')) {
    const h = d.match(/(\d+)H/)?.[1] || '0';
    const m = d.match(/(\d+)M/)?.[1] || '0';
    return `${h}h ${m}m`;
  }
  const h = d.match(/(\d+)\s*h/)?.[1] || '0';
  const m = d.match(/(\d+)\s*m/)?.[1] || '0';
  return `${h}h ${m}m`;
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency || 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

const PlaneIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
  </svg>
);

interface PaneProps {
  flight: FlightResult | null;
  label: 'Onward' | 'Return';
  currency: string;
}

const FlightPane = ({ flight, label, currency }: PaneProps) => {
  const pillColor =
    label === 'Onward'
      ? 'bg-orange-400 text-white'
      : 'bg-violet-500 text-white';

  if (!flight) {
    return (
      <div className="relative flex-1 min-w-0 border border-dashed border-gray-300 rounded-lg px-4 py-4 bg-white">
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
          <span
            className={`${pillColor} text-[10px] font-bold uppercase tracking-wide px-3 py-0.5 rounded-full inline-flex items-center gap-1 shadow-sm`}
          >
            <PlaneIcon className="w-2.5 h-2.5" />
            {label}
          </span>
        </div>
        <div className="text-sm text-gray-400 text-center mt-1">
          Select {label.toLowerCase()} flight
        </div>
      </div>
    );
  }

  const stopsText =
    flight.stops === 0
      ? 'Non stop'
      : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`;
  const via =
    flight.connections?.length > 0
      ? `, Via ${flight.connections.map((c) => c.airportName || c.airport).join(', ')}`
      : '';
  const fromCity = (flight.fromName || flight.from).split('|')[0].trim();
  const toCity = (flight.toName || flight.to).split('|')[0].trim();
  const flightCode = `${flight.airlineCode}-${flight.flightNo.replace(flight.airlineCode, '').trim()}`;
  const airline = flight.airlineName.split('|')[0];

  return (
    <div className="relative flex-1 min-w-0 border border-gray-200 rounded-lg px-4 py-3 bg-white">
      {/* Pill */}
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
        <span
          className={`${pillColor} text-[10px] font-bold uppercase tracking-wide px-3 py-0.5 rounded-full inline-flex items-center gap-1 shadow-sm`}
        >
          <PlaneIcon className="w-2.5 h-2.5" />
          {label}
        </span>
      </div>

      <div className="flex items-center gap-3 min-w-0">
        {/* Airline */}
        <div className="flex flex-col min-w-0 flex-shrink-0 max-w-[140px]">
          <div className="text-sm font-semibold text-gray-900 truncate leading-tight">
            {airline}
          </div>
          <div className="text-[11px] text-gray-400 leading-tight truncate">
            {flightCode}
          </div>
        </div>

        {/* Departure */}
        <div className="flex flex-col items-start flex-shrink-0">
          <div className="text-base font-bold text-gray-900 leading-tight">
            {formatTime(flight.departureTime)}
          </div>
          <div className="text-[11px] text-gray-500 leading-tight truncate max-w-[110px]">
            {fromCity}
          </div>
        </div>

        {/* Duration line */}
        <div className="flex-1 flex flex-col items-center min-w-[80px] px-1">
          <div className="text-[11px] text-gray-500 font-medium whitespace-nowrap leading-tight">
            {formatDuration(flight.duration)}
          </div>
          <div className="w-full flex items-center my-0.5">
            <div className="h-[1px] flex-1 border-t border-dashed border-gray-300" />
            <PlaneIcon className="w-3.5 h-3.5 text-gray-500 mx-0.5" />
            <div className="h-[1px] flex-1 border-t border-dashed border-gray-300" />
          </div>
          <div className="text-[11px] text-gray-500 leading-tight whitespace-nowrap">
            {stopsText}
            {via}
          </div>
        </div>

        {/* Arrival */}
        <div className="flex flex-col items-start flex-shrink-0">
          <div className="text-base font-bold text-gray-900 leading-tight">
            {formatTime(flight.arrivalTime)}
          </div>
          <div className="text-[11px] text-gray-500 leading-tight truncate max-w-[110px]">
            {toCity}
          </div>
        </div>

        {/* Price */}
        <div className="text-right flex-shrink-0">
          <div className="text-base font-bold text-gray-900 leading-tight">
            {formatCurrency(flight.grossFare, currency)}
          </div>
        </div>
      </div>
    </div>
  );
};

export const SelectionBar = ({
  selectedOnward,
  selectedReturn,
  currency,
  onBook,
}: SelectionBarProps) => {
  const total =
    (selectedOnward?.grossFare || 0) + (selectedReturn?.grossFare || 0);
  const canBook = !!selectedOnward && !!selectedReturn;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 min-w-0">
          <FlightPane flight={selectedOnward} label="Onward" currency={currency} />
          <FlightPane flight={selectedReturn} label="Return" currency={currency} />
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wide text-gray-400 leading-tight">
              Total
            </div>
            <div className="text-xl font-bold text-gray-900 leading-tight">
              {canBook ? formatCurrency(total, currency) : '—'}
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={onBook}
              disabled={!canBook}
              className="px-6 py-2.5 bg-red-500 text-white text-sm font-bold rounded hover:bg-red-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap"
            >
              Book Now
            </button>
            <button
              type="button"
              disabled={!canBook}
              onClick={onBook}
              className="text-[11px] text-blue-600 hover:underline font-medium disabled:text-gray-300 disabled:no-underline disabled:cursor-not-allowed"
            >
              Flight Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
