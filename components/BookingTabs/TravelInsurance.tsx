'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

type PolicyType = 'INDIVIDUAL' | 'FAMILY' | 'FRIENDS' | 'STUDENT' | 'ANNUAL MULTITRIP';

interface Traveller {
  id: number;
  birthdate: string;
  relation: string;
}

interface CountryOption {
  name: string;
  code: string;
}

const POLICY_TYPES: { value: PolicyType; label: string }[] = [
  { value: 'INDIVIDUAL', label: 'Individual' },
  { value: 'FAMILY', label: 'Family' },
  { value: 'FRIENDS', label: 'Friends' },
  { value: 'STUDENT', label: 'Student' },
  { value: 'ANNUAL MULTITRIP', label: 'Multi-Trip' },
];

const RELATION_OPTIONS: Record<PolicyType, string[]> = {
  INDIVIDUAL: ['SELF'],
  'ANNUAL MULTITRIP': ['SELF'],
  STUDENT: ['SELF'],
  FAMILY: ['SELF', 'SPOUSE', 'SON', 'DAUGHTER', 'FATHER', 'MOTHER'],
  FRIENDS: ['SELF', 'FRIEND'],
};

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

const COUNTRIES: CountryOption[] = [
  { name: 'United States', code: 'US' },
  { name: 'United Kingdom', code: 'GB' },
  { name: 'France', code: 'FR' },
  { name: 'Germany', code: 'DE' },
  { name: 'Italy', code: 'IT' },
  { name: 'Spain', code: 'ES' },
  { name: 'Japan', code: 'JP' },
  { name: 'Australia', code: 'AU' },
  { name: 'Canada', code: 'CA' },
  { name: 'Singapore', code: 'SG' },
  { name: 'Thailand', code: 'TH' },
  { name: 'Malaysia', code: 'MY' },
  { name: 'Indonesia', code: 'ID' },
  { name: 'Sri Lanka', code: 'LK' },
  { name: 'Nepal', code: 'NP' },
  { name: 'Bhutan', code: 'BT' },
  { name: 'Maldives', code: 'MV' },
  { name: 'Dubai', code: 'AE' },
  { name: 'Saudi Arabia', code: 'SA' },
  { name: 'South Africa', code: 'ZA' },
  { name: 'Kenya', code: 'KE' },
  { name: 'Egypt', code: 'EG' },
  { name: 'New Zealand', code: 'NZ' },
  { name: 'Netherlands', code: 'NL' },
  { name: 'Switzerland', code: 'CH' },
  { name: 'Greece', code: 'GR' },
  { name: 'Portugal', code: 'PT' },
  { name: 'Turkey', code: 'TR' },
  { name: 'Russia', code: 'RU' },
  { name: 'China', code: 'CN' },
  { name: 'South Korea', code: 'KR' },
  { name: 'Hong Kong', code: 'HK' },
  { name: 'Vietnam', code: 'VN' },
  { name: 'Cambodia', code: 'KH' },
  { name: 'Philippines', code: 'PH' },
  { name: 'Mexico', code: 'MX' },
  { name: 'Brazil', code: 'BR' },
  { name: 'Argentina', code: 'AR' },
  { name: 'Europe (Schengen)', code: 'EU' },
];

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
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
  const [destinations, setDestinations] = useState<CountryOption[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [tenureInMonths, setTenureInMonths] = useState(3);
  const [travellers, setTravellers] = useState<Traveller[]>(defaultTravellersForPolicy('INDIVIDUAL'));
  const [error, setError] = useState('');

  const [activePanel, setActivePanel] = useState<'destination' | 'startDate' | 'endDate' | 'travellers' | null>(null);
  const [countryQuery, setCountryQuery] = useState('');

  useEffect(() => {
    setTravellers(defaultTravellersForPolicy(policyType));
  }, [policyType]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setActivePanel(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredCountries = countryQuery.length < 1
    ? COUNTRIES
    : COUNTRIES.filter((c) =>
        c.name.toLowerCase().includes(countryQuery.toLowerCase()) ||
        c.code.toLowerCase().includes(countryQuery.toLowerCase()),
      );

  const toggleCountry = useCallback((c: CountryOption) => {
    setDestinations((prev) =>
      prev.find((d) => d.code === c.code)
        ? prev.filter((d) => d.code !== c.code)
        : [...prev, c],
    );
  }, []);

  const usedRelations = travellers.map((t) => t.relation);
  const maxTravellers = MAX_TRAVELLERS[policyType];
  const isStudent = policyType === 'STUDENT';
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
    if (destinations.length === 0) { setError('Please select at least one destination country.'); return; }
    if (!startDate) { setError('Please select a travel start date.'); return; }
    if (!isStudent && !endDate) { setError('Please select a travel end date.'); return; }
    if (!isStudent && endDate <= startDate) { setError('End date must be after start date.'); return; }
    for (const t of travellers) {
      if (!t.birthdate) { setError('Please enter date of birth for all travellers.'); return; }
    }

    const params = new URLSearchParams({
      policyType,
      countryCodes: destinations.map((d) => d.code).join(','),
      countryNames: destinations.map((d) => d.name).join(','),
      startDate,
      endDate: isStudent ? startDate : endDate,
      tenureInMonths: String(isStudent ? tenureInMonths : 0),
      travellers: JSON.stringify(
        travellers.map((t, i) => ({ id: i, birthdate: t.birthdate, relation: t.relation })),
      ),
    });
    router.push(`/booking/insurance?${params.toString()}`);
  };

  const startDisplay = formatDisplayDate(startDate);
  const endDisplay = formatDisplayDate(endDate);
  const destinationLabel = destinations.length === 0
    ? null
    : destinations.length === 1
      ? destinations[0].name
      : `${destinations[0].name} +${destinations.length - 1}`;

  return (
    <form onSubmit={handleSearch} className="space-y-5" ref={wrapperRef}>
      {/* Policy Type row — like Special Fares in Flights */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Policy Type</span>
        <div className="flex flex-wrap gap-2">
          {POLICY_TYPES.map(({ value, label }) => (
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

      {/* Main fields row — same bordered container as Flights/Hotels */}
      <div className="relative border-2 border-gray-200 rounded-xl overflow-visible bg-white">
        <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-gray-200">

          {/* Destination */}
          <button
            type="button"
            onClick={() => { setActivePanel(activePanel === 'destination' ? null : 'destination'); setCountryQuery(''); }}
            className={`flex-[2] text-left px-5 py-4 transition-colors min-w-0 ${activePanel === 'destination' ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
          >
            <div className={`text-[10px] font-bold tracking-widest uppercase mb-1 ${activePanel === 'destination' ? 'text-[#1F7AC4]' : 'text-gray-500'}`}>
              Destination Country
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
              </svg>
              <span className={`text-lg font-bold truncate ${destinationLabel ? 'text-gray-900' : 'text-gray-400'}`}>
                {destinationLabel ?? 'Select Country'}
              </span>
            </div>
          </button>

          {/* Start Date */}
          <button
            type="button"
            onClick={() => setActivePanel(activePanel === 'startDate' ? null : 'startDate')}
            className={`flex-[1.3] text-left px-5 py-4 transition-colors ${activePanel === 'startDate' ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
          >
            <div className={`text-[10px] font-bold tracking-widest uppercase mb-1 flex items-center gap-1 ${activePanel === 'startDate' ? 'text-[#1F7AC4]' : 'text-gray-500'}`}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
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
            onClick={() => setActivePanel(activePanel === 'endDate' ? null : 'endDate')}
            className={`flex-[1.3] text-left px-5 py-4 transition-colors ${activePanel === 'endDate' ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
          >
            <div className={`text-[10px] font-bold tracking-widest uppercase mb-1 flex items-center gap-1 ${activePanel === 'endDate' ? 'text-[#1F7AC4]' : 'text-gray-500'}`}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {isStudent ? 'Tenure' : 'End Date'}
            </div>
            {isStudent ? (
              <span className="text-lg font-bold text-gray-900">
                {TENURE_OPTIONS.find((o) => o.value === tenureInMonths)?.label}
              </span>
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

          {/* Travellers */}
          <button
            type="button"
            onClick={() => setActivePanel(activePanel === 'travellers' ? null : 'travellers')}
            className={`flex-[1.3] text-left px-5 py-4 transition-colors ${activePanel === 'travellers' ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
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
          <div className="absolute top-full left-0 z-50 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 mt-1 overflow-hidden">
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  autoFocus
                  type="text"
                  value={countryQuery}
                  onChange={(e) => setCountryQuery(e.target.value)}
                  placeholder="Search country..."
                  className="flex-1 outline-none text-sm text-gray-800 placeholder-gray-400"
                />
              </div>
              {destinations.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {destinations.map((c) => (
                    <span key={c.code} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-[#1F7AC4] text-xs font-medium rounded-full border border-blue-200">
                      {c.name}
                      <button type="button" onClick={() => setDestinations((prev) => prev.filter((d) => d.code !== c.code))} className="text-blue-300 hover:text-blue-600">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="max-h-56 overflow-y-auto">
              {filteredCountries.map((c) => {
                const checked = !!destinations.find((d) => d.code === c.code);
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => toggleCountry(c)}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 text-sm border-b border-gray-50 last:border-0"
                  >
                    <span className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${checked ? 'border-[#1F7AC4] bg-[#1F7AC4]' : 'border-gray-300'}`}>
                      {checked && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </span>
                    <span className="text-gray-800">{c.name}</span>
                    <span className="ml-auto text-xs text-gray-400 font-mono">{c.code}</span>
                  </button>
                );
              })}
            </div>
            <div className="p-3 border-t border-gray-100">
              <button type="button" onClick={() => setActivePanel(null)} className="w-full py-2 bg-[#1F7AC4] text-white text-sm font-bold rounded-lg">Done</button>
            </div>
          </div>
        )}

        {/* Start Date Dropdown */}
        {activePanel === 'startDate' && (
          <div className="absolute top-full left-0 z-50 w-72 bg-white rounded-xl shadow-2xl border border-gray-100 mt-1 p-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Travel Start Date</p>
            <input
              autoFocus
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); if (endDate && e.target.value >= endDate) setEndDate(''); setActivePanel(null); }}
              min={todayStr()}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1F7AC4] focus:border-[#1F7AC4] outline-none text-sm"
            />
          </div>
        )}

        {/* End Date / Tenure Dropdown */}
        {activePanel === 'endDate' && (
          <div className="absolute top-full z-50 w-72 bg-white rounded-xl shadow-2xl border border-gray-100 mt-1 p-4" style={{ left: '33%' }}>
            {isStudent ? (
              <>
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
              </>
            ) : (
              <>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Travel End Date</p>
                <input
                  autoFocus
                  type="date"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setActivePanel(null); }}
                  min={startDate || todayStr()}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1F7AC4] focus:border-[#1F7AC4] outline-none text-sm"
                />
              </>
            )}
          </div>
        )}

        {/* Travellers Dropdown */}
        {activePanel === 'travellers' && (
          <div className="absolute top-full right-0 z-50 w-96 bg-white rounded-xl shadow-2xl border border-gray-100 mt-1 p-4">
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {travellers.map((t, i) => {
                const allRelations = RELATION_OPTIONS[policyType];
                const availableRelations = allRelations.filter(
                  (r) => r !== 'SELF' || !usedRelations.includes('SELF') || t.relation === 'SELF',
                );
                return (
                  <div key={i} className="flex flex-wrap gap-2 items-end p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-600 w-20">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-[#1F7AC4] flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</div>
                      <span>T{i + 1}</span>
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
                          onChange={(e) => updateTraveller(i, { ...t, relation: e.target.value })}
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
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* GET QUOTE button — matches Flights/Hotels SEARCH button */}
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
