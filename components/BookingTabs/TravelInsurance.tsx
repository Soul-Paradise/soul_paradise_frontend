'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin, CalendarDays, Search, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { CalendarPanel } from './CalendarPanel';
import { usePersistentSearch, notBeforeToday } from '@/lib/hooks/useSearchPersistence';
import {
  getInsuranceOptions,
  searchToParams,
  type PolicyType,
  type PolicyTypeOption,
  type Relation,
} from '@/lib/insurance-api';

interface Traveller {
  id: number;
  birthdate: string;
  relation: Relation;
}

interface SelectedLocation {
  placeId: number;
  displayName: string;
  countryName: string;
  countryCode: string;
}

interface InsuranceSearchSnapshot {
  policyType: PolicyType;
  destinations: SelectedLocation[];
  startDate: string;
  endDate: string;
  tenureInMonths: number;
  travellers: Traveller[];
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  address?: {
    country?: string;
    country_code?: string;
  };
}

// Used until GetProviderCheckList answers (and if it can't be reached); the
// buttons then show only the policy types Benzy reports as enabled.
const FALLBACK_POLICY_TYPES: { value: PolicyType; label: string }[] = [
  { value: 'INDIVIDUAL', label: 'Individual' },
  { value: 'FAMILY', label: 'Family' },
  { value: 'FRIENDS', label: 'Friends' },
  { value: 'STUDENT', label: 'Student' },
  { value: 'ANNUAL MULTITRIP', label: 'Multi-Trip' },
];

const POLICY_BUTTON_LABELS: Record<PolicyType, string> = {
  INDIVIDUAL: 'Individual',
  FAMILY: 'Family',
  FRIENDS: 'Friends',
  STUDENT: 'Student',
  'ANNUAL MULTITRIP': 'Multi-Trip',
};

const RELATION_OPTIONS: Record<PolicyType, Relation[]> = {
  INDIVIDUAL: ['SELF'],
  'ANNUAL MULTITRIP': ['SELF'],
  STUDENT: ['SELF'],
  FAMILY: ['SELF', 'SPOUSE', 'SON', 'DAUGHTER', 'FATHER', 'MOTHER'],
  FRIENDS: ['SELF', 'FRIEND'],
};

const RELATION_DISPLAY: Record<Relation, string> = {
  SELF: 'You',
  SPOUSE: 'Spouse',
  SON: 'Son',
  DAUGHTER: 'Daughter',
  FATHER: 'Father',
  MOTHER: 'Mother',
  FRIEND: 'Friend',
};

/** Customer-facing name for a traveller row, e.g. "You", "Spouse", "Friend 2". */
function travellerDisplayName(travellers: Traveller[], index: number): string {
  const relation = travellers[index].relation;
  const base = RELATION_DISPLAY[relation] ?? relation.charAt(0) + relation.slice(1).toLowerCase();
  const sameRelation = travellers.filter((t) => t.relation === relation).length;
  if (sameRelation < 2) return base;
  const ordinal = travellers.slice(0, index + 1).filter((t) => t.relation === relation).length;
  return `${base} ${ordinal}`;
}

const MAX_TRAVELLERS: Record<PolicyType, number> = {
  INDIVIDUAL: 1,
  'ANNUAL MULTITRIP': 1,
  STUDENT: 1,
  FAMILY: 6,
  FRIENDS: 6,
};

const TENURE_OPTIONS = [
  { value: 1, label: '1 Month' },
  { value: 2, label: '2 Months' },
  { value: 3, label: '3 Months' },
  { value: 6, label: '6 Months' },
  { value: 12, label: '12 Months' },
  { value: 18, label: '18 Months' },
  { value: 24, label: '24 Months' },
];

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function todayStr(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return toDateStr(d);
}

function tomorrowStr(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  return toDateStr(d);
}

/** Last day of cover for a policy that starts on `start` and runs `months` months. */
function coverEndDate(start: string, months: number): string {
  const d = new Date(start + 'T00:00:00');
  d.setMonth(d.getMonth() + months);
  d.setDate(d.getDate() - 1);
  return toDateStr(d);
}

function defaultTravellersForPolicy(policyType: PolicyType): Traveller[] {
  return [{ id: 1, birthdate: '', relation: RELATION_OPTIONS[policyType][0] }];
}

function formatDisplayDate(dateStr: string) {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T00:00:00');
  return {
    day: d.getDate().toString().padStart(2, '0'),
    monthYear: `${d.toLocaleString('default', { month: 'short' })}'${d.getFullYear().toString().slice(2)}`,
    weekday: d.toLocaleString('default', { weekday: 'long' }),
  };
}

