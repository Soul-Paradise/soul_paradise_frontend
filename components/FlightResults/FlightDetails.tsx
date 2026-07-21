'use client';

import { useState } from 'react';
import type { FlightResult } from '@/lib/flights-api';

interface FlightDetailsProps {
  flight: FlightResult;
  currency: string;
}

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

type Tab = 'flight' | 'fare' | 'baggage';

function formatFullDate(isoString: string) {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: '2-digit',
  });
}

function formatTime(isoString: string) {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatRouteDate(isoString: string) {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

function formatDuration(duration: string) {
  if (duration.startsWith('PT')) {
    const hours = duration.match(/(\d+)H/)?.[1] || '0';
    const mins = duration.match(/(\d+)M/)?.[1] || '0';
    return `${hours} Hr.  ${mins} Min.`;
  }
  const h = duration.match(/(\d+)\s*h/)?.[1] || '0';
  const m = duration.match(/(\d+)\s*m/)?.[1] || '0';
  return `${h} Hr.  ${m} Min.`;
}

/** Normalise a layover/gap string (PT.., "2h 30m", raw) into "2h 30m". */
function formatGap(duration: string) {
  if (!duration) return '';
  if (duration.startsWith('PT')) {
    const h = duration.match(/(\d+)H/)?.[1] || '0';
    const m = duration.match(/(\d+)M/)?.[1] || '0';
    return `${h}h ${m}m`;
  }
  const h = duration.match(/(\d+)\s*h/i)?.[1];
  const m = duration.match(/(\d+)\s*m/i)?.[1];
  if (h || m) return `${h || '0'}h ${m || '0'}m`;
  return duration;
}

function cityName(name: string, code: string) {
  return (name || code).split('|')[0].trim();
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency || 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function getCabinName(cabin: string) {
  const map: Record<string, string> = {
    E: 'Economy',
    PE: 'Premium Economy',
    B: 'Business',
    F: 'First Class',
  };
  return map[cabin] || cabin || 'Economy';
}

export const FlightDetails = ({ flight, currency }: FlightDetailsProps) => {
  const [activeTab, setActiveTab] = useState<Tab>('flight');
  const colors = AIRLINE_COLORS[flight.airlineCode] || DEFAULT_COLOR;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'flight', label: 'Flight Information' },
    { key: 'fare', label: 'Fare Summary & Rules' },
    { key: 'baggage', label: 'Baggage Information' },
  ];

  return (
    <div className="border-t border-gray-200 bg-white">
      {/* Tab bar */}
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-3 text-sm font-medium transition-colors relative ${
              activeTab === tab.key
                ? 'text-red-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-red-500 rounded-t" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-5">
        {activeTab === 'flight' && (
          <FlightInfoTab flight={flight} colors={colors} />
        )}
        {activeTab === 'fare' && (
          <FareSummaryTab flight={flight} currency={currency} />
        )}
        {activeTab === 'baggage' && (
          <BaggageTab flight={flight} />
        )}
      </div>
    </div>
  );
};

/* ─── Flight Information Tab ─── */

function FlightInfoTab({
  flight,
  colors,
}: {
  flight: FlightResult;
  colors: { bg: string; text: string; border: string };
}) {
  const airline = flight.airlineName.split('|')[0].trim();
  const cabin = getCabinName(flight.cabin);
  const stopsCount = flight.connections?.length || 0;
  const stopsText =
    stopsCount === 0 ? 'Non Stop' : `${stopsCount} Stop${stopsCount > 1 ? 's' : ''}`;

  // Build the ordered list of stops: origin → each halt → destination.
  // Only the origin and destination carry times (search data has no
  // per-segment times); halts carry the layover duration instead.
  type Stop = {
    code: string;
    name: string;
    time?: string;
    terminal?: string;
    layover?: string;
    kind: 'origin' | 'halt' | 'dest';
  };
  const stops: Stop[] = [
    {
      code: flight.from,
      name: cityName(flight.fromName, flight.from),
      time: flight.departureTime,
      terminal: flight.departureTerminal,
      kind: 'origin',
    },
    ...(flight.connections || []).map<Stop>((c) => ({
      code: c.airport,
      name: cityName(c.airportName, c.airport),
      layover: c.duration,
      kind: 'halt',
    })),
    {
      code: flight.to,
      name: cityName(flight.toName, flight.to),
      time: flight.arrivalTime,
      terminal: flight.arrivalTerminal,
      kind: 'dest',
    },
  ];

  return (
    <div>
      {/* Route header */}
      <div className="bg-gray-700 text-white rounded-t-lg px-4 py-2.5 text-sm font-semibold flex items-center flex-wrap gap-x-2 gap-y-1">
        <span>{flight.from}</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
        <span>{flight.to}</span>
        <span className="text-gray-300 font-normal">· {formatRouteDate(flight.departureTime)}</span>
        <span className="text-gray-300 font-normal">· {formatDuration(flight.duration)}</span>
        <span className="text-gray-300 font-normal">· {stopsText}</span>
      </div>

      {/* Flight detail card */}
      <div className="border border-gray-200 border-t-0 rounded-b-lg p-5">
        {/* Airline + Aircraft info */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded ${colors.bg} ${colors.border} border flex items-center justify-center`}
            >
              <span className={`text-xs font-bold ${colors.text}`}>{flight.airlineCode}</span>
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-900">{flight.airlineName}</span>
              <span className="text-sm text-gray-400 ml-2">{flight.flightNo}</span>
            </div>
          </div>
          <div className="flex gap-4">
            {flight.aircraft && (
              <div className="text-center">
                <div className="text-[10px] text-gray-400 uppercase font-medium">Aircraft</div>
                <div className="text-xs font-semibold text-gray-700">{flight.aircraft}</div>
              </div>
            )}
            <div className="text-center">
              <div className="text-[10px] text-gray-400 uppercase font-medium">Travel Class</div>
              <div className="text-xs font-semibold text-gray-700">{cabin}</div>
            </div>
          </div>
        </div>

        {/* Itinerary — one journey per hop (origin → halt → destination) */}
        <ol className="relative">
          {stops.map((s, i) => {
            const last = i === stops.length - 1;
            return (
              <li key={i} className="flex gap-3">
                {/* Timeline rail */}
                <div className="flex flex-col items-center pt-1.5">
                  <span
                    className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      s.kind === 'halt'
                        ? 'bg-white border-2 border-orange-400'
                        : 'bg-blue-500 border-2 border-blue-500'
                    }`}
                  />
                  {!last && <span className="w-px flex-1 bg-gray-200 my-1" />}
                </div>

                {/* Stop content */}
                <div className={`flex-1 min-w-0 ${last ? '' : 'pb-5'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-800">
                        {s.name} [<span className="font-bold">{s.code}</span>]
                      </div>
                      {s.terminal && (
                        <div className="text-xs text-gray-400 mt-0.5">Terminal {s.terminal}</div>
                      )}
                      {s.kind === 'halt' && (
                        <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-md bg-orange-50 border border-orange-200 px-2 py-0.5 text-[11px] font-medium text-orange-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                          Layover {formatGap(s.layover || '')} · Change planes
                        </div>
                      )}
                    </div>
                    {s.time && (
                      <div className="text-right flex-shrink-0">
                        <div className="text-lg font-bold text-gray-900 leading-tight">
                          {formatTime(s.time)}
                        </div>
                        <div className="text-[11px] text-gray-500">{formatFullDate(s.time)}</div>
                      </div>
                    )}
                  </div>

                  {/* Flight leg to the next stop */}
                  {!last && (
                    <div className="mt-3 flex items-center gap-2 text-[11px] text-gray-500">
                      <div
                        className={`w-6 h-6 rounded ${colors.bg} ${colors.border} border flex items-center justify-center flex-shrink-0`}
                      >
                        <span className={`text-[9px] font-bold ${colors.text}`}>
                          {flight.airlineCode}
                        </span>
                      </div>
                      <span className="font-medium text-gray-700">{airline}</span>
                      <span className="text-gray-300">·</span>
                      <span>{cabin}</span>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>

        {/* Info notice */}
        <div className="mt-5 flex items-center gap-1.5 text-xs">
          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
            Info
          </span>
          <span className="text-gray-500">Meal, Seat are chargeable.</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Fare Summary & Rules Tab ─── */

function FareSummaryTab({
  flight,
  currency,
}: {
  flight: FlightResult;
  currency: string;
}) {
  return (
    <div className="flex flex-col md:flex-row gap-5">
      {/* Fare attributes */}
      <div className="flex-1">
        <div className="bg-sky-50 rounded-lg border border-sky-100 p-4">
          <div className="text-sm font-semibold text-gray-800 mb-3">
            {flight.from} - {flight.to}
          </div>
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-sky-100">
                <td className="py-2 text-gray-500">Fare Class</td>
                <td className="py-2 text-right font-medium text-gray-700">
                  {flight.fareClass || '-'}
                </td>
              </tr>
              <tr className="border-b border-sky-100">
                <td className="py-2 text-gray-500">Fare Type</td>
                <td className="py-2 text-right font-medium text-gray-700">
                  {flight.fareType || '-'}
                </td>
              </tr>
              <tr>
                <td className="py-2 text-gray-500">Refundable</td>
                <td className="py-2 text-right">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      flight.refundable
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-600'
                    }`}
                  >
                    {flight.refundable ? 'Yes' : 'No'}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-3 text-xs text-gray-400 space-y-1">
          <p>
            * Fare rules and detailed breakdown (change fee, cancellation fee) will be shown on the booking page.
          </p>
          <p>
            * The above data is indicatory, fare rules are subject to changes by the airline.
          </p>
        </div>
      </div>

      {/* Fare total card */}
      <div className="w-full md:w-64 flex-shrink-0">
        <div className="bg-sky-50 rounded-lg border border-sky-100 p-4">
          <div className="text-sm font-semibold text-gray-800 mb-3 flex items-center justify-between">
            <span>Fare Details</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Fare</span>
              <span>{formatCurrency(flight.grossFare, currency)}</span>
            </div>
            {flight.grossFare !== flight.netFare && flight.netFare > 0 && (
              <div className="flex justify-between text-green-600 text-xs">
                <span>Discount</span>
                <span>- {formatCurrency(flight.grossFare - flight.netFare, currency)}</span>
              </div>
            )}
          </div>
          <div className="mt-3 pt-3 border-t border-sky-200 flex justify-between font-bold text-gray-900">
            <span>Total Amount:</span>
            <span>{formatCurrency(flight.grossFare, currency)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Baggage Information Tab ─── */

function BaggageTab({ flight }: { flight: FlightResult }) {
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-sky-50">
              <th className="px-4 py-3 text-left font-semibold text-gray-700 border border-sky-100">
                Sector/Flight
              </th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700 border border-sky-100">
                Check in Baggage
              </th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700 border border-sky-100">
                Cabin Baggage
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-4 py-3 text-gray-700 font-medium border border-gray-100">
                {flight.from} - {flight.to}
              </td>
              <td className="px-4 py-3 text-center text-gray-600 border border-gray-100">
                {flight.baggage || 'As per airline policy'}
              </td>
              <td className="px-4 py-3 text-center text-gray-600 border border-gray-100">
                7Kg (Adult)
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-xs text-gray-400 space-y-1.5">
        <p className="flex items-start gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1 flex-shrink-0" />
          The baggage allowance may vary according to stop-overs, connecting flights and changes in airline rules.
        </p>
        <p className="flex items-start gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1 flex-shrink-0" />
          Additional baggage can be added during the booking process.
        </p>
      </div>

      {/* Warning */}
      <div className="mt-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-xs text-red-600">
        Adding of additional baggage is subject to load factor of the flight. In case baggage could not be added, payment for the additional baggage paid will be reverted.
      </div>
    </div>
  );
}
