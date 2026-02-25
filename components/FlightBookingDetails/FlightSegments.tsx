'use client';

import type { SegmentDetail } from '@/lib/flights-api';

interface FlightSegmentsProps {
  segments: SegmentDetail[];
}

function formatTime(isoString: string) {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatDate(isoString: string) {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export const FlightSegments = ({ segments }: FlightSegmentsProps) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Flight Details
        </h2>
      </div>
      <div className="divide-y divide-gray-100">
        {segments.map((seg, i) => (
          <div key={i} className="p-4 sm:p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                {seg.airlineCode}
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  {seg.airline}
                </div>
                <div className="text-xs text-gray-500">
                  {seg.flightNo} &middot; {seg.aircraft || 'Aircraft N/A'} &middot; {seg.cabin}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Departure */}
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900">
                  {formatTime(seg.departureTime)}
                </div>
                <div className="text-xs text-gray-700 font-medium">
                  {seg.from}
                  {seg.departureTerminal ? ` T${seg.departureTerminal}` : ''}
                </div>
                <div className="text-xs text-gray-500">{seg.fromName}</div>
                <div className="text-xs text-gray-400">
                  {formatDate(seg.departureTime)}
                </div>
              </div>

              {/* Duration */}
              <div className="flex-1 flex flex-col items-center px-2">
                <div className="text-xs text-gray-500 mb-1">{seg.duration}</div>
                <div className="w-full flex items-center">
                  <div className="h-px flex-1 bg-gray-300" />
                  <svg
                    className="w-4 h-4 text-gray-400 -ml-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {seg.stops === 0
                    ? 'Non-stop'
                    : `${seg.stops} stop${seg.stops > 1 ? 's' : ''}`}
                </div>
              </div>

              {/* Arrival */}
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900">
                  {formatTime(seg.arrivalTime)}
                </div>
                <div className="text-xs text-gray-700 font-medium">
                  {seg.to}
                  {seg.arrivalTerminal ? ` T${seg.arrivalTerminal}` : ''}
                </div>
                <div className="text-xs text-gray-500">{seg.toName}</div>
                <div className="text-xs text-gray-400">
                  {formatDate(seg.arrivalTime)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
