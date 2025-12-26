'use client';

import { useState } from 'react';

interface FlightBookingProps {
  type: 'international' | 'domestic';
}

type TripType = 'oneway' | 'roundtrip' | 'multicity';

export const FlightBooking = ({ type }: FlightBookingProps) => {
  const [tripType, setTripType] = useState<TripType>('oneway');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [departDate, setDepartDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [travellers, setTravellers] = useState('1');
  const [travelClass, setTravelClass] = useState('economy');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Searching flights...', { type, tripType, from, to, departDate, returnDate, travellers, travelClass });
  };

  const swapLocations = () => {
    const temp = from;
    setFrom(to);
    setTo(temp);
  };

  return (
    <div className="space-y-6">
      {/* Trip Type Selection */}
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="tripType"
            value="oneway"
            checked={tripType === 'oneway'}
            onChange={(e) => setTripType(e.target.value as TripType)}
            className="w-4 h-4 text-(--color-links) focus:ring-2 focus:ring-(--color-links)"
          />
          <span className="font-medium text-gray-700">One Way</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="tripType"
            value="roundtrip"
            checked={tripType === 'roundtrip'}
            onChange={(e) => setTripType(e.target.value as TripType)}
            className="w-4 h-4 text-(--color-links) focus:ring-2 focus:ring-(--color-links)"
          />
          <span className="font-medium text-gray-700">Round Trip</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="tripType"
            value="multicity"
            checked={tripType === 'multicity'}
            onChange={(e) => setTripType(e.target.value as TripType)}
            className="w-4 h-4 text-(--color-links) focus:ring-2 focus:ring-(--color-links)"
          />
          <span className="font-medium text-gray-700">Multi City</span>
        </label>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* From Field */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From
            </label>
            <div className="relative">
              <input
                type="text"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                placeholder={type === 'international' ? 'e.g., New Delhi (DEL)' : 'e.g., Mumbai (BOM)'}
                className="w-full px-4 py-3 pl-10 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-links) focus:border-(--color-links) outline-none transition-all"
                required
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>

          {/* Swap Button - Hidden on mobile, shown on larger screens */}
          <div className="hidden lg:flex items-end justify-center pb-3">
            <button
              type="button"
              onClick={swapLocations}
              className="p-2 bg-gray-100 hover:bg-(--color-links) hover:text-white rounded-full transition-all duration-300 transform hover:rotate-180"
              aria-label="Swap locations"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </button>
          </div>

          {/* To Field */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To
            </label>
            <div className="relative">
              <input
                type="text"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder={type === 'international' ? 'e.g., Dubai (DXB)' : 'e.g., Bengaluru (BLR)'}
                className="w-full px-4 py-3 pl-10 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-links) focus:border-(--color-links) outline-none transition-all"
                required
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>

          {/* Departure Date */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Departure
            </label>
            <div className="relative">
              <input
                type="date"
                value={departDate}
                onChange={(e) => setDepartDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 pl-10 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-links) focus:border-(--color-links) outline-none transition-all"
                required
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          {/* Return Date - Shown for Round Trip */}
          {tripType === 'roundtrip' && (
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Return
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  min={departDate || new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 pl-10 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-links) focus:border-(--color-links) outline-none transition-all"
                  required={tripType === 'roundtrip'}
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          )}

          {/* Travellers & Class */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Travellers & Class
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={travellers}
                onChange={(e) => setTravellers(e.target.value)}
                className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-links) focus:border-(--color-links) outline-none transition-all"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? 'Traveller' : 'Travellers'}
                  </option>
                ))}
              </select>
              <select
                value={travelClass}
                onChange={(e) => setTravelClass(e.target.value)}
                className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-links) focus:border-(--color-links) outline-none transition-all"
              >
                <option value="economy">Economy</option>
                <option value="premium">Premium</option>
                <option value="business">Business</option>
                <option value="first">First Class</option>
              </select>
            </div>
          </div>
        </div>

        {/* Special Fares */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Special Fares</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Regular', desc: 'Regular fares' },
              { label: 'Student', desc: 'Extra discounts' },
              { label: 'Senior Citizen', desc: 'Up to ₹600 off', badge: true },
              { label: 'Armed Forces', desc: 'Up to ₹600 off', badge: true },
              { label: 'Doctor & Nurses', desc: 'Up to ₹600 off', badge: true },
              { label: 'Travel Agents', desc: 'Special rates' },
            ].map((fare, index) => (
              <label
                key={index}
                className={`
                  relative flex flex-col p-3 border-2 rounded-lg cursor-pointer transition-all
                  ${index === 0 ? 'border-(--color-links) bg-blue-50' : 'border-gray-200 hover:border-(--color-links)'}
                `}
              >
                <input
                  type="radio"
                  name="specialFare"
                  defaultChecked={index === 0}
                  className="sr-only"
                />
                <span className="text-sm font-medium text-gray-800">{fare.label}</span>
                <span className="text-xs text-gray-500">{fare.desc}</span>
                {fare.badge && (
                  <span className="absolute -top-2 -right-2 bg-(--color-danger) text-white text-xs px-2 py-0.5 rounded-full">
                    Save
                  </span>
                )}
              </label>
            ))}
          </div>
        </div>

        {/* Search Button */}
        <div className="flex justify-center pt-4">
          <button
            type="submit"
            className="w-full sm:w-auto px-12 py-4 bg-gradient-to-r from-(--color-links) to-blue-600 text-white text-lg font-bold rounded-full hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            SEARCH FLIGHTS
          </button>
        </div>
      </form>

      {/* Additional Info */}
      <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 p-4 rounded-lg">
        <svg className="w-5 h-5 text-(--color-links) flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p>
          <strong>Book {type === 'international' ? 'International' : 'Domestic'} Flights:</strong> We offer the best deals on all airlines.
          24/7 customer support available. IATA certified travel agency.
        </p>
      </div>
    </div>
  );
};
