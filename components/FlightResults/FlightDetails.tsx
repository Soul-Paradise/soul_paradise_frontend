'use client';

import { useCallback, useEffect, useState } from 'react';
import { getFareRules } from '@/lib/flights-api';
import type { FareRule, FlightResult } from '@/lib/flights-api';
import { FareRulesAccordion } from '@/components/FlightBookingDetails/FareRulesAccordion';

interface FlightDetailsProps {
  flight: FlightResult;
  currency: string;
  tui: string;
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

/* ─── Shared building blocks ───
   All three tabs render through these so the panes read as one interface
   rather than three separately-designed screens. */

/** A titled card: gray header strip, white body, optional footnote strip. */
function Panel({
  title,
  subtitle,
  children,
  footnote,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footnote?: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide flex items-center flex-wrap gap-x-2">
          {title}
        </h2>
        {subtitle && <p className="mt-0.5 text-[11px] text-gray-500">{subtitle}</p>}
      </div>
      {children}
      {footnote && (
        <div className="px-5 py-2.5 bg-gray-50 border-t border-gray-100 text-[11px] text-gray-500">
          {footnote}
        </div>
      )}
    </div>
  );
}

/** The one disclaimer treatment used at the foot of every tab. */
function Notes({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1 text-[11px] text-gray-400">
      {items.map((note, i) => (
        <li key={i} className="flex items-start gap-1.5">
          <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-300 flex-shrink-0" />
          <span>{note}</span>
        </li>
      ))}
    </ul>
  );
}

/** Label/value row, shared by the fare-attribute and baggage tables. */
function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <tr className="border-b border-gray-100 last:border-b-0">
      <td className="px-5 py-2.5 text-gray-500 align-top">{label}</td>
      <td className="px-5 py-2.5 text-right font-medium text-gray-700">{children}</td>
    </tr>
  );
}

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

function getCabinName(cabin: string) {
  const map: Record<string, string> = {
    E: 'Economy',
    PE: 'Premium Economy',
    B: 'Business',
    F: 'First Class',
  };
  return map[cabin] || cabin || 'Economy';
}

