'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface GeoLocation {
  displayName: string;
  shortName: string;
  lat: number;
  lon: number;
  type: string;
}

interface Room {
  adults: number;
  children: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

const MONTH_NAMES = [
  'JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE',
  'JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER',
];
const DAY_NAMES = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function formatDay(date: Date) {
  return date.getDate().toString().padStart(2, '0');
}
function formatMonthYear(date: Date) {
  return `${date.toLocaleString('default', { month: 'short' })}'${date.getFullYear().toString().slice(2)}`;
}
function formatWeekday(date: Date) {
  return date.toLocaleString('default', { weekday: 'long' });
}
function diffNights(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}
function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function CalendarMonth({
  year, month, checkIn, checkOut, hoverDate, onSelect, onHover, minDate,
}: {
  year: number; month: number;
  checkIn: Date | null; checkOut: Date | null; hoverDate: Date | null;
  onSelect: (d: Date) => void; onHover: (d: Date | null) => void;
  minDate: Date;
}) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const rangeEnd = checkOut || hoverDate;

  const cells: (Date | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  return (
    <div className="flex-1 min-w-[260px]">
      <div className="text-center font-bold text-red-500 mb-3 text-sm tracking-widest">
        {MONTH_NAMES[month]} {year}
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-center text-xs text-gray-500 font-medium py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((date, i) => {
          if (!date) return <div key={i} />;
          const isPast = date < minDate && !isSameDay(date, minDate);
          const isCheckIn = checkIn && isSameDay(date, checkIn);
          const isCheckOut = checkOut && isSameDay(date, checkOut);
          const inRange =
            checkIn && rangeEnd && !isCheckIn && !isCheckOut &&
            date > checkIn && date < rangeEnd;

          return (
            <button
              key={i}
              disabled={isPast}
              onMouseEnter={() => !isPast && onHover(date)}
              onMouseLeave={() => onHover(null)}
              onClick={() => !isPast && onSelect(date)}
              className={[
                'h-9 w-full text-sm font-medium transition-colors',
                isPast ? 'text-gray-300 cursor-not-allowed' : 'cursor-pointer hover:bg-blue-100',
                isCheckIn || isCheckOut
                  ? 'bg-[#1a2b6b] text-white rounded-full'
                  : inRange
                  ? 'bg-blue-100 text-blue-900'
                  : 'text-gray-800',
              ].join(' ')}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Geocoding dropdown shared component ─────────────────────────────────────

function LocationDropdown({
  value,
  onChange,
  onSelect,
  placeholder,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect: (loc: GeoLocation) => void;
  placeholder: string;
  autoFocus?: boolean;
}) {
  const [suggestions, setSuggestions] = useState<GeoLocation[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSuggestions = useCallback(async (term: string) => {
    if (term.trim().length < 2) { setSuggestions([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/geocode?q=${encodeURIComponent(term)}`);
      const data = await res.json();
      setSuggestions(Array.isArray(data) ? data : []);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchSuggestions(value), 350);
    return () => clearTimeout(t);
  }, [value, fetchSuggestions]);

  return (
    <div className="p-3">
      <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg">
        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          autoFocus={autoFocus}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 outline-none text-sm text-gray-800 placeholder-gray-400"
        />
        {loading && (
          <svg className="w-4 h-4 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        )}
      </div>

      <div className="mt-1 max-h-56 overflow-y-auto">
        {!loading && value.trim().length < 2 && (
          <div className="px-2 py-3 text-sm text-gray-400 flex items-center gap-2">
            <span>😊</span> Type to search locations
          </div>
        )}
        {!loading && value.trim().length >= 2 && suggestions.length === 0 && (
          <div className="px-2 py-3 text-sm text-gray-400">No results found</div>
        )}
        {suggestions.map((loc, i) => (
          <button
            key={i}
            onClick={() => onSelect(loc)}
            className="w-full text-left px-2 py-2.5 hover:bg-gray-50 flex items-start gap-2 border-b border-gray-50 last:border-0 rounded"
          >
            <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-800 truncate">{loc.shortName}</div>
              <div className="text-xs text-gray-400 truncate">{loc.displayName}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export const HolidayPackages = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const [packageType, setPackageType] = useState('all');

  // Selected locations with coordinates
  const [destination, setDestination] = useState<GeoLocation | null>(null);
  const [departure, setDeparture] = useState<GeoLocation | null>(null);

  // Search input text (drives autocomplete)
  const [destinationText, setDestinationText] = useState('');
  const [departureText, setDepartureText] = useState('');

  const [checkIn, setCheckIn] = useState<Date>(today);
  const [checkOut, setCheckOut] = useState<Date>(tomorrow);
  const [rooms, setRooms] = useState<Room[]>([{ adults: 2, children: 0 }]);

  const [activePanel, setActivePanel] = useState<'destination' | 'departure' | 'dates' | 'guests' | null>(null);
  const [dateTab, setDateTab] = useState<'checkin' | 'checkout'>('checkin');
  const [calMonth, setCalMonth] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [selectingCheckout, setSelectingCheckout] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setActivePanel(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleDateSelect(date: Date) {
    if (!selectingCheckout) {
      setCheckIn(date);
      const next = new Date(date);
      next.setDate(date.getDate() + 1);
      if (checkOut <= date) setCheckOut(next);
      setSelectingCheckout(true);
      setDateTab('checkout');
    } else {
      if (date <= checkIn) {
        setCheckIn(date);
        const next = new Date(date);
        next.setDate(date.getDate() + 1);
        setCheckOut(next);
      } else {
        setCheckOut(date);
        setActivePanel(null);
        setSelectingCheckout(false);
      }
    }
  }

  function openDatePanel(tab: 'checkin' | 'checkout') {
    setDateTab(tab);
    setSelectingCheckout(tab === 'checkout');
    setActivePanel('dates');
    setCalMonth({ year: checkIn.getFullYear(), month: checkIn.getMonth() });
  }

  function prevMonth() {
    setCalMonth(({ year, month }) =>
      month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 }
    );
  }
  function nextMonth() {
    setCalMonth(({ year, month }) =>
      month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 }
    );
  }

  function totalGuests() {
    return rooms.reduce((sum, r) => sum + r.adults + r.children, 0);
  }

  function updateRoom(idx: number, field: 'adults' | 'children', delta: number) {
    setRooms((prev) =>
      prev.map((r, i) => {
        if (i !== idx) return r;
        const val = r[field] + delta;
        if (field === 'adults' && val < 1) return r;
        if (field === 'children' && val < 0) return r;
        return { ...r, [field]: val };
      })
    );
  }

  function addRoom() {
    setRooms((prev) => [...prev, { adults: 1, children: 0 }]);
  }

  function removeRoom(idx: number) {
    setRooms((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleSearch() {
    if (!destination) { setActivePanel('destination'); return; }
    if (!departure) { setActivePanel('departure'); return; }
    console.log('Search holiday packages', {
      packageType,
      destination: { name: destination.shortName, lat: destination.lat, lon: destination.lon },
      departure: { name: departure.shortName, lat: departure.lat, lon: departure.lon },
      checkIn: checkIn.toISOString().split('T')[0],
      checkOut: checkOut.toISOString().split('T')[0],
      rooms,
    });
  }

  const nights = diffNights(checkIn, checkOut);
  const nextCalMonth =
    calMonth.month === 11
      ? { year: calMonth.year + 1, month: 0 }
      : { year: calMonth.year, month: calMonth.month + 1 };

  const packageTypes = [
    { value: 'all', label: 'All Packages' },
    { value: 'family', label: 'Family Packages' },
    { value: 'honeymoon', label: 'Honeymoon Special' },
    { value: 'group', label: 'Group Tours' },
  ];

  return (
    <div className="space-y-4">
      {/* Package Type Radio Buttons */}
      <div className="flex flex-wrap gap-5">
        {packageTypes.map((pt) => (
          <label key={pt.value} className="flex items-center gap-2 cursor-pointer" onClick={() => setPackageType(pt.value)}>
            <div className={[
              'w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors',
              packageType === pt.value ? 'border-[#e8262a]' : 'border-gray-400',
            ].join(' ')}>
              {packageType === pt.value && <div className="w-2 h-2 rounded-full bg-[#e8262a]" />}
            </div>
            <span className="text-sm font-medium text-gray-700">{pt.label}</span>
          </label>
        ))}
      </div>

      {/* Main Search Bar */}
      <div ref={wrapperRef} className="relative">
        <div className="flex items-stretch bg-white rounded-xl shadow-md border border-gray-200 overflow-visible">

          {/* ── Destination ── */}
          <button
            onClick={() => {
              setActivePanel(activePanel === 'destination' ? null : 'destination');
              if (activePanel !== 'destination') setDestinationText(destination?.shortName ?? '');
            }}
            className={[
              'flex-[1.5] text-left px-5 py-4 border-r border-gray-200 transition-colors min-w-0',
              activePanel === 'destination' ? 'bg-blue-50' : 'hover:bg-gray-50',
            ].join(' ')}
          >
            <div className={`text-[10px] font-bold tracking-widest uppercase mb-1 ${activePanel === 'destination' ? 'text-blue-600' : 'text-gray-500'}`}>
              Destination
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className={`text-base font-bold truncate ${destination ? 'text-gray-900' : 'text-gray-400'}`}>
                {destination ? destination.shortName : 'e.g., Dubai, Maldives'}
              </span>
            </div>
            {destination && (
              <div className="text-xs text-gray-400 mt-0.5 truncate">
                {destination.lat.toFixed(4)}, {destination.lon.toFixed(4)}
              </div>
            )}
          </button>

          {/* ── Departure From ── */}
          <button
            onClick={() => {
              setActivePanel(activePanel === 'departure' ? null : 'departure');
              if (activePanel !== 'departure') setDepartureText(departure?.shortName ?? '');
            }}
            className={[
              'flex-[1.5] text-left px-5 py-4 border-r border-gray-200 transition-colors min-w-0',
              activePanel === 'departure' ? 'bg-blue-50' : 'hover:bg-gray-50',
            ].join(' ')}
          >
            <div className={`text-[10px] font-bold tracking-widest uppercase mb-1 ${activePanel === 'departure' ? 'text-blue-600' : 'text-gray-500'}`}>
              Departure From
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              <span className={`text-base font-bold truncate ${departure ? 'text-gray-900' : 'text-gray-400'}`}>
                {departure ? departure.shortName : 'e.g., New Delhi'}
              </span>
            </div>
            {departure && (
              <div className="text-xs text-gray-400 mt-0.5 truncate">
                {departure.lat.toFixed(4)}, {departure.lon.toFixed(4)}
              </div>
            )}
          </button>

          {/* ── Check In ── */}
          <button
            onClick={() => openDatePanel('checkin')}
            className={[
              'flex-1 text-left px-5 py-4 border-r border-gray-200 transition-colors',
              activePanel === 'dates' && dateTab === 'checkin' ? 'bg-blue-50' : 'hover:bg-gray-50',
            ].join(' ')}
          >
            <div className={`text-[10px] font-bold tracking-widest uppercase mb-1 flex items-center gap-1 ${activePanel === 'dates' && dateTab === 'checkin' ? 'text-blue-600' : 'text-gray-500'}`}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Check In
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-gray-900 leading-none">{formatDay(checkIn)}</span>
              <span className="text-base font-bold text-gray-900">{formatMonthYear(checkIn)}</span>
            </div>
            <div className="text-xs text-gray-500 mt-0.5">{formatWeekday(checkIn)}</div>
          </button>

          {/* ── Night Badge ── */}
          <div className="flex items-center justify-center px-2 border-r border-gray-200">
            <div className="w-12 h-12 rounded-full border-2 border-gray-300 flex flex-col items-center justify-center">
              <span className="text-sm font-bold text-gray-700 leading-none">{nights}</span>
              <span className="text-[9px] text-gray-500 leading-none mt-0.5">NIGHT{nights !== 1 ? 'S' : ''}</span>
            </div>
          </div>

          {/* ── Check Out ── */}
          <button
            onClick={() => openDatePanel('checkout')}
            className={[
              'flex-1 text-left px-5 py-4 border-r border-gray-200 transition-colors',
              activePanel === 'dates' && dateTab === 'checkout' ? 'bg-blue-50' : 'hover:bg-gray-50',
            ].join(' ')}
          >
            <div className={`text-[10px] font-bold tracking-widest uppercase mb-1 flex items-center gap-1 ${activePanel === 'dates' && dateTab === 'checkout' ? 'text-blue-600' : 'text-gray-500'}`}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Check Out
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-gray-900 leading-none">{formatDay(checkOut)}</span>
              <span className="text-base font-bold text-gray-900">{formatMonthYear(checkOut)}</span>
            </div>
            <div className="text-xs text-gray-500 mt-0.5">{formatWeekday(checkOut)}</div>
          </button>

          {/* ── Rooms & Guests ── */}
          <button
            onClick={() => setActivePanel(activePanel === 'guests' ? null : 'guests')}
            className={[
              'flex-1 text-left px-5 py-4 border-r border-gray-200 transition-colors',
              activePanel === 'guests' ? 'bg-blue-50' : 'hover:bg-gray-50',
            ].join(' ')}
          >
            <div className={`text-[10px] font-bold tracking-widest uppercase mb-1 ${activePanel === 'guests' ? 'text-blue-600' : 'text-gray-500'}`}>
              Rooms &amp; Guests
            </div>
            <div className="text-lg font-bold text-gray-900 leading-tight">
              <span>{rooms.length} Room{rooms.length !== 1 ? 's' : ''}</span>
              <span className="mx-1 text-gray-400">·</span>
              <span>{totalGuests()} Guest{totalGuests() !== 1 ? 's' : ''}</span>
            </div>
          </button>

          {/* ── Search Button ── */}
          <button
            onClick={handleSearch}
            className="flex items-center gap-2 px-8 bg-[#e8262a] hover:bg-[#c9191d] text-white font-bold text-sm tracking-widest uppercase transition-colors flex-shrink-0 rounded-r-xl"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search
          </button>
        </div>

        {/* ── Destination Dropdown ── */}
        {activePanel === 'destination' && (
          <div className="absolute top-full left-0 z-50 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 mt-1 overflow-hidden">
            <LocationDropdown
              value={destinationText}
              onChange={setDestinationText}
              onSelect={(loc) => { setDestination(loc); setDestinationText(loc.shortName); setActivePanel(null); }}
              placeholder="Enter city, region or country"
              autoFocus
            />
          </div>
        )}

        {/* ── Departure Dropdown ── */}
        {activePanel === 'departure' && (
          <div className="absolute top-full z-50 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 mt-1 overflow-hidden" style={{ left: '27%' }}>
            <LocationDropdown
              value={departureText}
              onChange={setDepartureText}
              onSelect={(loc) => { setDeparture(loc); setDepartureText(loc.shortName); setActivePanel(null); }}
              placeholder="Enter your departure city"
              autoFocus
            />
          </div>
        )}

        {/* ── Date Picker Dropdown ── */}
        {activePanel === 'dates' && (
          <div className="absolute top-full left-0 right-0 z-50 bg-white rounded-xl shadow-2xl border border-gray-100 mt-1 p-4">
            <div className="flex gap-4 mb-4 border-b border-gray-100">
              <button
                onClick={() => { setDateTab('checkin'); setSelectingCheckout(false); }}
                className={`pb-2 text-sm font-bold border-b-2 transition-colors ${dateTab === 'checkin' ? 'border-[#1a2b6b] text-[#1a2b6b]' : 'border-transparent text-gray-400'}`}
              >
                CHECK-IN<br />
                <span className="text-base font-bold">
                  {checkIn.toLocaleString('default', { month: 'short' })} {checkIn.getDate()}, {checkIn.getFullYear()}
                </span>
              </button>
              <button
                onClick={() => { setDateTab('checkout'); setSelectingCheckout(true); }}
                className={`pb-2 text-sm font-bold border-b-2 transition-colors ${dateTab === 'checkout' ? 'border-[#1a2b6b] text-[#1a2b6b]' : 'border-transparent text-gray-400'}`}
              >
                CHECK-OUT<br />
                <span className="text-base font-bold">
                  {checkOut.toLocaleString('default', { month: 'short' })} {checkOut.getDate()}, {checkOut.getFullYear()}
                </span>
              </button>
            </div>
            <div className="flex gap-6">
              <button onClick={prevMonth} className="self-start mt-7 p-1 hover:bg-gray-100 rounded-full text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <CalendarMonth
                year={calMonth.year} month={calMonth.month}
                checkIn={checkIn} checkOut={checkOut} hoverDate={hoverDate}
                onSelect={handleDateSelect} onHover={setHoverDate} minDate={today}
              />
              <CalendarMonth
                year={nextCalMonth.year} month={nextCalMonth.month}
                checkIn={checkIn} checkOut={checkOut} hoverDate={hoverDate}
                onSelect={handleDateSelect} onHover={setHoverDate} minDate={today}
              />
              <button onClick={nextMonth} className="self-start mt-7 p-1 hover:bg-gray-100 rounded-full text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* ── Guests Dropdown ── */}
        {activePanel === 'guests' && (
          <div className="absolute top-full right-0 z-50 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 mt-1 p-4">
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {rooms.map((room, idx) => (
                <div key={idx} className="border-b border-gray-100 pb-4 last:border-0">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-gray-800">Room {idx + 1}</span>
                    {rooms.length > 1 && (
                      <button onClick={() => removeRoom(idx)} className="text-xs text-red-500 hover:underline">Remove</button>
                    )}
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-700">Adults</span>
                    <div className="flex items-center gap-3">
                      <button onClick={() => updateRoom(idx, 'adults', -1)} className="w-7 h-7 rounded border border-gray-300 flex items-center justify-center text-gray-600 hover:border-gray-500 text-lg leading-none">−</button>
                      <span className="w-4 text-center font-bold text-gray-800">{room.adults}</span>
                      <button onClick={() => updateRoom(idx, 'adults', 1)} className="w-7 h-7 rounded border border-gray-300 flex items-center justify-center text-gray-600 hover:border-gray-500 text-lg leading-none">+</button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-gray-700">Children</span>
                      <div className="text-xs text-gray-400">0 - 12 Years</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => updateRoom(idx, 'children', -1)} className="w-7 h-7 rounded border border-gray-300 flex items-center justify-center text-gray-600 hover:border-gray-500 text-lg leading-none">−</button>
                      <span className="w-4 text-center font-bold text-gray-800">{room.children}</span>
                      <button onClick={() => updateRoom(idx, 'children', 1)} className="w-7 h-7 rounded border border-gray-300 flex items-center justify-center text-gray-600 hover:border-gray-500 text-lg leading-none">+</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-4 pt-2">
              <button onClick={addRoom} className="text-sm font-bold text-[#e8262a] flex items-center gap-1 hover:underline">
                <span className="text-base">+</span> Add Another Room
              </button>
              <button onClick={() => setActivePanel(null)} className="px-5 py-2 bg-[#e8262a] text-white text-sm font-bold rounded hover:bg-[#c9191d] transition-colors">
                DONE
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
