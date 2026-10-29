'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, CalendarDays, BedDouble, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
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
  TabHeader,
  fieldCell,
} from './ui';
import { usePersistentSearch, notBeforeToday, useDatePrefill } from '@/lib/hooks/useSearchPersistence';

interface Location {
  id: string;
  name: string;
  fullName: string;
  code: string | null;
  type: string;
  country: string;
  coordinates: { lat: number; long: number };
}

interface Room {
  adults: number;
  children: number;
  childAges: number[];
}

interface HotelSearchSnapshot {
  destination: Location | null;
  checkIn: string; // 'YYYY-MM-DD'
  checkOut: string;
  rooms: Room[];
}

const DEFAULT_CHILD_AGE = 5;
const MAX_CHILD_AGE = 12;

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

function formatDay(date: Date) {
  return date.getDate().toString().padStart(2, '0');
}
function formatMonthYear(date: Date) {
  return `${date.toLocaleString('default', { month: 'short' })}'${date.getFullYear().toString().slice(2)}`;
}
function formatWeekday(date: Date) {
  return date.toLocaleString('default', { weekday: 'long' });
}
function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const HotelBooking = () => {
  const router = useRouter();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const [destination, setDestination] = useState<Location | null>(null);
  const [checkIn, setCheckIn] = useState<Date>(today);
  const [checkOut, setCheckOut] = useState<Date>(tomorrow);
  const [rooms, setRooms] = useState<Room[]>([{ adults: 1, children: 0, childAges: [] }]);

  // Remember the last search on this device and pre-fill it on the next visit.
  // Dates live in state as Date objects, so they are stored/restored as strings.
  usePersistentSearch<HotelSearchSnapshot>(
    'hotels',
    { destination, checkIn: toDateStr(checkIn), checkOut: toDateStr(checkOut), rooms },
    (s) => {
      if (s.destination) setDestination(s.destination);
      const ci = notBeforeToday(s.checkIn, toDateStr(today));
      const ciDate = new Date(ci + 'T00:00:00');
      setCheckIn(ciDate);
      let coDate = new Date(notBeforeToday(s.checkOut, toDateStr(tomorrow)) + 'T00:00:00');
      if (coDate <= ciDate) {
        // Keep check-out after check-in even if the stored gap collapsed.
        coDate = new Date(ciDate);
        coDate.setDate(coDate.getDate() + 1);
      }
      setCheckOut(coDate);
      if (Array.isArray(s.rooms) && s.rooms.length > 0) setRooms(s.rooms);
    },
  );

  // A suggested holiday window (?from=&to=): check in on the first day off,
  // check out on the last.
  useDatePrefill((from, to) => {
    setCheckIn(new Date(from + 'T00:00:00'));
    setCheckOut(new Date(to + 'T00:00:00'));
  });

  // Panels
  const [activePanel, setActivePanel] = useState<'destination' | 'dates' | 'guests' | null>(null);
  const [dateTab, setDateTab] = useState<'start' | 'end'>('start');

  // Destination search
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setActivePanel(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Autosuggest
  const fetchSuggestions = useCallback(async (term: string) => {
    if (term.length < 3) { setSuggestions([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/hotels/autosuggest?term=${encodeURIComponent(term)}`);
      const data = await res.json();
      setSuggestions(Array.isArray(data) ? data : []);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchSuggestions(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm, fetchSuggestions]);

  function openDatePanel(tab: 'start' | 'end') {
    setDateTab(tab);
    setActivePanel('dates');
  }

  function totalGuests() {
    return rooms.reduce((sum, r) => sum + r.adults + r.children, 0);
  }

  function updateRoom(idx: number, field: 'adults' | 'children', delta: number) {
    setRooms((prev) => {
      const next = prev.map((r, i) => {
        if (i !== idx) return r;
        const val = r[field] + delta;
        if (field === 'adults' && val < 1) return r;
        if (field === 'children' && val < 0) return r;
        if (field === 'children') {
          let childAges = r.childAges.slice(0, val);
          while (childAges.length < val) childAges = [...childAges, DEFAULT_CHILD_AGE];
          return { ...r, children: val, childAges };
        }
        return { ...r, [field]: val };
      });
      return next;
    });
  }

  function updateChildAge(roomIdx: number, childIdx: number, age: number) {
    setRooms((prev) =>
      prev.map((r, i) => {
        if (i !== roomIdx) return r;
        const childAges = r.childAges.map((a, j) => (j === childIdx ? age : a));
        return { ...r, childAges };
      }),
    );
  }

  function addRoom() {
    setRooms((prev) => [...prev, { adults: 1, children: 0, childAges: [] }]);
  }

  function removeRoom(idx: number) {
    setRooms((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleSearch() {
    if (!destination) {
      setActivePanel('destination');
      return;
    }
    const params = new URLSearchParams({
      locationId: destination.id,
      locationName: destination.name,
      lat: String(destination.coordinates.lat),
      long: String(destination.coordinates.long),
      checkIn: toDateStr(checkIn),
      checkOut: toDateStr(checkOut),
      rooms: JSON.stringify(rooms),
      // 2-letter ISO country code from the autosuggest result - drives destinationCountryCode / commission
      destinationCountryCode: destination.country || 'IN',
    });
    router.push(`/booking/hotels?${params.toString()}`);
  }

  return (
    <div ref={wrapperRef} className="relative space-y-5">
      <TabHeader tagline="Book Hotels in India and Worldwide" />

      {/* Main Search Bar */}
      <div className={FIELD_GROUP}>
        {/* Mobile: 2-col grid (destination full-width, dates side-by-side, guests full-width) */}
        {/* sm+: single flex row */}
        <div className="grid grid-cols-2 sm:flex sm:items-stretch divide-y divide-gray-200 sm:divide-y-0">
          {/* Destination - full width on mobile */}
          <button
            onClick={() => { setActivePanel(activePanel === 'destination' ? null : 'destination'); setSearchTerm(''); setSuggestions([]); }}
            className={`col-span-2 sm:flex-[2] min-w-0 sm:border-r sm:border-gray-200 ${fieldCell(activePanel === 'destination')}`}
          >
            <FieldLabel icon={MapPin} active={activePanel === 'destination'}>
              Destination or Property
            </FieldLabel>
            <div className={`truncate ${destination ? FIELD_VALUE : FIELD_PLACEHOLDER}`}>
              {destination ? destination.name : 'Select Destination'}
            </div>
            {destination?.fullName && <div className={FIELD_SUB}>{destination.fullName}</div>}
          </button>

          {/* Dates wrapper - relative so the calendar anchors under the date fields */}
          <div className="col-span-2 grid grid-cols-2 sm:flex sm:flex-[2] relative">
            {/* Check In */}
            <button
              onClick={() => openDatePanel('start')}
              className={`sm:flex-1 border-r border-gray-200 ${fieldCell(activePanel === 'dates' && dateTab === 'start')}`}
            >
              <FieldLabel icon={CalendarDays} active={activePanel === 'dates' && dateTab === 'start'}>
                Check In
              </FieldLabel>
              <DateValue day={formatDay(checkIn)} monthYear={formatMonthYear(checkIn)} weekday={formatWeekday(checkIn)} />
            </button>

            {/* Check Out */}
            <button
              onClick={() => openDatePanel('end')}
              className={`sm:flex-1 sm:border-r sm:border-gray-200 ${fieldCell(activePanel === 'dates' && dateTab === 'end')}`}
            >
              <FieldLabel icon={CalendarDays} active={activePanel === 'dates' && dateTab === 'end'}>
                Check Out
              </FieldLabel>
              <DateValue day={formatDay(checkOut)} monthYear={formatMonthYear(checkOut)} weekday={formatWeekday(checkOut)} />
            </button>

            <CalendarPanel
              isOpen={activePanel === 'dates'}
              mode="range"
              startDate={checkIn}
              endDate={checkOut}
              activeTab={dateTab}
              onActiveTabChange={setDateTab}
              startLabel="Check-in"
              endLabel="Check-out"
              minDate={today}
              onChange={(start, end) => {
                setCheckIn(start);
                if (end) setCheckOut(end);
              }}
              onClose={() => setActivePanel(null)}
            />

          </div>

          {/* Rooms & Guests - full width on mobile */}
          <button
            onClick={() => setActivePanel(activePanel === 'guests' ? null : 'guests')}
            className={`col-span-2 sm:flex-1 ${fieldCell(activePanel === 'guests')}`}
          >
            <FieldLabel icon={BedDouble} active={activePanel === 'guests'}>
              Rooms &amp; Guests
            </FieldLabel>
            <div className={FIELD_VALUE}>
              {rooms.length} Room{rooms.length !== 1 ? 's' : ''}
            </div>
            <div className={FIELD_SUB}>
              {totalGuests()} Guest{totalGuests() !== 1 ? 's' : ''}
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
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Enter area or hotel name..."
                  className="flex-1 outline-none text-sm text-gray-800 placeholder-gray-400"
                />
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {loading && (
                <div className="px-4 py-3 text-sm text-gray-400">Searching...</div>
              )}
              {!loading && searchTerm.length < 2 && (
                <div className="px-4 py-3 text-sm text-gray-400">
                  Start typing to search hotels
                </div>
              )}
              {!loading && searchTerm.length >= 2 && suggestions.length === 0 && (
                <div className="px-4 py-3 text-sm text-gray-400">No results found</div>
              )}
              {suggestions.map((loc, i) => (
                <button
                  key={loc.id || `${loc.fullName}-${i}`}
                  onClick={() => { setDestination(loc); setActivePanel(null); }}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-start gap-3 border-b border-gray-50 last:border-0"
                >
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-semibold text-gray-800">{loc.name}</div>
                    <div className="text-xs text-gray-400">{loc.fullName}</div>
                  </div>
                  <span className="ml-auto text-xs text-gray-400 mt-0.5">{loc.type}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Guests Dropdown */}
        {activePanel === 'guests' && (
          <div className="absolute top-full right-0 z-50 w-full sm:w-80 bg-white rounded-xl shadow-2xl border border-gray-100 mt-1 p-4">
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {rooms.map((room, idx) => (
                <div key={idx} className="border-b border-gray-100 pb-4 last:border-0">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-gray-800">Room {idx + 1}</span>
                    {rooms.length > 1 && (
                      <button onClick={() => removeRoom(idx)} className="text-xs text-red-500 hover:underline">Remove</button>
                    )}
                  </div>
                  {/* Adults */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-700">Adults</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateRoom(idx, 'adults', -1)}
                        className="w-7 h-7 rounded border border-gray-300 flex items-center justify-center text-gray-600 hover:border-gray-500 text-lg leading-none"
                      >−</button>
                      <span className="w-4 text-center font-bold text-gray-800">{room.adults}</span>
                      <button
                        onClick={() => updateRoom(idx, 'adults', 1)}
                        className="w-7 h-7 rounded border border-gray-300 flex items-center justify-center text-gray-600 hover:border-gray-500 text-lg leading-none"
                      >+</button>
                    </div>
                  </div>
                  {/* Children */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-gray-700">Children</span>
                      <div className="text-xs text-gray-400">0 - {MAX_CHILD_AGE} Years</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateRoom(idx, 'children', -1)}
                        className="w-7 h-7 rounded border border-gray-300 flex items-center justify-center text-gray-600 hover:border-gray-500 text-lg leading-none"
                      >−</button>
                      <span className="w-4 text-center font-bold text-gray-800">{room.children}</span>
                      <button
                        onClick={() => updateRoom(idx, 'children', 1)}
                        className="w-7 h-7 rounded border border-gray-300 flex items-center justify-center text-gray-600 hover:border-gray-500 text-lg leading-none"
                      >+</button>
                    </div>
                  </div>
                  {/* Child ages */}
                  {room.children > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {room.childAges.map((age, childIdx) => (
                        <label key={childIdx} className="flex flex-col gap-1">
                          <span className="text-xs text-gray-500">Child {childIdx + 1} age</span>
                          <select
                            value={age}
                            onChange={(e) => updateChildAge(idx, childIdx, Number(e.target.value))}
                            className="border border-gray-300 rounded px-2 py-1 text-sm text-gray-800 focus:border-blue-500 outline-none"
                          >
                            {Array.from({ length: MAX_CHILD_AGE + 1 }).map((_, a) => (
                              <option key={a} value={a}>
                                {a < 1 ? '< 1 year' : `${a} year${a !== 1 ? 's' : ''}`}
                              </option>
                            ))}
                          </select>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-4 pt-2">
              <button onClick={addRoom} className="text-sm font-bold text-(--color-accent) flex items-center gap-1 hover:underline">
                <span className="text-base">+</span> Add Another Room
              </button>
              <button
                onClick={() => setActivePanel(null)}
                className="px-5 py-2 bg-(--color-accent) text-white text-sm font-bold rounded hover:bg-(--color-accent-hover) transition-colors"
              >
                DONE
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Search Button row - same as every tab */}
      <ActionRow>
        <ActionButton onClick={handleSearch}>Search</ActionButton>
      </ActionRow>
    </div>
  );
};
