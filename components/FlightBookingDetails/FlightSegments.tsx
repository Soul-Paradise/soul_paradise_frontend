'use client';

import { useState } from 'react';
import type { SegmentDetail } from '@/lib/flights-api';

interface FlightSegmentsProps {
  segments: SegmentDetail[];
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: '2-digit',
  });
}

function formatDuration(d: string) {
  if (!d) return '';
  if (d.startsWith('PT')) {
    const h = d.match(/(\d+)H/)?.[1] || '0';
    const m = d.match(/(\d+)M/)?.[1] || '0';
    return `${h}h ${m}m`;
  }
  const h = d.match(/(\d+)\s*h/i)?.[1];
  const m = d.match(/(\d+)\s*m/i)?.[1];
  if (h || m) return `${h || '0'}h ${m || '0'}m`;
  return d;
}

function legDuration(first: SegmentDetail, last: SegmentDetail) {
  const ms =
    new Date(last.arrivalTime).getTime() - new Date(first.departureTime).getTime();
  if (!Number.isFinite(ms) || ms <= 0) return '';
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`;
}

function connectionGap(prev: SegmentDetail, next: SegmentDetail) {
  const ms = new Date(next.departureTime).getTime() - new Date(prev.arrivalTime).getTime();
  if (!Number.isFinite(ms) || ms <= 0) return '';
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, '0')}h${String(m).padStart(2, '0')}m`;
}

function cityOf(name: string, code: string) {
  return name?.split('|')[0]?.trim() || code;
}

function cabinLabel(cabin: string) {
  const map: Record<string, string> = {
    E: 'Economy',
    PE: 'Premium Economy',
    B: 'Business',
    F: 'First',
  };
  return map[cabin] || cabin || 'Economy';
}

const PlaneIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
  </svg>
);

const Arrow = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
      clipRule="evenodd"
    />
  </svg>
);

interface LegSummaryProps {
  segments: SegmentDetail[];
  label: 'Onward' | 'Return';
}

const LegSummary = ({ segments, label }: LegSummaryProps) => {
  if (segments.length === 0) return null;
  const first = segments[0];
  const last = segments[segments.length - 1];
  const stops = segments.length - 1;
  const stopText = stops === 0 ? 'Non Stop' : `${stops} Stop${stops > 1 ? 's' : ''}`;
  const cabin = cabinLabel(first.cabin);
  const accent = label === 'Onward' ? 'text-sky-600' : 'text-violet-600';

  return (
    <div className="flex-1 min-w-0 max-w-full bg-sky-50/50 border border-sky-100 rounded-xl p-4 overflow-hidden">
      <div className="flex items-center gap-2 text-base font-semibold text-gray-900 min-w-0">
        <span className="flex-shrink-0">{first.from}</span>
        <Arrow className={`w-4 h-4 ${accent} flex-shrink-0`} />
        <span className="flex-shrink-0">{last.to}</span>
      </div>
      <div className="mt-2 text-[12px] text-gray-600 flex items-center gap-1.5 flex-wrap">
        <span>{stopText}</span>
        <span className="text-gray-300">|</span>
        <span>{cabin}</span>
      </div>
      <div className="mt-1 text-[12px] text-gray-600 flex items-center gap-1.5 flex-wrap">
        <span>{formatDateShort(first.departureTime)}</span>
        <span className="text-gray-300">|</span>
        <span>Duration {legDuration(first, last)}</span>
      </div>
    </div>
  );
};

interface LegDetailedProps {
  segments: SegmentDetail[];
  label: 'Onward' | 'Return';
  refundable?: boolean;
}

