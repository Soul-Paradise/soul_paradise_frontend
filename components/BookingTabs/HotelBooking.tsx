'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, CalendarDays, ChevronDown, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { CalendarPanel } from './CalendarPanel';

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
}

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
  const [rooms, setRooms] = useState<Room[]>([{ adults: 1, children: 0 }]);

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
        return { ...r, [field]: val };
      });
      return next;
    });
  }

  function addRoom() {
    setRooms((prev) => [...prev, { adults: 1, children: 0 }]);
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
      rooms: JSON.stringify(rooms.map((r) => ({ ...r, childAges: [] }))),
    });
    router.push(`/booking/hotels?${params.toString()}`);
  }

  return (
    <div ref={wrapperRef} className="relative space-y-5">
      {/* Main Search Bar */}
      <div className="relative border-2 border-gray-200 rounded-xl overflow-visible bg-white">
        {/* Mobile: 2-col grid (destination full-width, dates side-by-side, guests full-width) */}
        {/* sm+: single flex row */}
        <div className="grid grid-cols-2 sm:flex sm:items-stretch divide-y divide-gray-200 sm:divide-y-0">
          {/* Destination — full width on mobile */}
          <button
            onClick={() => { setActivePanel(activePanel === 'destination' ? null : 'destination'); setSearchTerm(''); setSuggestions([]); }}
            className={[
              'col-span-2 sm:flex-[2] text-left px-5 py-4 sm:border-r sm:border-gray-200 transition-colors min-w-0',
              activePanel === 'destination' ? 'bg-blue-50' : 'hover:bg-gray-50',
            ].join(' ')}
          >
            <div className={`text-[10px] font-bold tracking-widest uppercase mb-1 ${activePanel === 'destination' ? 'text-blue-600' : 'text-gray-500'}`}>
              Enter your destination or property
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className={`text-lg font-bold truncate ${destination ? 'text-gray-900' : 'text-gray-400'}`}>
                {destination ? destination.name : 'Select Destination'}
              </span>
            </div>
          </button>

          {/* Dates wrapper — relative so the calendar anchors under the date fields */}
          <div className="col-span-2 grid grid-cols-2 sm:flex sm:flex-[2] relative">
            {/* Check In */}
            <button
              onClick={() => openDatePanel('start')}
              className={[
                'sm:flex-1 text-left px-5 py-4 border-r border-gray-200 transition-colors',
                activePanel === 'dates' && dateTab === 'start' ? 'bg-blue-50' : 'hover:bg-gray-50',
              ].join(' ')}
            >
              <div className={`text-[10px] font-bold tracking-widest uppercase mb-1 flex items-center gap-1 ${activePanel === 'dates' && dateTab === 'start' ? 'text-blue-600' : 'text-gray-500'}`}>
                <CalendarDays className="w-3 h-3" />
                Check In
                <ChevronDown className="w-3 h-3 ml-0.5" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-gray-900 leading-none">{formatDay(checkIn)}</span>
                <span className="text-base font-bold text-gray-900">{formatMonthYear(checkIn)}</span>
              </div>
              <div className="text-xs text-gray-500 mt-0.5">{formatWeekday(checkIn)}</div>
            </button>

            {/* Check Out */}
            <button
              onClick={() => openDatePanel('end')}
              className={[
                'sm:flex-1 text-left px-5 py-4 sm:border-r sm:border-gray-200 transition-colors',
                activePanel === 'dates' && dateTab === 'end' ? 'bg-blue-50' : 'hover:bg-gray-50',
              ].join(' ')}
            >
              <div className={`text-[10px] font-bold tracking-widest uppercase mb-1 flex items-center gap-1 ${activePanel === 'dates' && dateTab === 'end' ? 'text-blue-600' : 'text-gray-500'}`}>
                <CalendarDays className="w-3 h-3" />
                Check Out
                <ChevronDown className="w-3 h-3 ml-0.5" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-gray-900 leading-none">{formatDay(checkOut)}</span>
                <span className="text-base font-bold text-gray-900">{formatMonthYear(checkOut)}</span>
              </div>
              <div className="text-xs text-gray-500 mt-0.5">{formatWeekday(checkOut)}</div>
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

          {/* Rooms & Guests — full width on mobile */}
          <button
            onClick={() => setActivePanel(activePanel === 'guests' ? null : 'guests')}
            className={[
              'col-span-2 sm:flex-1 text-left px-5 py-4 transition-colors',
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
                  placeholder="Enter City/Hotel/Area/building"
                  className="flex-1 outline-none text-sm text-gray-800 placeholder-gray-400"
                />
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {loading && (
                <div className="px-4 py-3 text-sm text-gray-400">Searching...</div>
              )}
              {!loading && searchTerm.length < 2 && (
                <div className="px-4 py-3 text-sm text-gray-400 flex items-center gap-2">
                  <span>😊</span> Type your destination
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
                      <div className="text-xs text-gray-400">0 - 12 Years</div>
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
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-4 pt-2">
              <button onClick={addRoom} className="text-sm font-bold text-[#e8262a] flex items-center gap-1 hover:underline">
                <span className="text-base">+</span> Add Another Room
              </button>
              <button
                onClick={() => setActivePanel(null)}
                className="px-5 py-2 bg-[#e8262a] text-white text-sm font-bold rounded hover:bg-[#c9191d] transition-colors"
              >
                DONE
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Search Button row — matches Flights tab */}
      <div className="flex justify-end">
        <button
          onClick={handleSearch}
          className="px-10 py-3.5 bg-[#D34E4E] hover:bg-red-600 text-white text-sm font-bold rounded-full shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all uppercase tracking-wide"
        >
          SEARCH
        </button>
      </div>
    </div>
  );
};
