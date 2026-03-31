'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// ── Types ──────────────────────────────────────────────────────────────────

type PolicyType = 'INDIVIDUAL' | 'FAMILY' | 'FRIENDS' | 'STUDENT' | 'ANNUAL MULTITRIP';

interface Traveller {
  id: number;
  birthdate: string; // YYYY-MM-DD
  relation: string;
}

interface CountryOption {
  name: string;
  code: string;
}

// ── Constants ──────────────────────────────────────────────────────────────

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

// Top international travel destinations
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

// ── Helpers ────────────────────────────────────────────────────────────────

function today(): string {
  return new Date().toISOString().split('T')[0];
}

function defaultTravellersForPolicy(policyType: PolicyType): Traveller[] {
  return [{ id: 1, birthdate: '', relation: RELATION_OPTIONS[policyType][0] }];
}

// ── Country Search Dropdown ────────────────────────────────────────────────

function CountryPicker({
  selected,
  onChange,
}: {
  selected: CountryOption[];
  onChange: (countries: CountryOption[]) => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = query.length < 1
    ? COUNTRIES
    : COUNTRIES.filter((c) =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.code.toLowerCase().includes(query.toLowerCase()),
      );

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const toggle = useCallback(
    (c: CountryOption) => {
      const exists = selected.find((s) => s.code === c.code);
      if (exists) {
        onChange(selected.filter((s) => s.code !== c.code));
      } else {
        onChange([...selected, c]);
      }
    },
    [selected, onChange],
  );

  const displayText = selected.length === 0
    ? ''
    : selected.map((c) => c.name).join(', ');

  return (
    <div ref={ref} className="relative">
      <div
        className="w-full px-4 py-3 pl-10 border-2 border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-[var(--color-links)] focus-within:border-[var(--color-links)] transition-all cursor-pointer bg-white flex items-center"
        onClick={() => setOpen((p) => !p)}
      >
        <svg className="absolute left-3 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className={`truncate flex-1 ${selected.length === 0 ? 'text-gray-400' : 'text-gray-800'}`}>
          {selected.length === 0 ? 'e.g., USA, Singapore, Dubai' : displayText}
        </span>
        {selected.length > 0 && (
          <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
            {selected.length}
          </span>
        )}
      </div>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-64 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-gray-100">
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search countries..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--color-links)]"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-sm text-gray-500">No countries found</p>
            ) : (
              filtered.map((c) => {
                const checked = !!selected.find((s) => s.code === c.code);
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => toggle(c)}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors"
                  >
                    <span className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${checked ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}>
                      {checked && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                    <span className="text-gray-800">{c.name}</span>
                    <span className="ml-auto text-xs text-gray-400 font-mono">{c.code}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Traveller Row ──────────────────────────────────────────────────────────

function TravellerRow({
  traveller,
  index,
  policyType,
  usedRelations,
  onChange,
  onRemove,
  canRemove,
}: {
  traveller: Traveller;
  index: number;
  policyType: PolicyType;
  usedRelations: string[];
  onChange: (t: Traveller) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const allRelations = RELATION_OPTIONS[policyType];
  // Filter to avoid duplicate SELF, but allow duplicates for FRIEND/SON/DAUGHTER etc.
  const availableRelations = allRelations.filter(
    (r) => r !== 'SELF' || !usedRelations.includes('SELF') || traveller.relation === 'SELF',
  );

  const maxDob = today();

  return (
    <div className="flex flex-wrap gap-3 items-end p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-600 w-20">
        <div className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
          {index + 1}
        </div>
        <span>Traveller</span>
      </div>

      {/* DOB */}
      <div className="flex-1 min-w-[160px]">
        <label className="block text-xs text-gray-500 mb-1">Date of Birth *</label>
        <input
          type="date"
          value={traveller.birthdate}
          max={maxDob}
          onChange={(e) => onChange({ ...traveller, birthdate: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-links)] focus:border-[var(--color-links)] outline-none"
          required
        />
      </div>

      {/* Relation */}
      {allRelations.length > 1 && (
        <div className="flex-1 min-w-[130px]">
          <label className="block text-xs text-gray-500 mb-1">Relation *</label>
          <select
            value={traveller.relation}
            onChange={(e) => onChange({ ...traveller, relation: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-links)] focus:border-[var(--color-links)] outline-none bg-white"
          >
            {availableRelations.map((r) => (
              <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>
            ))}
          </select>
        </div>
      )}

      {canRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Remove traveller"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export const TravelInsurance = () => {
  const router = useRouter();

  const [policyType, setPolicyType] = useState<PolicyType>('INDIVIDUAL');
  const [destinations, setDestinations] = useState<CountryOption[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [tenureInMonths, setTenureInMonths] = useState(3);
  const [travellers, setTravellers] = useState<Traveller[]>(defaultTravellersForPolicy('INDIVIDUAL'));
  const [error, setError] = useState('');

  // Reset travellers when policy type changes
  useEffect(() => {
    setTravellers(defaultTravellersForPolicy(policyType));
  }, [policyType]);

  const usedRelations = travellers.map((t) => t.relation);
  const maxTravellers = MAX_TRAVELLERS[policyType];

  const addTraveller = () => {
    if (travellers.length >= maxTravellers) return;
    const relations = RELATION_OPTIONS[policyType];
    // Pick first unused relation (not SELF if already used), fallback to last option
    const nextRelation = relations.find((r) => r !== 'SELF' && !usedRelations.includes(r))
      ?? relations[relations.length - 1];
    setTravellers((prev) => [
      ...prev,
      { id: prev.length + 1, birthdate: '', relation: nextRelation },
    ]);
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

    if (destinations.length === 0) {
      setError('Please select at least one destination country.');
      return;
    }
    if (!startDate) {
      setError('Please select a travel start date.');
      return;
    }
    if (policyType !== 'STUDENT' && !endDate) {
      setError('Please select a travel end date.');
      return;
    }
    if (policyType !== 'STUDENT' && endDate <= startDate) {
      setError('End date must be after start date.');
      return;
    }
    for (const t of travellers) {
      if (!t.birthdate) {
        setError('Please enter date of birth for all travellers.');
        return;
      }
    }

    const params = new URLSearchParams({
      policyType,
      countryCodes: destinations.map((d) => d.code).join(','),
      countryNames: destinations.map((d) => d.name).join(','),
      startDate,
      endDate: policyType === 'STUDENT' ? startDate : endDate,
      tenureInMonths: String(policyType === 'STUDENT' ? tenureInMonths : 0),
      travellers: JSON.stringify(
        travellers.map((t, i) => ({ id: i, birthdate: t.birthdate, relation: t.relation })),
      ),
    });

    router.push(`/booking/insurance?${params.toString()}`);
  };

  const isStudent = policyType === 'STUDENT';
  const isMultiPax = policyType === 'FAMILY' || policyType === 'FRIENDS';

  return (
    <form onSubmit={handleSearch} className="space-y-5">
      {/* Policy Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Policy Type</label>
        <div className="flex flex-wrap gap-2">
          {POLICY_TYPES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setPolicyType(value)}
              className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all ${
                policyType === value
                  ? 'bg-[var(--color-success)] border-[var(--color-success)] text-white'
                  : 'border-gray-300 text-gray-600 hover:border-[var(--color-success)] hover:text-[var(--color-success)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Destination Countries */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Destination Country <span className="text-red-500">*</span>
        </label>
        <CountryPicker selected={destinations} onChange={setDestinations} />
        {destinations.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {destinations.map((c) => (
              <span
                key={c.code}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-200"
              >
                {c.name}
                <button
                  type="button"
                  onClick={() => setDestinations((prev) => prev.filter((d) => d.code !== c.code))}
                  className="text-green-400 hover:text-green-700 ml-0.5"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Travel Start Date <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); if (endDate && e.target.value >= endDate) setEndDate(''); }}
              min={today()}
              className="w-full px-4 py-3 pl-10 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-links)] focus:border-[var(--color-links)] outline-none transition-all"
              required
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        {isStudent ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tenure (Duration) <span className="text-red-500">*</span>
            </label>
            <select
              value={tenureInMonths}
              onChange={(e) => setTenureInMonths(Number(e.target.value))}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-links)] focus:border-[var(--color-links)] outline-none bg-white"
            >
              {TENURE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Travel End Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || today()}
                className="w-full px-4 py-3 pl-10 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-links)] focus:border-[var(--color-links)] outline-none transition-all"
                required
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Travellers */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">
            Travellers <span className="text-red-500">*</span>
            <span className="ml-1 text-xs text-gray-400 font-normal">(Date of Birth required)</span>
          </label>
          {isMultiPax && travellers.length < maxTravellers && (
            <button
              type="button"
              onClick={addTraveller}
              className="flex items-center gap-1.5 text-sm text-[var(--color-success)] font-semibold hover:underline"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Traveller
            </button>
          )}
        </div>

        <div className="space-y-2">
          {travellers.map((t, i) => (
            <TravellerRow
              key={i}
              traveller={t}
              index={i}
              policyType={policyType}
              usedRelations={usedRelations}
              onChange={(updated) => updateTraveller(i, updated)}
              onRemove={() => removeTraveller(i)}
              canRemove={isMultiPax && travellers.length > 1}
            />
          ))}
        </div>

        {isMultiPax && (
          <p className="mt-2 text-xs text-gray-400">
            Up to {maxTravellers} travellers allowed for {policyType.toLowerCase()} policy.
          </p>
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

      {/* Submit */}
      <div className="flex justify-center pt-2">
        <button
          type="submit"
          className="w-full sm:w-auto px-12 py-4 bg-gradient-to-r from-[var(--color-success)] to-green-700 text-white text-lg font-bold rounded-full hover:shadow-xl transform hover:scale-105 transition-all duration-300"
        >
          GET QUOTE
        </button>
      </div>
    </form>
  );
};
