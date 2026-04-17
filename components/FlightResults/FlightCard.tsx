'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import type { FlightResult } from '@/lib/flights-api';
import { FlightDetails } from './FlightDetails';

interface FlightCardProps {
  flight: FlightResult;
  currency: string;
  tui: string;
  tripType: string;
  selectionMode?: boolean;
  selected?: boolean;
  onSelect?: (flight: FlightResult) => void;
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

export const FlightCard = ({
  flight,
  currency,
  tui,
  tripType,
  selectionMode = false,
  selected = false,
  onSelect,
}: FlightCardProps) => {
  const router = useRouter();
  const [showDetails, setShowDetails] = useState(false);

  const handleBook = () => {
    if (selectionMode) {
      onSelect?.(flight);
      return;
    }
    const params = new URLSearchParams({
      tui,
      index: flight.index,
      netFare: String(flight.netFare),
      tripType,
    });
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

  const fromCity = (flight.fromName || flight.from).split('|')[0].trim();
  const toCity = (flight.toName || flight.to).split('|')[0].trim();
  const flightCode = `${flight.airlineCode} - ${flight.flightNo.replace(flight.airlineCode, '').trim()}`;

  return (
    <div
      onClick={selectionMode ? () => onSelect?.(flight) : undefined}
      className={`bg-white border rounded-lg hover:shadow-md transition-all relative ${
        selectionMode ? 'cursor-pointer' : ''
      } ${
        selected ? 'border-red-500 ring-2 ring-red-500/30 shadow-md' : 'border-gray-200'
      }`}
    >
      {/* Return Special ribbon */}
      {flight.fareType === 'RS' && (
        <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg tracking-wide z-10">
          RETURN SPECIAL
        </div>
      )}

      <div className={selectionMode ? 'px-3 py-2.5' : 'px-4 py-3'}>
        {/* Main single-row layout */}
        <div
          className={`flex items-center min-w-0 ${selectionMode ? 'gap-2' : 'gap-3 sm:gap-4'}`}
        >
          {/* Radio (selection mode only) */}
          {selectionMode && (
            <div
              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                selected ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              {selected && <div className="w-2 h-2 rounded-full bg-red-500" />}
            </div>
          )}

          {/* Airline */}
          <div
            className={`flex items-center gap-2 min-w-0 flex-shrink ${
              selectionMode ? 'basis-[110px]' : 'basis-[140px] sm:basis-[160px]'
            }`}
          >
            <div
              className={`${selectionMode ? 'w-8 h-8' : 'w-9 h-9'} rounded ${colors.bg} ${colors.border} border flex items-center justify-center flex-shrink-0`}
            >
              <span className={`text-[10px] font-bold ${colors.text}`}>
                {flight.airlineCode}
              </span>
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-gray-900 truncate leading-tight">
                {flight.airlineName.split('|')[0]}
              </div>
              <div className="text-[11px] text-gray-400 leading-tight truncate">
                {flightCode}
              </div>
            </div>
          </div>

          {/* Departure */}
          <div className="text-center flex-shrink-0 min-w-0">
            <div
              className={`${selectionMode ? 'text-base' : 'text-lg'} font-bold text-gray-900 leading-tight`}
            >
              {formatTime(flight.departureTime)}
            </div>
            <div
              className={`text-[11px] text-gray-500 leading-tight truncate ${
                selectionMode ? 'max-w-[70px]' : 'max-w-[90px]'
              }`}
            >
              {fromCity}
            </div>
          </div>

          {/* Duration + plane */}
          <div
            className={`flex-1 flex flex-col items-center px-1 min-w-0 ${
              selectionMode ? 'basis-[60px]' : 'basis-[90px]'
            }`}
          >
            <div className="text-[11px] text-gray-500 font-medium leading-tight whitespace-nowrap">
              {formatDuration(flight.duration)}
            </div>
            <div className="w-full flex items-center my-0.5">
              <div className="h-[1px] flex-1 border-t border-dashed border-gray-300" />
              <svg
                className="w-3.5 h-3.5 text-gray-500 flex-shrink-0 mx-0.5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
              </svg>
              <div className="h-[1px] flex-1 border-t border-dashed border-gray-300" />
            </div>
            <div className="text-[11px] text-gray-500 leading-tight text-center truncate w-full">
              {stopsText}
              {connectionInfo}
            </div>
          </div>

          {/* Arrival */}
          <div className="text-center flex-shrink-0 min-w-0">
            <div
              className={`${selectionMode ? 'text-base' : 'text-lg'} font-bold text-gray-900 leading-tight whitespace-nowrap`}
            >
              {formatTime(flight.arrivalTime)}
              {nextDay && (
                <span className="text-[9px] text-red-500 ml-0.5 align-top">
                  +1
                </span>
              )}
            </div>
            <div
              className={`text-[11px] text-gray-500 leading-tight truncate ${
                selectionMode ? 'max-w-[70px]' : 'max-w-[90px]'
              }`}
            >
              {toCity}
            </div>
          </div>

          {/* Seats */}
          {flight.seats > 0 && (
            <div className="flex flex-col items-center flex-shrink-0">
              <Image
                src="/seat.png"
                alt="Seat"
                width={selectionMode ? 16 : 20}
                height={selectionMode ? 16 : 20}
                className="opacity-80"
              />
              <span
                className={`text-[10px] font-semibold whitespace-nowrap ${
                  flight.seats <= 9 ? 'text-red-500' : 'text-gray-600'
                }`}
              >
                {flight.seats} Left
              </span>
            </div>
          )}

          {/* Price */}
          <div className="text-right flex-shrink-0">
            <div
              className={`${selectionMode ? 'text-base' : 'text-lg'} font-bold text-gray-900 leading-tight whitespace-nowrap`}
            >
              {formatCurrency(flight.grossFare, currency)}
            </div>
          </div>

          {/* Action button */}
          {!selectionMode && (
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleBook();
                }}
                className="px-4 py-1.5 bg-red-500 text-white text-sm font-bold rounded hover:bg-red-600 transition-colors whitespace-nowrap"
              >
                View Fare
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetails(!showDetails);
                }}
                className="text-[11px] text-blue-600 hover:underline font-medium"
              >
                + Details
              </button>
            </div>
          )}
        </div>

        {/* Footer: meal note + details */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-1 text-[11px] text-gray-400 min-w-0">
            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="truncate">
              Meal, Seat are chargeable.{' '}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetails(!showDetails);
                }}
                className="text-blue-500 hover:underline font-medium"
              >
                (More)
              </button>
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            {selectionMode && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetails(!showDetails);
                }}
                className="text-[11px] text-blue-600 hover:underline font-semibold"
              >
                {showDetails ? '− Details' : '+ Details'}
              </button>
            )}
            {flight.refundable && (
              <span className="text-[11px] font-bold text-green-600">R</span>
            )}
          </div>
        </div>
      </div>
      {showDetails && <FlightDetails flight={flight} currency={currency} />}
    </div>
  );
};
