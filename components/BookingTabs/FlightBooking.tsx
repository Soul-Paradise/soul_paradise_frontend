'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AirportPicker } from './AirportPicker';
import { DateDisplay } from './DateDisplay';
import {
  TravellerSelector,
  type TravellerCounts,
  type CabinClass,
} from './TravellerSelector';
import type { Airport } from '@/lib/flights-api';

type TripType = 'oneway' | 'roundtrip';

export const FlightBooking = () => {
  const router = useRouter();

  const [tripType, setTripType] = useState<TripType>('oneway');
  const [fromAirport, setFromAirport] = useState<Airport | null>(null);
  const [toAirport, setToAirport] = useState<Airport | null>(null);
  const [departDate, setDepartDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [travellers, setTravellers] = useState<TravellerCounts>({
    adults: 1,
    children: 0,
    infants: 0,
  });
  const [cabinClass, setCabinClass] = useState<CabinClass>('E');
  const [error, setError] = useState('');
  const swapLocations = () => {
    const temp = fromAirport;
    setFromAirport(toAirport);
    setToAirport(temp);
  };

  const handleSearch = () => {
    setError('');

    if (!fromAirport) {
      setError('Please select departure city');
      return;
    }
    if (!toAirport) {
      setError('Please select destination city');
      return;
    }
    if (fromAirport.code === toAirport.code) {
      setError('Departure and destination cannot be the same');
      return;
    }
    if (!departDate) {
      setError('Please select departure date');
      return;
    }
    if (tripType === 'roundtrip' && !returnDate) {
      setError('Please select return date');
      return;
    }

    const params = new URLSearchParams({
      from: fromAirport.code,
      to: toAirport.code,
      fromName: fromAirport.cityName,
      toName: toAirport.cityName,
      departDate,
      adults: travellers.adults.toString(),
      children: travellers.children.toString(),
      infants: travellers.infants.toString(),
      cabin: cabinClass,
      tripType,
      directOnly: 'false',
      refundableOnly: 'false',
      nearbyAirports: 'true',
    });

    if (tripType === 'roundtrip' && returnDate) {
      params.set('returnDate', returnDate);
    }

    router.push(`/booking/flights?${params.toString()}`);
  };

  const handleReturnClick = () => {
    if (tripType === 'oneway') {
      setTripType('roundtrip');
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-5">
      {/* Trip Type + subtitle row */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1">
          {(
            [
              { value: 'oneway', label: 'One Way' },
              { value: 'roundtrip', label: 'Round Trip' },
            ] as const
          ).map((opt) => (
            <label key={opt.value} className="flex items-center gap-1.5 cursor-pointer px-3 py-1.5">
              <input
                type="radio"
                name="tripType"
                value={opt.value}
                checked={tripType === opt.value}
                onChange={() => {
                  setTripType(opt.value);
                  if (opt.value === 'oneway') setReturnDate('');
                }}
                className="w-4 h-4 accent-[#1F7AC4]"
              />
              <span className={`text-sm font-semibold ${tripType === opt.value ? 'text-[#1F7AC4]' : 'text-gray-600'}`}>
                {opt.label}
              </span>
            </label>
          ))}
        </div>
        <span className="text-sm text-gray-500 font-medium hidden sm:block">
          Book International and Domestic Flights
        </span>
      </div>

      {/* Main Search Fields — single bordered row */}
      <div className="border-2 border-gray-200 rounded-xl overflow-visible bg-white">
        <div className="grid grid-cols-2 sm:flex sm:items-stretch divide-y divide-gray-200 sm:divide-y-0">
          {/* FROM — full width on mobile */}
          <div className="col-span-2 sm:flex-[2] min-w-0 relative sm:border-r sm:border-gray-200">
            <AirportPicker
              label="From"
              value={fromAirport}
              onChange={setFromAirport}
              placeholder="City or Airport"
            />

            {/* Swap button - overlaps between From and To */}
            <button
              type="button"
              onClick={swapLocations}
              className="absolute right-4 sm:right-[-18px] bottom-[-18px] sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 z-20 w-9 h-9 bg-(--color-links) hover:bg-blue-700 rounded-full flex items-center justify-center shadow-md transition-all transform hover:rotate-180"
              aria-label="Swap locations"
            >
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
            </button>
          </div>

          {/* TO — full width on mobile */}
          <div className="col-span-2 sm:flex-[2] min-w-0 sm:border-r sm:border-gray-200">
            <AirportPicker
              label="To"
              value={toAirport}
              onChange={setToAirport}
              placeholder="City or Airport"
            />
          </div>

          {/* DEPARTURE — left half on mobile */}
          <div className="col-span-1 sm:flex-[1.3] min-w-0 border-r border-gray-200">
            <DateDisplay
              label="Departure"
              value={departDate}
              onChange={setDepartDate}
              minDate={today}
            />
          </div>

          {/* RETURN — right half on mobile */}
          <div className="col-span-1 sm:flex-[1.3] min-w-0 sm:border-r sm:border-gray-200">
            <DateDisplay
              label="Return"
              value={returnDate}
              onChange={setReturnDate}
              minDate={departDate || today}
              disabled={tripType === 'oneway'}
              emptyText="Book a round trip to save more"
              onClickWhenEmpty={handleReturnClick}
            />
          </div>

          {/* TRAVELLERS & CLASS — full width on mobile */}
          <div className="col-span-2 sm:flex-[1.5] min-w-0">
            <TravellerSelector
              travellers={travellers}
              cabinClass={cabinClass}
              onTravellersChange={setTravellers}
              onCabinChange={setCabinClass}
            />
          </div>
        </div>
      </div>

      {/* Search Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSearch}
          className="px-10 py-3.5 bg-[#D34E4E] hover:bg-red-600 text-white text-sm font-bold rounded-full shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all uppercase tracking-wide whitespace-nowrap"
        >
          SEARCH
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
};
