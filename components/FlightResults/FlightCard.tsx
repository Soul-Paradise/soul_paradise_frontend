'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import type { FlightResult } from '@/lib/flights-api';
import { FlightDetails } from './FlightDetails';

interface FlightCardProps {
  flight: FlightResult;
  currency: string;
  searchId: string;
  tripType: string;
}

// Airline brand colors
const AIRLINE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  SG: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  '6E': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  AI: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  IX: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
  I5: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
  UK: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  QP: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
  G8: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
};

const DEFAULT_COLOR = { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };

function formatTime(isoString: string) {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatDuration(duration: string) {
  if (duration.startsWith('PT')) {
    const hours = duration.match(/(\d+)H/)?.[1] || '0';
    const mins = duration.match(/(\d+)M/)?.[1] || '0';
    return `${hours} Hr  ${mins} Min`;
  }
  // Handle "2h 30m" format
  const h = duration.match(/(\d+)\s*h/)?.[1] || '0';
  const m = duration.match(/(\d+)\s*m/)?.[1] || '0';
  return `${h} Hr  ${m} Min`;
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency || 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function isNextDay(departure: string, arrival: string): boolean {
  const dep = new Date(departure);
  const arr = new Date(arrival);
  return dep.toDateString() !== arr.toDateString();
}

export const FlightCard = ({ flight, currency, searchId, tripType }: FlightCardProps) => {
  const router = useRouter();
  const [showDetails, setShowDetails] = useState(false);

  const handleBook = () => {
    const params = new URLSearchParams({ searchId, index: flight.index, tripType });
    router.push(`/booking/flights/details?${params.toString()}`);
  };

  const colors = AIRLINE_COLORS[flight.airlineCode] || DEFAULT_COLOR;

  const stopsText =
    flight.stops === 0
      ? 'Non stop'
      : `${flight.stops}stop${flight.stops > 1 ? 's' : ''}`;

  const connectionInfo =
    flight.connections?.length > 0
      ? `, Via ${flight.connections.map((c) => c.airportName || c.airport).join(', ')}`
      : '';

  const nextDay = isNextDay(flight.departureTime, flight.arrivalTime);

  return (
    <div className="bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow overflow-hidden">
      {/* Main row */}
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Airline info */}
          <div className="flex items-center gap-2.5 min-w-[130px] sm:min-w-[150px] flex-shrink-0">
            <div
              className={`w-9 h-9 rounded ${colors.bg} ${colors.border} border flex items-center justify-center flex-shrink-0`}
            >
              <span className={`text-[10px] font-bold ${colors.text}`}>
                {flight.airlineCode}
              </span>
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-900 truncate leading-tight">
                {flight.airlineName}
              </div>
              <div className="text-xs text-gray-400">{flight.flightNo}</div>
            </div>
          </div>

          {/* Departure */}
          <div className="text-center min-w-[60px]">
            <div className="text-xl font-bold text-gray-900 leading-tight">
              {formatTime(flight.departureTime)}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {flight.fromName || flight.from}
            </div>
          </div>

          {/* Duration & Stops */}
          <div className="flex-1 flex flex-col items-center px-1 min-w-[100px]">
            <div className="text-[11px] text-gray-400 mb-1 font-medium">
              {formatDuration(flight.duration)}
            </div>
            <div className="w-full flex items-center">
              <div className="h-[1px] flex-1 border-t border-dashed border-gray-300" />
              {flight.stops > 0 && (
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mx-0.5 flex-shrink-0" />
              )}
              <svg className="w-3 h-3 text-gray-400 flex-shrink-0 -ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10 17l5-5-5-5v10z" />
              </svg>
            </div>
            <div className="text-[11px] text-gray-400 mt-1">
              {stopsText}
              {connectionInfo}
            </div>
          </div>

          {/* Arrival */}
          <div className="text-center min-w-[60px]">
            <div className="text-xl font-bold text-gray-900 leading-tight">
              {formatTime(flight.arrivalTime)}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {flight.toName || flight.to}
            </div>
            {nextDay && (
              <div className="text-[10px] text-red-500 font-medium">Next Day</div>
            )}
          </div>

          {/* Seats left */}
          {flight.seats > 0 && flight.seats <= 9 && (
            <div className="hidden sm:flex flex-col items-center min-w-[50px] flex-shrink-0">
              <Image
                src="/seat.png"
                alt="Seat"
                width={20}
                height={20}
                className="opacity-70"
              />
              <span className="text-[10px] text-red-500 font-semibold">
                {flight.seats} Left
              </span>
            </div>
          )}

          {/* Price & Book */}
          <div className="flex flex-col items-end gap-1.5 min-w-[110px] flex-shrink-0">
            <div className="text-right">
              <div className="text-xl font-bold text-gray-900">
                {formatCurrency(flight.grossFare, currency)}
              </div>
            </div>
            <button
              type="button"
              onClick={handleBook}
              className="px-5 py-1.5 bg-red-500 text-white text-sm font-bold rounded hover:bg-red-600 transition-colors"
            >
              Book Now
            </button>
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              {showDetails ? '- Details' : '+ Details'}
            </button>
            {/* Refundable badge */}
            {flight.refundable && (
              <span className="text-[10px] font-bold text-green-600">R</span>
            )}
          </div>
        </div>

        {/* Mobile seats indicator */}
        {flight.seats > 0 && flight.seats <= 9 && (
          <div className="sm:hidden flex items-center gap-1 mt-2 text-red-500">
            <Image src="/seat.png" alt="Seat" width={16} height={16} className="opacity-70" />
            <span className="text-xs font-semibold">{flight.seats} Left</span>
          </div>
        )}
      </div>

      {/* Info line */}
      <div className="px-4 sm:px-5 pb-3 flex items-center justify-between">
        <div className="text-xs text-gray-400 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Meal, Seat are chargeable.{' '}
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="text-blue-500 hover:underline font-medium"
          >
            (More)
          </button>
        </div>
      </div>

      {/* Expandable details */}
      {showDetails && (
        <FlightDetails flight={flight} currency={currency} />
      )}
    </div>
  );
};
