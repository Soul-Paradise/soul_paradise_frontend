'use client';

import { useState } from 'react';

export const TravelInsurance = () => {
  const [destination, setDestination] = useState('');
  const [travelType, setTravelType] = useState('international');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [travellers, setTravellers] = useState('1');
  const [age, setAge] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Insurance quote requested...', {
      destination,
      travelType,
      startDate,
      endDate,
      travellers,
      age,
      fullName,
      email,
      phone,
    });
  };

  const insurancePlans = [
    {
      name: 'Basic',
      price: '₹399',
      coverage: '₹1 Lakh',
      features: ['Medical Emergency', 'Trip Cancellation', 'Lost Baggage'],
    },
    {
      name: 'Standard',
      price: '₹799',
      coverage: '₹5 Lakhs',
      features: ['Medical Emergency', 'Trip Cancellation', 'Lost Baggage', 'Flight Delay'],
      popular: true,
    },
    {
      name: 'Premium',
      price: '₹1,499',
      coverage: '₹10 Lakhs',
      features: ['Medical Emergency', 'Trip Cancellation', 'Lost Baggage', 'Flight Delay', 'Adventure Sports'],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Travel Type Selection */}
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="travelType"
            value="international"
            checked={travelType === 'international'}
            onChange={(e) => setTravelType(e.target.value)}
            className="w-4 h-4 text-(--color-links) focus:ring-2 focus:ring-(--color-links)"
          />
          <span className="font-medium text-gray-700">International Travel</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="travelType"
            value="domestic"
            checked={travelType === 'domestic'}
            onChange={(e) => setTravelType(e.target.value)}
            className="w-4 h-4 text-(--color-links) focus:ring-2 focus:ring-(--color-links)"
          />
          <span className="font-medium text-gray-700">Domestic Travel</span>
        </label>
      </div>

      {/* Quote Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Destination */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Destination Country/City
            </label>
            <div className="relative">
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder={travelType === 'international' ? 'e.g., USA, Europe, Dubai' : 'e.g., Goa, Kerala, Rajasthan'}
                className="w-full px-4 py-3 pl-10 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-links) focus:border-(--color-links) outline-none transition-all"
                required
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          {/* Number of Travellers & Age */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Travellers & Age
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={travellers}
                onChange={(e) => setTravellers(e.target.value)}
                className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-links) focus:border-(--color-links) outline-none transition-all"
              >
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? 'Person' : 'People'}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Age"
                min="1"
                max="100"
                className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-links) focus:border-(--color-links) outline-none transition-all"
                required
              />
            </div>
          </div>

          {/* Start Date */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Travel Start Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 pl-10 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-links) focus:border-(--color-links) outline-none transition-all"
                required
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          {/* End Date */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Travel End Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 pl-10 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-links) focus:border-(--color-links) outline-none transition-all"
                required
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          {/* Full Name */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 pl-10 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-links) focus:border-(--color-links) outline-none transition-all"
                required
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>

          {/* Email */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full px-4 py-3 pl-10 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-links) focus:border-(--color-links) outline-none transition-all"
                required
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          {/* Phone */}
          <div className="relative md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <div className="relative">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9876543210"
                className="w-full px-4 py-3 pl-10 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-links) focus:border-(--color-links) outline-none transition-all"
                required
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center pt-4">
          <button
            type="submit"
            className="w-full sm:w-auto px-12 py-4 bg-gradient-to-r from-(--color-success) to-green-700 text-white text-lg font-bold rounded-full hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            GET QUOTE
          </button>
        </div>
      </form>

      {/* Insurance Plans */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Popular Insurance Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {insurancePlans.map((plan, index) => (
            <div
              key={index}
              className={`
                relative p-6 rounded-xl border-2 transition-all duration-300 transform hover:-translate-y-2
                ${plan.popular
                  ? 'border-(--color-success) bg-green-50 shadow-xl'
                  : 'border-gray-200 hover:border-(--color-success) hover:shadow-lg'
                }
              `}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-(--color-success) text-white text-xs font-bold px-4 py-1 rounded-full">
                    MOST POPULAR
                  </span>
                </div>
              )}
              <div className="text-center mb-4">
                <h4 className="text-xl font-bold text-gray-800 mb-2">{plan.name}</h4>
                <div className="text-3xl font-bold text-(--color-success) mb-1">{plan.price}</div>
                <p className="text-sm text-gray-600">per person</p>
              </div>
              <div className="mb-4">
                <p className="text-center text-sm font-semibold text-gray-700 mb-3">
                  Coverage: {plan.coverage}
                </p>
                <div className="space-y-2">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-(--color-success) flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button
                type="button"
                className={`
                  w-full py-3 rounded-lg font-semibold transition-all
                  ${plan.popular
                    ? 'bg-(--color-success) text-white hover:bg-green-700'
                    : 'bg-white border-2 border-(--color-success) text-(--color-success) hover:bg-(--color-success) hover:text-white'
                  }
                `}
              >
                Select Plan
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Coverage Details */}
      <div className="bg-green-50 p-6 rounded-lg">
        <h3 className="text-lg font-bold text-gray-800 mb-4">What's Covered?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            'Medical emergencies abroad',
            'Trip cancellation & delays',
            'Lost or stolen baggage',
            'Emergency evacuation',
            'Personal liability',
            '24/7 assistance',
          ].map((coverage, index) => (
            <div key={index} className="flex items-center gap-3">
              <svg className="w-5 h-5 text-(--color-success) flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-sm text-gray-700 font-medium">{coverage}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Info */}
      <div className="flex items-center gap-2 text-sm text-gray-600 bg-green-50 p-4 rounded-lg">
        <svg className="w-5 h-5 text-(--color-success) flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p>
          <strong>Travel Insurance:</strong> Protect yourself from unexpected expenses during travel.
          Instant policy issuance. Cashless claim settlement. Trusted insurance partners.
        </p>
      </div>
    </div>
  );
};
