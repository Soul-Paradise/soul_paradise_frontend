'use client';

import { useState } from 'react';

export const HolidayPackages = () => {
  const [destination, setDestination] = useState('');
  const [departure, setDeparture] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [rooms, setRooms] = useState('1');
  const [adults, setAdults] = useState('2');
  const [children, setChildren] = useState('0');
  const [packageType, setPackageType] = useState('all');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Searching holiday packages...', {
      destination,
      departure,
      checkIn,
      checkOut,
      rooms,
      adults,
      children,
      packageType,
    });
  };

  const popularDestinations = [
    { name: 'Dubai', image: '🏙️', price: '₹45,000' },
    { name: 'Maldives', image: '🏝️', price: '₹85,000' },
    { name: 'Thailand', image: '🏯', price: '₹35,000' },
    { name: 'Singapore', image: '🌆', price: '₹55,000' },
    { name: 'Bali', image: '🌴', price: '₹40,000' },
    { name: 'Switzerland', image: '🏔️', price: '₹1,20,000' },
  ];

  return (
    <div className="space-y-6">
      {/* Package Type Selection */}
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="packageType"
            value="all"
            checked={packageType === 'all'}
            onChange={(e) => setPackageType(e.target.value)}
            className="w-4 h-4 text-(--color-links) focus:ring-2 focus:ring-(--color-links)"
          />
          <span className="font-medium text-gray-700">All Packages</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="packageType"
            value="family"
            checked={packageType === 'family'}
            onChange={(e) => setPackageType(e.target.value)}
            className="w-4 h-4 text-(--color-links) focus:ring-2 focus:ring-(--color-links)"
          />
          <span className="font-medium text-gray-700">Family Packages</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="packageType"
            value="honeymoon"
            checked={packageType === 'honeymoon'}
            onChange={(e) => setPackageType(e.target.value)}
            className="w-4 h-4 text-(--color-links) focus:ring-2 focus:ring-(--color-links)"
          />
          <span className="font-medium text-gray-700">Honeymoon Special</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="packageType"
            value="group"
            checked={packageType === 'group'}
            onChange={(e) => setPackageType(e.target.value)}
            className="w-4 h-4 text-(--color-links) focus:ring-2 focus:ring-(--color-links)"
          />
          <span className="font-medium text-gray-700">Group Tours</span>
        </label>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Destination */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Destination
            </label>
            <div className="relative">
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g., Dubai, Maldives, Thailand"
                className="w-full px-4 py-3 pl-10 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-links) focus:border-(--color-links) outline-none transition-all"
                required
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          {/* Departure City */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Departure From
            </label>
            <div className="relative">
              <input
                type="text"
                value={departure}
                onChange={(e) => setDeparture(e.target.value)}
                placeholder="e.g., New Delhi, Mumbai"
                className="w-full px-4 py-3 pl-10 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-links) focus:border-(--color-links) outline-none transition-all"
                required
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
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
                {[1, 2, 3, 4, 5].map((num) => (
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
                {[0, 1, 2, 3, 4].map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? 'Child' : 'Children'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Search Button */}
        <div className="flex justify-center pt-4">
          <button
            type="submit"
            className="w-full sm:w-auto px-12 py-4 bg-gradient-to-r from-(--color-success) to-green-600 text-white text-lg font-bold rounded-full hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            SEARCH PACKAGES
          </button>
        </div>
      </form>

      {/* Popular Destinations */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Popular Destinations</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {popularDestinations.map((dest, index) => (
            <div
              key={index}
              className="group cursor-pointer bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="text-4xl mb-2 text-center">{dest.image}</div>
              <h4 className="text-sm font-bold text-gray-800 text-center">{dest.name}</h4>
              <p className="text-xs text-(--color-links) text-center font-semibold mt-1">
                Starting {dest.price}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Info */}
      <div className="flex items-center gap-2 text-sm text-gray-600 bg-green-50 p-4 rounded-lg">
        <svg className="w-5 h-5 text-(--color-success) flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <p>
          <strong>All-Inclusive Holiday Packages:</strong> Flights + Hotels + Sightseeing + Meals included.
          Customizable packages available. EMI options on select packages.
        </p>
      </div>
    </div>
  );
};
