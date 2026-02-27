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
      {/* Trip Type Tabs */}
      <div className="flex items-center gap-1">
        {(
          [
            { value: 'oneway', label: 'One Way' },
            { value: 'roundtrip', label: 'Round Trip' },
          ] as const
        ).map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => {
              setTripType(opt.value);
              if (opt.value === 'oneway') setReturnDate('');
            }}
            className={`px-5 py-2 text-sm font-semibold rounded-full border-2 transition-all ${
              tripType === opt.value
                ? 'border-(--color-links) bg-(--color-links) text-white'
                : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Main Search Fields — single bordered row */}
      <div className="border-2 border-gray-200 rounded-xl overflow-visible bg-white">
        <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
          {/* FROM */}
          <div className="flex-[2] min-w-0 relative ">
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
              className="absolute right-4 lg:right-[-18px] bottom-[-18px] lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2 z-20 w-9 h-9 bg-(--color-links) hover:bg-blue-700 rounded-full flex items-center justify-center shadow-md transition-all transform hover:rotate-180"
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

          {/* TO */}
          <div className="flex-[2] min-w-0">
            <AirportPicker
              label="To"
              value={toAirport}
              onChange={setToAirport}
              placeholder="City or Airport"
            />
          </div>

          {/* DEPARTURE */}
          <div className="flex-[1.3] min-w-0">
            <DateDisplay
              label="Departure"
              value={departDate}
              onChange={setDepartDate}
              minDate={today}
            />
          </div>

          {/* RETURN */}
          <div className="flex-[1.3] min-w-0">
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

          {/* TRAVELLERS & CLASS */}
          <div className="flex-[1.5] min-w-0">
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
          className="w-full sm:w-auto px-8 py-3.5 bg-(--color-danger) hover:bg-red-600 text-white text-sm font-bold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 uppercase tracking-wide flex items-center justify-center gap-2"
        >
          Search
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
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
