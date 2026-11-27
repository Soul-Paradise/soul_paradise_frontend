'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { MapPin, CalendarDays, Search, AlertCircle, Users } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CalendarPanel } from './CalendarPanel';
import {
  ActionButton,
  ActionRow,
  DateValue,
  FIELD_GROUP,
  FIELD_PLACEHOLDER,
  FIELD_SUB,
  FIELD_VALUE,
  FieldLabel,
  OptionPills,
  TabHeader,
  fieldCell,
} from './ui';
import { usePersistentSearch, notBeforeToday, useDatePrefill } from '@/lib/hooks/useSearchPersistence';
import {
  getInsuranceCountries,
  getInsuranceOptions,
  getTripInsuranceOffer,
  saveInsurancePrefill,
  MULTITRIP_REGIONS,
  type InsuranceCountry,
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
  FAMILY: ['SELF', 'SPOUSE', 'SON', 'DAUGHTER', 'FATHER', 'MOTHER', 'BROTHER', 'SISTER'],
  FRIENDS: ['SELF', 'FRIEND'],
};

const RELATION_DISPLAY: Record<Relation, string> = {
  SELF: 'You',
  SPOUSE: 'Spouse',
  SON: 'Son',
  DAUGHTER: 'Daughter',
  FATHER: 'Father',
  MOTHER: 'Mother',
  BROTHER: 'Brother',
  SISTER: 'Sister',
  FRIEND: 'Friend',
};

/** Multi-Trip covers a region, offered as fixed destinations (negative ids never clash with places). */
const MULTITRIP_DESTINATIONS: SelectedLocation[] = MULTITRIP_REGIONS.map((r, i) => ({
  placeId: -(i + 1),
  displayName: r.name,
  countryName: r.name,
  countryCode: r.code,
}));
const isRegion = (d: SelectedLocation) => d.placeId < 0;

/** An Annual Multi-Trip policy covers 365 days, counting the start date. */
const MULTITRIP_DAYS = 365;

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

/** Countries get positive ids (regions are negative), so isRegion() still works. */
function countryLocation(c: InsuranceCountry, index: number): SelectedLocation {
  return { placeId: index + 1, displayName: c.label, countryName: c.name, countryCode: c.code };
}

/** Best matches first: label starts with the query, then a word starts with it, then contains / code. */
function matchCountries(list: InsuranceCountry[], query: string): InsuranceCountry[] {
  const q = query.trim().toLowerCase();
  if (!q) return list.filter((c) => c.popular);
  const rank = (c: InsuranceCountry) => {
    const l = c.label.toLowerCase();
    if (l.startsWith(q)) return 0;
    if (l.split(/[\s,()-]+/).some((w) => w.startsWith(q))) return 1;
    if (c.code.toLowerCase() === q) return 1;
    if (l.includes(q) || c.name.toLowerCase().includes(q)) return 2;
    return 9;
  };
  return list
    .map((c) => ({ c, r: rank(c) }))
    .filter((x) => x.r < 9)
    .sort((a, b) => a.r - b.r || a.c.label.localeCompare(b.c.label))
    .slice(0, 12)
    .map((x) => x.c);
}

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

/** Student end date: the start date plus the tenure (31 Jan + 1 month = 28/29 Feb). */
function addMonths(start: string, months: number): string {
  const d = new Date(start + 'T00:00:00');
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
  return toDateStr(d);
}