const LegDetailed = ({ segments, label, refundable }: LegDetailedProps) => {
  if (segments.length === 0) return null;
  const first = segments[0];
  const last = segments[segments.length - 1];
  const stops = segments.length - 1;
  const stopText = stops === 0 ? 'Non Stop' : `${stops} Stop${stops > 1 ? 's' : ''}`;
  const accent = label === 'Onward' ? 'text-sky-600' : 'text-violet-600';

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden w-full max-w-full min-w-0">
      {/* Leg header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-4 flex-wrap min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-lg font-bold text-gray-900">
            <span>{first.from}</span>
            <Arrow className={`w-4 h-4 ${accent}`} />
            <span>{last.to}</span>
          </div>
          <div className="mt-1 text-[12px] text-gray-500 flex items-center gap-2 flex-wrap">
            <span>· {formatDateShort(first.departureTime)}</span>
            <span>· Duration {legDuration(first, last)}</span>
            <span>· {stopText}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" className="text-[12px] font-medium text-sky-600 hover:underline">
            <span className="inline-flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Fare Rules
            </span>
          </button>
          {refundable !== undefined && (
            <span
              className={`text-[11px] font-semibold px-3 py-1 rounded-full border ${
                refundable
                  ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                  : 'border-amber-300 text-amber-700 bg-amber-50'
              }`}
            >
              {refundable ? 'Partially Refundable' : 'Non-Refundable'}
            </span>
          )}
        </div>
      </div>

      {/* Segments */}
      {segments.map((seg, i) => (
        <div key={i}>
          <div className="px-5 pt-4 min-w-0">
            {/* Airline + meta */}
            <div className="flex items-center gap-3 flex-wrap min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-9 h-9 rounded bg-gray-100 border border-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-700 flex-shrink-0">
                  {seg.airlineCode}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate leading-tight">
                    {seg.airline}
                  </div>
                  <div className="text-[11px] text-gray-400 leading-tight">
                    {seg.flightNo}
                  </div>
                </div>
              </div>
              <div className="sm:ml-auto flex flex-wrap items-stretch border border-gray-200 rounded-md overflow-hidden text-[11px] max-w-full">
                <div className="px-3 py-1.5 border-r border-gray-200">
                  <div className="text-gray-400 uppercase tracking-wide">Aircraft</div>
                  <div className="text-gray-800 font-medium">
                    {seg.aircraft || seg.equipmentType || 'N/A'}
                  </div>
                </div>
                <div className="px-3 py-1.5 border-r border-gray-200">
                  <div className="text-gray-400 uppercase tracking-wide">Travel Class</div>
                  <div className="text-gray-800 font-medium">{cabinLabel(seg.cabin)}</div>
                </div>
                {seg.baggage && (
                  <div className="px-3 py-1.5 border-r border-gray-200">
                    <div className="text-gray-400 uppercase tracking-wide">Check-In Baggage</div>
                    <div className="text-gray-800 font-medium">{seg.baggage}</div>
                  </div>
                )}
                <div className="px-3 py-1.5">
                  <div className="text-gray-400 uppercase tracking-wide">Cabin Baggage</div>
                  <div className="text-gray-800 font-medium">Adult · 7Kg</div>
                </div>
              </div>
            </div>

            {/* Segment timeline */}
            <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3 pb-4 min-w-0">
              <div className="min-w-0">
                <div className="text-2xl font-bold text-gray-900 leading-tight">
                  {formatTime(seg.departureTime)}
                </div>
                <div className="text-[12px] text-gray-700 mt-0.5">
                  {formatDate(seg.departureTime)}
                </div>
                <div className="text-[12px] text-gray-700 mt-0.5">
                  {cityOf(seg.fromName, seg.from)} <span className="font-semibold">[{seg.from}]</span>
                </div>
                {(seg.fromName || seg.departureTerminal) && (
                  <div className="text-[12px] text-gray-500">
                    {seg.fromName?.split('|')[0]?.trim()}
                    {seg.departureTerminal ? `, Terminal ${seg.departureTerminal}` : ''}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-center min-w-[80px] sm:min-w-[120px]">
                <div className="text-[12px] text-gray-500 whitespace-nowrap">
                  {formatDuration(seg.duration) || legDuration(seg, seg)}
                </div>
                <div className="w-full flex items-center mt-1">
                  <div className="h-px flex-1 border-t border-dashed border-sky-300" />
                  <PlaneIcon className="w-3.5 h-3.5 text-sky-500 mx-1" />
                  <div className="h-px flex-1 border-t border-dashed border-sky-300" />
                </div>
              </div>
              <div className="text-right min-w-0">
                <div className="text-2xl font-bold text-gray-900 leading-tight">
                  {formatTime(seg.arrivalTime)}
                </div>
                <div className="text-[12px] text-gray-700 mt-0.5">
                  {formatDate(seg.arrivalTime)}
                </div>
                <div className="text-[12px] text-gray-700 mt-0.5">
                  {cityOf(seg.toName, seg.to)} <span className="font-semibold">[{seg.to}]</span>
                </div>
                {(seg.toName || seg.arrivalTerminal) && (
                  <div className="text-[12px] text-gray-500">
                    {seg.toName?.split('|')[0]?.trim()}
                    {seg.arrivalTerminal ? `, Terminal ${seg.arrivalTerminal}` : ''}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Connection banner */}
          {i < segments.length - 1 && (
            <div className="mx-5 mb-4 rounded-md bg-gradient-to-r from-sky-50 via-indigo-50 to-sky-50 border border-sky-100 px-3 py-2 text-[12px] text-gray-700 flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                Change planes at{' '}
                <span className="font-semibold">
                  {cityOf(segments[i].toName, segments[i].to)} [{segments[i].to}]
                </span>
                , Connecting Time:{' '}
                <span className="font-semibold">
                  {connectionGap(segments[i], segments[i + 1])}
                </span>
              </span>
            </div>
          )}

          {/* Inter-segment border */}
          {i < segments.length - 1 && <div className="border-b border-gray-100" />}
        </div>
      ))}

      {/* Footer note */}
      <div className="px-5 py-2.5 bg-sky-50/40 border-t border-gray-100 text-[11px] text-gray-500 flex items-center gap-1.5">
        <svg className="w-3.5 h-3.5 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Meal, Seat are chargeable.
      </div>
    </div>
  );
};

export const FlightSegments = ({ segments }: FlightSegmentsProps) => {
  const [expanded, setExpanded] = useState(false);

  // Prefer the backend-provided direction tag; otherwise infer the split.
  // Heuristic: a round-trip has first.from === last.to. The boundary between
  // onward and return is the segment pair with the largest ground gap (the
  // stay at the destination, typically hours/days vs. minutes for layovers).
  const tagged = segments.some((s) => s.direction);
  let onward: SegmentDetail[] = segments;
  let ret: SegmentDetail[] = [];

  if (tagged) {
    onward = segments.filter((s) => (s.direction ?? 'ONWARD') === 'ONWARD');
    ret = segments.filter((s) => s.direction === 'RETURN');
  } else if (
    segments.length > 1 &&
    segments[0].from?.toUpperCase() === segments[segments.length - 1].to?.toUpperCase()
  ) {
    let splitAt = -1;
    let maxGap = 0;
    for (let i = 0; i < segments.length - 1; i++) {
      const gap =
        new Date(segments[i + 1].departureTime).getTime() -
        new Date(segments[i].arrivalTime).getTime();
      if (gap > maxGap) {
        maxGap = gap;
        splitAt = i;
      }
    }
    if (splitAt >= 0) {
      onward = segments.slice(0, splitAt + 1);
      ret = segments.slice(splitAt + 1);
    }
  }

  const isRoundTrip = ret.length > 0;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 w-full max-w-full min-w-0 overflow-hidden">
      {/* Collapsed two-pane summary */}
      <div className="relative">
        <div
          className={`flex flex-col ${isRoundTrip ? 'md:flex-row' : ''} items-stretch gap-3`}
        >
          <LegSummary segments={onward} label="Onward" />
          {isRoundTrip && <LegSummary segments={ret} label="Return" />}
        </div>

      </div>

      {/* View all details toggle */}
      <div className="flex justify-end mt-3">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex items-center gap-1 text-[12px] font-semibold text-sky-600 hover:underline"
        >
          <svg
            className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          {expanded ? 'Hide details' : 'View all details'}
        </button>
      </div>

      {/* Expanded per-leg details */}
      {expanded && (
        <div className="mt-3 space-y-4">
          <LegDetailed segments={onward} label="Onward" />
          {isRoundTrip && <LegDetailed segments={ret} label="Return" />}
        </div>
      )}
    </div>
  );
};