export const TravelInsurance = () => {
  const router = useRouter();
  const wrapperRef = useRef<HTMLFormElement>(null);

  const [policyType, setPolicyType] = useState<PolicyType>('INDIVIDUAL');
  const [destinations, setDestinations] = useState<SelectedLocation[]>([]);
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(tomorrowStr);
  const [tenureInMonths, setTenureInMonths] = useState(3);
  const [travellers, setTravellers] = useState<Traveller[]>(defaultTravellersForPolicy('INDIVIDUAL'));
  const [error, setError] = useState('');

  const [activePanel, setActivePanel] = useState<'destination' | 'dates' | 'tenure' | 'travellers' | null>(null);
  const [dateTab, setDateTab] = useState<'start' | 'end'>('start');
  const [locationQuery, setLocationQuery] = useState('');
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [policyOptions, setPolicyOptions] = useState<PolicyTypeOption[] | null>(null);

  // Workflow step 1 (GetProviderCheckList): which policy types are on offer.
  useEffect(() => {
    getInsuranceOptions()
      .then((o) => setPolicyOptions(o.policyTypes.length ? o.policyTypes : null))
      .catch(() => setPolicyOptions(null));
  }, []);
  const policyTypes = policyOptions
    ? policyOptions.map((o) => ({ value: o.value, label: POLICY_BUTTON_LABELS[o.value] ?? o.label }))
    : FALLBACK_POLICY_TYPES;

  // When restoring a saved search, we set policyType AND its travellers together;
  // this lets us skip the one reset the policyType effect would otherwise fire
  // (which would wipe the restored travellers).
  const skipPolicyReset = useRef(false);

  useEffect(() => {
    if (skipPolicyReset.current) {
      skipPolicyReset.current = false;
      return;
    }
    setTravellers(defaultTravellersForPolicy(policyType));
  }, [policyType]);

  // Remember the last search on this device and pre-fill it on the next visit.
  usePersistentSearch<InsuranceSearchSnapshot>(
    'insurance',
    { policyType, destinations, startDate, endDate, tenureInMonths, travellers },
    (s) => {
      const hasTravellers = Array.isArray(s.travellers) && s.travellers.length > 0;
      // Only a real policy change re-triggers the reset effect we need to skip.
      if (s.policyType && s.policyType !== policyType) {
        if (hasTravellers) skipPolicyReset.current = true;
        setPolicyType(s.policyType);
      }
      if (Array.isArray(s.destinations)) setDestinations(s.destinations);
      setStartDate(notBeforeToday(s.startDate, todayStr()));
      setEndDate(notBeforeToday(s.endDate, tomorrowStr()));
      if (s.tenureInMonths) setTenureInMonths(s.tenureInMonths);
      if (hasTravellers) setTravellers(s.travellers);
    },
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setActivePanel(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const q = locationQuery.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setSearching(false);
      return;
    }
    const controller = new AbortController();
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const url = `${NOMINATIM_URL}?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=6`;
        const res = await fetch(url, {
          signal: controller.signal,
          headers: { 'Accept-Language': 'en' },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as NominatimResult[];
        setSuggestions(json.filter((r) => r.address?.country && r.address?.country_code));
      } catch (err) {
        if ((err as Error).name !== 'AbortError') setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [locationQuery]);

  const pickLocation = useCallback((r: NominatimResult) => {
    if (!r.address?.country || !r.address?.country_code) return;
    const loc: SelectedLocation = {
      placeId: r.place_id,
      displayName: r.display_name,
      countryName: r.address.country,
      countryCode: r.address.country_code.toUpperCase(),
    };
    setDestinations((prev) =>
      prev.find((d) => d.placeId === loc.placeId) ? prev : [...prev, loc],
    );
    setLocationQuery('');
    setSuggestions([]);
  }, []);

  const usedRelations = travellers.map((t) => t.relation);
  const maxTravellers = MAX_TRAVELLERS[policyType];
  const isStudent = policyType === 'STUDENT';
  const isMultiTrip = policyType === 'ANNUAL MULTITRIP';
  // Student runs for the chosen tenure and Multi-Trip for a year from the
  // start date, so neither has an end date to pick.
  const effectiveEndDate = isStudent
    ? coverEndDate(startDate, tenureInMonths)
    : isMultiTrip
      ? coverEndDate(startDate, 12)
      : endDate;
  const isMultiPax = policyType === 'FAMILY' || policyType === 'FRIENDS';

  const addTraveller = () => {
    if (travellers.length >= maxTravellers) return;
    const relations = RELATION_OPTIONS[policyType];
    const nextRelation =
      relations.find((r) => r !== 'SELF' && !usedRelations.includes(r)) ??
      relations[relations.length - 1];
    setTravellers((prev) => [...prev, { id: prev.length + 1, birthdate: '', relation: nextRelation }]);
  };

  const updateTraveller = (index: number, updated: Traveller) => {
    setTravellers((prev) => prev.map((t, i) => (i === index ? updated : t)));
  };

  const removeTraveller = (index: number) => {
    setTravellers((prev) =>
      prev.filter((_, i) => i !== index).map((t, i) => ({ ...t, id: i + 1 })),
    );
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (destinations.length === 0) { setError('Please select at least one destination.'); return; }
    if (destinations.some((d) => d.countryCode === 'IN')) {
      setError('Travel insurance covers trips outside India. Please remove destinations in India.');
      return;
    }
    if (!startDate) { setError('Please select a travel start date.'); return; }
    if (!effectiveEndDate) { setError('Please select a travel end date.'); return; }
    if (effectiveEndDate <= startDate) { setError('End date must be after start date.'); return; }
    for (const t of travellers) {
      if (!t.birthdate) { setError('Please enter date of birth for all travellers.'); return; }
    }

    const uniqueCodes: string[] = [];
    const uniqueNames: string[] = [];
    for (const d of destinations) {
      if (!uniqueCodes.includes(d.countryCode)) {
        uniqueCodes.push(d.countryCode);
        uniqueNames.push(d.countryName);
      }
    }

    const params = searchToParams({
      policyType,
      countryCodes: uniqueCodes,
      countryNames: uniqueNames,
      startDate,
      endDate: effectiveEndDate,
      tenureInMonths: isStudent ? tenureInMonths : 0,
      travellers: travellers.map((t) => ({ birthdate: t.birthdate, relation: t.relation })),
    });
    router.push(`/booking/insurance?${params.toString()}`);
  };

  const removeDestination = (placeId: number) =>
    setDestinations((prev) => prev.filter((d) => d.placeId !== placeId));

  const shortLocationName = (displayName: string) => displayName.split(',')[0].trim();

  const startDisplay = formatDisplayDate(startDate);
  const endDisplay = formatDisplayDate(effectiveEndDate);
  const destinationLabel = destinations.length === 0
    ? null
    : destinations.length === 1
      ? destinations[0].displayName
      : `${shortLocationName(destinations[0].displayName)} +${destinations.length - 1}`;

  return (
    <form onSubmit={handleSearch} className="space-y-5" ref={wrapperRef}>
      {/* Policy Type row - like Special Fares in Flights */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Policy Type</span>
        <div className="flex flex-wrap gap-2">
          {policyTypes.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setPolicyType(value)}
              className={`px-3 py-1.5 rounded border text-xs font-semibold transition-all ${
                policyType === value
                  ? 'border-[#1F7AC4] bg-blue-50 text-[#1F7AC4]'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Main fields row - same bordered container as Flights/Hotels */}
      <div className="relative border-2 border-gray-200 rounded-xl overflow-visible bg-white">
        <div className="grid grid-cols-2 sm:flex sm:items-stretch divide-y divide-gray-200 sm:divide-y-0">

          {/* Destination */}
          <button
            type="button"
            onClick={() => { setActivePanel(activePanel === 'destination' ? null : 'destination'); setLocationQuery(''); }}
            className={`col-span-2 sm:flex-[2] text-left px-5 py-4 transition-colors min-w-0 sm:border-r sm:border-gray-200 ${activePanel === 'destination' ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
          >
            <div className={`text-[10px] font-bold tracking-widest uppercase mb-1 ${activePanel === 'destination' ? 'text-[#1F7AC4]' : 'text-gray-500'}`}>
              Destination
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className={`text-lg font-bold truncate ${destinationLabel ? 'text-gray-900' : 'text-gray-400'}`}>
                {destinationLabel ?? 'Search city or country'}
              </span>
            </div>
          </button>

          {/* Dates wrapper - relative so calendar anchors under the date fields */}
          <div className="col-span-2 grid grid-cols-2 sm:flex sm:flex-[2.6] relative sm:border-r sm:border-gray-200">
            {/* Start Date */}
            <button
              type="button"
              onClick={() => { setDateTab('start'); setActivePanel('dates'); }}
              className={`sm:flex-1 text-left px-5 py-4 transition-colors border-r border-gray-200 ${activePanel === 'dates' && dateTab === 'start' ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
            >
              <div className={`text-[10px] font-bold tracking-widest uppercase mb-1 flex items-center gap-1 ${activePanel === 'dates' && dateTab === 'start' ? 'text-[#1F7AC4]' : 'text-gray-500'}`}>
                <CalendarDays className="w-3 h-3" />
                Start Date
              </div>
              {startDisplay ? (
                <>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-gray-900 leading-none">{startDisplay.day}</span>
                    <span className="text-base font-bold text-gray-900">{startDisplay.monthYear}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{startDisplay.weekday}</div>
                </>
              ) : (
                <span className="text-lg font-bold text-gray-400">Select date</span>
              )}
            </button>

            {/* End Date / Tenure */}
            <button
              type="button"
              onClick={() => {
                if (isStudent) {
                  setActivePanel(activePanel === 'tenure' ? null : 'tenure');
                } else if (isMultiTrip) {
                  setDateTab('start');
                  setActivePanel('dates');
                } else {
                  setDateTab('end');
                  setActivePanel('dates');
                }
              }}
              className={`sm:flex-1 text-left px-5 py-4 transition-colors ${(activePanel === 'dates' && dateTab === 'end') || activePanel === 'tenure' ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
            >
              <div className={`text-[10px] font-bold tracking-widest uppercase mb-1 flex items-center gap-1 ${(activePanel === 'dates' && dateTab === 'end') || activePanel === 'tenure' ? 'text-[#1F7AC4]' : 'text-gray-500'}`}>
                <CalendarDays className="w-3 h-3" />
                {isStudent ? 'Tenure' : isMultiTrip ? 'Covered Until' : 'End Date'}
              </div>
              {isStudent ? (
                <>
                  <span className="text-lg font-bold text-gray-900">
                    {TENURE_OPTIONS.find((o) => o.value === tenureInMonths)?.label}
                  </span>
                  <div className="text-xs text-gray-500 mt-0.5">Until {formatDisplayDate(effectiveEndDate)?.day} {formatDisplayDate(effectiveEndDate)?.monthYear}</div>
                </>
              ) : endDisplay ? (
                <>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-gray-900 leading-none">{endDisplay.day}</span>
                    <span className="text-base font-bold text-gray-900">{endDisplay.monthYear}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{endDisplay.weekday}</div>
                </>
              ) : (
                <span className="text-lg font-bold text-gray-400">Select date</span>
              )}
            </button>

            {/* Shared CalendarPanel: a range for single trips, just the start
                date for Student / Multi-Trip (their end date follows from it). */}
            {(() => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const startObj = startDate ? new Date(startDate + 'T00:00:00') : null;
              const endObj = endDate ? new Date(endDate + 'T00:00:00') : null;
              const toStr = (d: Date) =>
                `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
              return (
                <CalendarPanel
                  isOpen={activePanel === 'dates'}
                  mode={isStudent || isMultiTrip ? 'single' : 'range'}
                  startDate={startObj}
                  endDate={isStudent || isMultiTrip ? null : endObj}
                  activeTab={isStudent || isMultiTrip ? 'start' : dateTab}
                  onActiveTabChange={setDateTab}
                  startLabel="Start date"
                  endLabel="End date"
                  minDate={today}
                  onChange={(start, end) => {
                    setStartDate(toStr(start));
                    if (end) setEndDate(toStr(end));
                    if (isStudent || isMultiTrip) setActivePanel(null);
                  }}
                  onClose={() => setActivePanel(null)}
                />
              );
            })()}

            {/* Student tenure dropdown */}
            {activePanel === 'tenure' && (
              <div className="absolute top-full left-0 sm:left-auto sm:right-0 z-50 w-full sm:w-72 bg-white rounded-xl shadow-2xl border border-gray-100 mt-1 p-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Tenure</p>
                <div className="space-y-1">
                  {TENURE_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => { setTenureInMonths(o.value); setActivePanel(null); }}
                      className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${tenureInMonths === o.value ? 'bg-blue-50 text-[#1F7AC4]' : 'hover:bg-gray-50 text-gray-700'}`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Travellers */}
          <button
            type="button"
            onClick={() => setActivePanel(activePanel === 'travellers' ? null : 'travellers')}
            className={`col-span-2 sm:flex-[1.3] text-left px-5 py-4 transition-colors ${activePanel === 'travellers' ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
          >
            <div className={`text-[10px] font-bold tracking-widest uppercase mb-1 ${activePanel === 'travellers' ? 'text-[#1F7AC4]' : 'text-gray-500'}`}>
              Travellers
            </div>
            <div className="text-lg font-bold text-gray-900 leading-tight">
              {travellers.length} Traveller{travellers.length !== 1 ? 's' : ''}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {travellers.every((t) => t.birthdate) ? 'DOB added' : 'DOB required'}
            </div>
          </button>
        </div>

        {/* Destination Dropdown */}
        {activePanel === 'destination' && (
          <div className="absolute top-full left-0 z-50 w-full sm:w-80 bg-white rounded-xl shadow-2xl border border-gray-100 mt-1 overflow-hidden">
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  autoFocus
                  type="text"
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  placeholder="Enter city or country..."
                  className="flex-1 outline-none text-sm text-gray-800 placeholder-gray-400"
                />
              </div>
              {destinations.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {destinations.map((d) => (
                    <span key={d.placeId} className="inline-flex items-center gap-1 max-w-full px-2 py-0.5 bg-blue-50 text-[#1F7AC4] text-xs font-medium rounded-full border border-blue-200">
                      <span className="truncate" title={d.displayName}>{d.displayName}</span>
                      <button type="button" onClick={() => removeDestination(d.placeId)} className="text-blue-300 hover:text-blue-600 flex-shrink-0">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="max-h-64 overflow-y-auto">
              {locationQuery.trim().length < 2 ? (
                <div className="px-4 py-3 text-sm text-gray-400">
                  Start typing to search locations
                </div>
              ) : searching && suggestions.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-400">Searching...</div>
              ) : suggestions.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-400">No results found</div>
              ) : (
                suggestions.map((r) => {
                  const already = destinations.some((d) => d.placeId === r.place_id);
                  return (
                    <button
                      key={r.place_id}
                      type="button"
                      onClick={() => pickLocation(r)}
                      disabled={already}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-start gap-3 border-b border-gray-50 last:border-0"
                    >
                      <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-gray-800 truncate">{shortLocationName(r.display_name)}</div>
                        <div className="text-xs text-gray-400 truncate">{r.display_name}</div>
                      </div>
                      {already && <span className="text-[10px] text-[#1F7AC4] font-semibold flex-shrink-0">ADDED</span>}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Travellers Dropdown */}
        {activePanel === 'travellers' && (
          <div className="absolute top-full right-0 z-50 w-full sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-100 mt-1 p-4">
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {travellers.map((t, i) => {
                const allRelations = RELATION_OPTIONS[policyType];
                const availableRelations = allRelations.filter(
                  (r) => r !== 'SELF' || !usedRelations.includes('SELF') || t.relation === 'SELF',
                );
                return (
                  <div key={i} className="flex flex-wrap gap-2 items-end p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 w-24">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-[#1F7AC4] flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</div>
                      <span className="truncate">{travellerDisplayName(travellers, i)}</span>
                    </div>
                    <div className="flex-1 min-w-[150px]">
                      <label className="block text-xs text-gray-500 mb-1">Date of Birth *</label>
                      <input
                        type="date"
                        value={t.birthdate}
                        max={todayStr()}
                        onChange={(e) => updateTraveller(i, { ...t, birthdate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1F7AC4] outline-none"
                      />
                    </div>
                    {allRelations.length > 1 && (
                      <div className="flex-1 min-w-[110px]">
                        <label className="block text-xs text-gray-500 mb-1">Relation *</label>
                        <select
                          value={t.relation}
                          onChange={(e) => updateTraveller(i, { ...t, relation: e.target.value as Relation })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1F7AC4] outline-none bg-white"
                        >
                          {availableRelations.map((r) => (
                            <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    {isMultiPax && travellers.length > 1 && (
                      <button type="button" onClick={() => removeTraveller(i)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              {isMultiPax && travellers.length < maxTravellers ? (
                <button type="button" onClick={addTraveller} className="text-sm font-bold text-[#D34E4E] flex items-center gap-1 hover:underline">
                  <span>+</span> Add Traveller
                </button>
              ) : <div />}
              <button type="button" onClick={() => setActivePanel(null)} className="px-5 py-2 bg-[#D34E4E] text-white text-sm font-bold rounded-lg">DONE</button>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* GET QUOTE button - matches Flights/Hotels SEARCH button */}
      <div className="flex justify-end">
        <button
          type="submit"
          className="px-10 py-3.5 bg-[#D34E4E] hover:bg-red-600 text-white text-sm font-bold rounded-full shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all uppercase tracking-wide"
        >
          GET QUOTE
        </button>
      </div>
    </form>
  );
};