function addDays(start: string, days: number): string {
  const d = new Date(start + 'T00:00:00');
  d.setDate(d.getDate() + days);
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
  const [countries, setCountries] = useState<InsuranceCountry[] | null>(null);
  const [countriesError, setCountriesError] = useState(false);
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
      // Older saved searches held map places: keep one entry per country, shown by country name.
      if (Array.isArray(s.destinations)) {
        const seen = new Set<string>();
        setDestinations(
          s.destinations
            .filter((d) => d?.countryCode && !seen.has(d.countryCode) && seen.add(d.countryCode))
            .map((d) => (d.placeId < 0 ? d : { ...d, displayName: d.countryName })),
        );
      }
      setStartDate(notBeforeToday(s.startDate, todayStr()));
      setEndDate(notBeforeToday(s.endDate, tomorrowStr()));
      if (s.tenureInMonths) setTenureInMonths(s.tenureInMonths);
      if (hasTravellers) setTravellers(s.travellers);
    },
  );

  // A suggested holiday window (?from=&to=) sets the cover dates.
  useDatePrefill((from, to) => {
    setStartDate(from);
    setEndDate(to);
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setActivePanel(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // "Cover this trip?" (?offer=FLIGHT:<bookingId> from a confirmation page or
  // email): pre-fill destinations, dates and travellers from that booking.
  const searchParams = useSearchParams();
  const offerParam = searchParams.get('offer');
  const offerApplied = useRef<string | null>(null);
  useEffect(() => {
    if (!offerParam || offerApplied.current === offerParam || !countries) return;
    const [service, ...rest] = offerParam.split(':');
    const bookingId = rest.join(':');
    if ((service !== 'FLIGHT' && service !== 'HOTEL') || !bookingId) return;
    offerApplied.current = offerParam;
    getTripInsuranceOffer(service, bookingId)
      .then((o) => {
        if (!o.eligible) return;
        skipPolicyReset.current = o.policyType !== policyType;
        setPolicyType(o.policyType);
        setDestinations(
          o.countryCodes.flatMap((code) => {
            const i = countries.findIndex((c) => c.code === code);
            return i >= 0 ? [countryLocation(countries[i], i)] : [];
          }),
        );
        setStartDate(o.startDate);
        setEndDate(o.endDate);
        setTravellers(o.travellers.map((t, i) => ({ id: i + 1, birthdate: t.birthdate, relation: t.relation })));
        saveInsurancePrefill({
          travellers: o.travellers.map(({ relation, title, firstName, lastName, passportNumber }) => ({
            relation,
            title,
            firstName,
            lastName,
            passportNumber,
          })),
          contact: o.contact,
        });
        if (o.travellers.some((t) => !t.birthdate)) {
          setActivePanel('travellers');
          setError('Add each traveller’s date of birth to see prices.');
        }
      })
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offerParam, countries]);

  // Destinations come from Benzy's own country list (the names the insurer expects).
  useEffect(() => {
    getInsuranceCountries()
      .then((list) => setCountries(list))
      .catch(() => setCountriesError(true));
  }, []);
  const suggestions = useMemo(() => (countries ? matchCountries(countries, locationQuery) : []), [countries, locationQuery]);

  const pickLocation = useCallback(
    (c: InsuranceCountry) => {
      const loc = countryLocation(c, countries?.indexOf(c) ?? 0);
      setDestinations((prev) => (prev.find((d) => d.countryCode === loc.countryCode) ? prev : [...prev, loc]));
      setLocationQuery('');
    },
    [countries],
  );

  const usedRelations = travellers.map((t) => t.relation);
  const maxTravellers = MAX_TRAVELLERS[policyType];
  const isStudent = policyType === 'STUDENT';
  const isMultiTrip = policyType === 'ANNUAL MULTITRIP';
  // Student runs for the chosen tenure and Multi-Trip for 365 days (counting
  // the start date), so neither has an end date to pick.
  const effectiveEndDate = isStudent
    ? addMonths(startDate, tenureInMonths)
    : isMultiTrip
      ? addDays(startDate, MULTITRIP_DAYS - 1)
      : endDate;
  // Multi-Trip takes one region; other policies take countries.
  const tripDestinations = destinations.filter((d) => isRegion(d) === isMultiTrip);
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
    if (tripDestinations.length === 0) {
      setError(isMultiTrip ? 'Please choose the region to cover.' : 'Please select at least one destination.');
      return;
    }
    if (tripDestinations.some((d) => d.countryCode === 'IN')) {
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
    for (const d of tripDestinations) {
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
  const destinationLabel = tripDestinations.length === 0
    ? null
    : tripDestinations.length === 1
      ? tripDestinations[0].displayName
      : `${shortLocationName(tripDestinations[0].displayName)} +${tripDestinations.length - 1}`;

  return (
    <form onSubmit={handleSearch} className="space-y-5" ref={wrapperRef}>
      {/* Policy Type row - same pill switch as the Flights trip type */}
      <TabHeader tagline="Travel Insurance for Every Kind of Trip">
        <OptionPills
          name="policyType"
          label="Policy type"
          options={policyTypes}
          value={policyType}
          onChange={setPolicyType}
        />
      </TabHeader>

      {/* Main fields row - same bordered container as every tab */}
      <div className={FIELD_GROUP}>
        <div className="grid grid-cols-2 sm:flex sm:items-stretch divide-y divide-gray-200 sm:divide-y-0">

          {/* Destination */}
          <button
            type="button"
            onClick={() => { setActivePanel(activePanel === 'destination' ? null : 'destination'); setLocationQuery(''); }}
            className={`col-span-2 sm:flex-[2] min-w-0 sm:border-r sm:border-gray-200 ${fieldCell(activePanel === 'destination')}`}
          >
            <FieldLabel icon={MapPin} active={activePanel === 'destination'}>
              Destination
            </FieldLabel>
            <div className={`truncate ${destinationLabel ? FIELD_VALUE : FIELD_PLACEHOLDER}`}>
              {destinationLabel ?? (isMultiTrip ? 'Choose region' : 'Search country')}
            </div>
          </button>

          {/* Dates wrapper - relative so calendar anchors under the date fields */}
          <div className="col-span-2 grid grid-cols-2 sm:flex sm:flex-[2.6] relative sm:border-r sm:border-gray-200">
            {/* Start Date */}
            <button
              type="button"
              onClick={() => { setDateTab('start'); setActivePanel('dates'); }}
              className={`sm:flex-1 border-r border-gray-200 ${fieldCell(activePanel === 'dates' && dateTab === 'start')}`}
            >
              <FieldLabel icon={CalendarDays} active={activePanel === 'dates' && dateTab === 'start'}>
                Start Date
              </FieldLabel>
              {startDisplay ? (
                <DateValue day={startDisplay.day} monthYear={startDisplay.monthYear} weekday={startDisplay.weekday} />
              ) : (
                <div className={FIELD_PLACEHOLDER}>Select date</div>
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
              className={`sm:flex-1 ${fieldCell((activePanel === 'dates' && dateTab === 'end') || activePanel === 'tenure')}`}
            >
              <FieldLabel icon={CalendarDays} active={(activePanel === 'dates' && dateTab === 'end') || activePanel === 'tenure'}>
                {isStudent ? 'Tenure' : isMultiTrip ? 'Covered Until' : 'End Date'}
              </FieldLabel>
              {isStudent ? (
                <>
                  <div className={FIELD_VALUE}>
                    {TENURE_OPTIONS.find((o) => o.value === tenureInMonths)?.label}
                  </div>
                  <div className={FIELD_SUB}>Until {formatDisplayDate(effectiveEndDate)?.day} {formatDisplayDate(effectiveEndDate)?.monthYear}</div>
                </>
              ) : endDisplay ? (
                <DateValue day={endDisplay.day} monthYear={endDisplay.monthYear} weekday={endDisplay.weekday} />
              ) : (
                <div className={FIELD_PLACEHOLDER}>Select date</div>
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
                      className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${tenureInMonths === o.value ? 'bg-blue-50 text-(--color-links)' : 'hover:bg-gray-50 text-gray-700'}`}
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
            className={`col-span-2 sm:flex-[1.3] ${fieldCell(activePanel === 'travellers')}`}
          >
            <FieldLabel icon={Users} active={activePanel === 'travellers'}>
              Travellers
            </FieldLabel>
            <div className={FIELD_VALUE}>
              {travellers.length} Traveller{travellers.length !== 1 ? 's' : ''}
            </div>
            <div className={FIELD_SUB}>
              {travellers.every((t) => t.birthdate) ? 'DOB added' : 'DOB required'}
            </div>
          </button>
        </div>

        {/* Multi-Trip region picker */}
        {activePanel === 'destination' && isMultiTrip && (
          <div className="absolute top-full left-0 z-50 w-full sm:w-80 bg-white rounded-xl shadow-2xl border border-gray-100 mt-1 p-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-1">Region covered</p>
            {MULTITRIP_DESTINATIONS.map((r) => {
              const selected = tripDestinations[0]?.countryCode === r.countryCode;
              return (
                <button
                  key={r.countryCode}
                  type="button"
                  onClick={() => {
                    setDestinations((prev) => [...prev.filter((d) => !isRegion(d)), r]);
                    setActivePanel(null);
                  }}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-3 ${selected ? 'bg-blue-50 text-(--color-links)' : 'hover:bg-gray-50 text-gray-700'}`}
                >
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  {r.displayName}
                </button>
              );
            })}
          </div>
        )}

        {/* Destination Dropdown */}
        {activePanel === 'destination' && !isMultiTrip && (
          <div className="absolute top-full left-0 z-50 w-full sm:w-80 bg-white rounded-xl shadow-2xl border border-gray-100 mt-1 overflow-hidden">
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  autoFocus
                  type="text"
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  placeholder="Search country..."
                  className="flex-1 outline-none text-sm text-gray-800 placeholder-gray-400"
                />
              </div>
              {tripDestinations.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {tripDestinations.map((d) => (
                    <span key={d.placeId} className="inline-flex items-center gap-1 max-w-full px-2 py-0.5 bg-blue-50 text-(--color-links) text-xs font-medium rounded-full border border-blue-200">
                      <span className="truncate" title={d.displayName}>{d.displayName}</span>
                      <button type="button" onClick={() => removeDestination(d.placeId)} className="text-blue-300 hover:text-(--color-links) flex-shrink-0">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="max-h-64 overflow-y-auto">
              {countriesError ? (
                <div className="px-4 py-3 text-sm text-gray-400">Could not load destinations. Please try again.</div>
              ) : !countries ? (
                <div className="px-4 py-3 text-sm text-gray-400">Loading destinations...</div>
              ) : suggestions.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-400">No matching country</div>
              ) : (
                <>
                  {!locationQuery.trim() && (
                    <div className="px-4 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">Popular destinations</div>
                  )}
                  {suggestions.map((c) => {
                    const already = destinations.some((d) => d.countryCode === c.code);
                    return (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => pickLocation(c)}
                        disabled={already}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 border-b border-gray-50 last:border-0"
                      >
                        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="min-w-0 flex-1 text-sm font-semibold text-gray-800 truncate">{c.label}</span>
                        <span className="text-[11px] text-gray-400 flex-shrink-0">{c.code}</span>
                        {already && <span className="text-[10px] text-(--color-links) font-semibold flex-shrink-0">ADDED</span>}
                      </button>
                    );
                  })}
                </>
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
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-(--color-links) flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</div>
                      <span className="truncate">{travellerDisplayName(travellers, i)}</span>
                    </div>
                    <div className="flex-1 min-w-[150px]">
                      <label className="block text-xs text-gray-500 mb-1">Date of Birth *</label>
                      <input
                        type="date"
                        value={t.birthdate}
                        max={todayStr()}
                        onChange={(e) => updateTraveller(i, { ...t, birthdate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-(--color-links) outline-none"
                      />
                    </div>
                    {allRelations.length > 1 && (
                      <div className="flex-1 min-w-[110px]">
                        <label className="block text-xs text-gray-500 mb-1">Relation *</label>
                        <select
                          value={t.relation}
                          onChange={(e) => updateTraveller(i, { ...t, relation: e.target.value as Relation })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-(--color-links) outline-none bg-white"
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
                <button type="button" onClick={addTraveller} className="text-sm font-bold text-(--color-accent) flex items-center gap-1 hover:underline">
                  <span>+</span> Add Traveller
                </button>
              ) : <div />}
              <button type="button" onClick={() => setActivePanel(null)} className="px-5 py-2 bg-(--color-accent) text-white text-sm font-bold rounded-lg">DONE</button>
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

      {/* GET QUOTE button - same as every tab */}
      <ActionRow>
        <ActionButton type="submit">Get Quote</ActionButton>
      </ActionRow>
    </form>
  );
};