export const FlightDetails = ({ flight, tui }: FlightDetailsProps) => {
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
      <div role="tablist" className="flex border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
            /* focus:outline-none replaces the browser's default focus box,
               which drew a hard rectangle around the whole tab. */
            className={`px-5 py-3 text-sm font-medium transition-colors relative focus:outline-none focus-visible:bg-gray-50 ${
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
      <div className="p-5 bg-gray-50/60">
        {activeTab === 'flight' && (
          <FlightInfoTab flight={flight} colors={colors} />
        )}
        {activeTab === 'fare' && (
          <FareSummaryTab flight={flight} tui={tui} />
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
    <div className="space-y-4">
      <Panel
        title={
          <>
            <span>{flight.from}</span>
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
            <span>{flight.to}</span>
          </>
        }
        subtitle={`${formatRouteDate(flight.departureTime)} · ${formatDuration(
          flight.duration,
        )} · ${stopsText}`}
      >
        <div className="p-5">
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
        </div>

        {/* Inclusions + advisories, divided off from the itinerary */}
        <div className="border-t border-gray-100 px-5 py-3 space-y-2">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
              Info
            </span>
            <span className="text-gray-500">
              {flight.mealsIncluded ? 'Meal included' : 'Meal, Seat are chargeable.'}
              {flight.pieceDescription ? ` · ${flight.pieceDescription}` : ''}
            </span>
          </div>

          {flight.notice && (
            <div className="flex items-start gap-1.5 text-xs">
              <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase flex-shrink-0">
                Note
              </span>
              <span className="text-gray-500">
                {flight.notice}
                {flight.noticeLink && (
                  <a
                    href={flight.noticeLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 text-red-600 underline font-medium"
                  >
                    Read more
                  </a>
                )}
              </span>
            </div>
          )}
        </div>
      </Panel>

      <Notes
        items={[
          'Times shown are local to each airport.',
          'Connecting flights are subject to change by the airline.',
        ]}
      />
    </div>
  );
}

/* ─── Fare Summary & Rules Tab ─── */

/** Decode Benzy's HoldInfo ("E|01:00|1.00|SE|EE") into its hold duration. */
function holdDuration(holdInfo?: string | null): string | null {
  if (!holdInfo) return null;
  const parts = holdInfo.split('|');
  const hhmm = parts[1]?.trim();
  if (!hhmm || !/^\d{1,2}:\d{2}$/.test(hhmm)) return null;
  const [h, m] = hhmm.split(':').map(Number);
  if (!h && !m) return null;
  return [h ? `${h} hr` : '', m ? `${m} min` : ''].filter(Boolean).join(' ');
}

function FareSummaryTab({ flight, tui }: { flight: FlightResult; tui: string }) {
  const [rules, setRules] = useState<FareRule[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Rules are only fetched when this tab is actually mounted (i.e. the customer
  // clicked it). Pricing the fare upstream is a billable call, so it must never
  // fire while merely browsing results.
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getFareRules(tui, flight.index, flight.netFare);
      setRules(res.fareRules);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Could not load fare rules.',
      );
    } finally {
      setLoading(false);
    }
  }, [tui, flight.index, flight.netFare]);

  useEffect(() => {
    void load();
  }, [load]);

  const hold = holdDuration(flight.holdInfo);

  return (
    <div className="space-y-4">
      <Panel title="Fare Summary" subtitle={`${flight.from} - ${flight.to}`}>
        <table className="w-full text-sm">
          <tbody>
            <Row label="Travel Class">
              {getCabinName(flight.cabin)}
              {flight.rbd && (
                <span className="text-xs text-gray-400 font-normal">
                  {' '}
                  · Booking class {flight.rbd}
                </span>
              )}
            </Row>
            {(flight.fareHead || flight.fareBasisCode) && (
              <Row label="Fare Type">
                {flight.fareHead || '—'}
                {flight.fareBasisCode && (
                  <span className="block text-xs text-gray-400 font-normal">
                    Fare basis {flight.fareBasisCode}
                  </span>
                )}
              </Row>
            )}
            <Row label="Check-in Baggage">
              {flight.baggage || 'As per airline policy'}
              {flight.pieceDescription && (
                <span className="block text-xs text-gray-400 font-normal">
                  {flight.pieceDescription}
                </span>
              )}
            </Row>
            {flight.promo && (
              <Row label="Promo Applied">
                <span className="text-emerald-700">{flight.promo}</span>
              </Row>
            )}
            {hold && <Row label="Hold Available">Up to {hold}</Row>}
            <Row label="Refundable">
              {/* Benzy's flag only says whether the fare is refundable at
                  all — refundable fares still carry a cancellation penalty,
                  so never present this as a full refund. */}
              <span
                className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  flight.refundable
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-red-100 text-red-600'
                }`}
              >
                {flight.refundable ? 'Refundable with penalty' : 'Non-Refundable'}
              </span>
            </Row>
          </tbody>
        </table>
      </Panel>

      {/* Real cancellation / change penalties from the airline */}
      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-500 py-3">
          <span className="w-4 h-4 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin" />
          Fetching the airline&apos;s latest cancellation and change charges…
        </div>
      )}

      {!loading && error && (
        <div className="flex items-start justify-between gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <p className="text-xs text-red-600">{error}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="text-xs font-semibold text-red-700 underline flex-shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && rules && rules.length > 0 && (
        <FareRulesAccordion fareRules={rules} />
      )}

      {!loading && !error && rules && rules.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-700">
          The airline has not published structured cancellation and change
          charges for this fare. They will be confirmed on the booking page
          before you pay.
        </div>
      )}

      <Notes
        items={[
          'Charges are levied by the airline per passenger, per journey, and are in addition to any applicable service charge.',
          'Fare rules are subject to change by the airline. The amounts confirmed at the time of booking apply.',
        ]}
      />
    </div>
  );
}

/* ─── Baggage Information Tab ─── */

function BaggageTab({ flight }: { flight: FlightResult }) {
  return (
    <div className="space-y-4">
      <Panel
        title="Baggage Allowance"
        subtitle="Free allowance included in this fare."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-[11px] uppercase tracking-wide text-gray-500">
                <th className="px-5 py-2.5 text-left font-medium">Sector/Flight</th>
                <th className="px-5 py-2.5 text-right font-medium">
                  Check-in Baggage
                </th>
                <th className="px-5 py-2.5 text-right font-medium">Cabin Baggage</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-5 py-2.5 text-gray-500 align-top">
                  {flight.from} - {flight.to}
                </td>
                <td className="px-5 py-2.5 text-right font-medium text-gray-700">
                  {flight.baggage || 'As per airline policy'}
                  {flight.pieceDescription && (
                    <span className="block text-xs text-gray-400 font-normal">
                      {flight.pieceDescription}
                    </span>
                  )}
                </td>
                {/* Benzy's search response carries no cabin-baggage field —
                    Inclusions.Baggage is check-in only. Printing a fixed weight
                    here would be inventing airline policy. */}
                <td className="px-5 py-2.5 text-right font-medium text-gray-700">
                  As per airline policy
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Same amber treatment the Fare tab uses for airline-side caveats */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-700">
        Adding of additional baggage is subject to load factor of the flight. In
        case baggage could not be added, payment for the additional baggage paid
        will be reverted.
      </div>

      <Notes
        items={[
          'The baggage allowance may vary according to stop-overs, connecting flights and changes in airline rules.',
          'Additional baggage can be added during the booking process.',
        ]}
      />
    </div>
  );
}
