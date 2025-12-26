'use client';

import { useState } from 'react';

export const HotelBooking = () => {
  const [city, setCity] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [rooms, setRooms] = useState('1');
  const [adults, setAdults] = useState('2');
  const [children, setChildren] = useState('0');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Searching hotels...', { city, checkIn, checkOut, rooms, adults, children });
  };

  const popularCities = [
    { name: 'Dubai', type: 'International', hotels: '2000+' },
    { name: 'Bangkok', type: 'International', hotels: '1500+' },
    { name: 'Singapore', type: 'International', hotels: '1000+' },
    { name: 'Mumbai', type: 'Domestic', hotels: '3000+' },
    { name: 'Goa', type: 'Domestic', hotels: '1800+' },
    { name: 'Delhi', type: 'Domestic', hotels: '2500+' },
  ];

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* City/Destination */}
          <div className="relative lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City, Area, or Hotel Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g., Dubai, Goa, Taj Hotel Mumbai"
                className="w-full px-4 py-3 pl-10 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-links) focus:border-(--color-links) outline-none transition-all"
                required
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Check-in Date */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Check-in
            </label>
            <div className="relative">
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 pl-10 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-links) focus:border-(--color-links) outline-none transition-all"
                required
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          {/* Check-out Date */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Check-out
            </label>
            <div className="relative">
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                min={checkIn || new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 pl-10 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-links) focus:border-(--color-links) outline-none transition-all"
                required
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          {/* Rooms & Guests */}
          <div className="relative lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rooms & Guests
            </label>
            <div className="grid grid-cols-3 gap-2">
              <select
                value={rooms}
                onChange={(e) => setRooms(e.target.value)}
                className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-links) focus:border-(--color-links) outline-none transition-all"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? 'Room' : 'Rooms'}
                  </option>
                ))}
              </select>
              <select
                value={adults}
                onChange={(e) => setAdults(e.target.value)}
                className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-links) focus:border-(--color-links) outline-none transition-all"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? 'Adult' : 'Adults'}
                  </option>
                ))}
              </select>
              <select
                value={children}
                onChange={(e) => setChildren(e.target.value)}
                className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-links) focus:border-(--color-links) outline-none transition-all"
              >
                {[0, 1, 2, 3, 4, 5, 6].map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? 'Child' : 'Children'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Hotel Preferences */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Hotel Preferences</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { label: 'All Hotels', icon: '🏨' },
              { label: '5 Star', icon: '⭐⭐⭐⭐⭐' },
              { label: '4 Star', icon: '⭐⭐⭐⭐' },
              { label: '3 Star', icon: '⭐⭐⭐' },
              { label: 'Budget', icon: '💰' },
            ].map((pref, index) => (
              <label
                key={index}
                className={`
                  flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all
                  ${index === 0 ? 'border-(--color-links) bg-blue-50' : 'border-gray-200 hover:border-(--color-links)'}
                `}
              >
                <input
                  type="radio"
                  name="hotelPref"
                  defaultChecked={index === 0}
                  className="sr-only"
                />
                <span className="text-sm">{pref.icon}</span>
                <span className="text-sm font-medium text-gray-800">{pref.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Search Button */}
        <div className="flex justify-center pt-4">
          <button
            type="submit"
            className="w-full sm:w-auto px-12 py-4 bg-gradient-to-r from-(--color-warn) to-orange-600 text-white text-lg font-bold rounded-full hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            SEARCH HOTELS
          </button>
        </div>
      </form>

      {/* Popular Cities */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Popular Hotel Destinations</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {popularCities.map((city, index) => (
            <div
              key={index}
              className="group cursor-pointer bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="text-3xl mb-2 text-center">🏨</div>
              <h4 className="text-sm font-bold text-gray-800 text-center">{city.name}</h4>
              <p className="text-xs text-gray-600 text-center mt-1">{city.type}</p>
              <p className="text-xs text-(--color-warn) text-center font-semibold mt-1">
                {city.hotels} hotels
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Info */}
      <div className="flex items-center gap-2 text-sm text-gray-600 bg-orange-50 p-4 rounded-lg">
        <svg className="w-5 h-5 text-(--color-warn) flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
        </svg>
        <p>
          <strong>Best Hotel Deals:</strong> Compare prices from 100+ travel sites.
          Free cancellation on select hotels. Verified reviews from real guests.
        </p>
      </div>
    </div>
  );
};
