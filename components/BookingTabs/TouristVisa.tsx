'use client';

import { useState } from 'react';

export const TouristVisa = () => {
  const [country, setCountry] = useState('');
  const [nationality, setNationality] = useState('India');
  const [travelDate, setTravelDate] = useState('');
  const [visaType, setVisaType] = useState('tourist');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Visa application submitted...', {
      country,
      nationality,
      travelDate,
      visaType,
      fullName,
      email,
      phone,
    });
  };

  const popularVisas = [
    { country: 'Dubai', flag: '🇦🇪', processing: '3-5 days', price: '₹6,500' },
    { country: 'Singapore', flag: '🇸🇬', processing: '5-7 days', price: '₹4,500' },
    { country: 'Thailand', flag: '🇹🇭', processing: '7-10 days', price: '₹3,500' },
    { country: 'Malaysia', flag: '🇲🇾', processing: '3-5 days', price: '₹3,000' },
    { country: 'USA', flag: '🇺🇸', processing: '15-20 days', price: '₹18,000' },
    { country: 'UK', flag: '🇬🇧', processing: '15-20 days', price: '₹12,000' },
  ];

  return (
    <div className="space-y-6">
      {/* Visa Type Selection */}
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="visaType"
            value="tourist"
            checked={visaType === 'tourist'}
            onChange={(e) => setVisaType(e.target.value)}
            className="w-4 h-4 text-(--color-links) focus:ring-2 focus:ring-(--color-links)"
          />
          <span className="font-medium text-gray-700">Tourist Visa</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="visaType"
            value="business"
            checked={visaType === 'business'}
            onChange={(e) => setVisaType(e.target.value)}
            className="w-4 h-4 text-(--color-links) focus:ring-2 focus:ring-(--color-links)"
          />
          <span className="font-medium text-gray-700">Business Visa</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="visaType"
            value="student"
            checked={visaType === 'student'}
            onChange={(e) => setVisaType(e.target.value)}
            className="w-4 h-4 text-(--color-links) focus:ring-2 focus:ring-(--color-links)"
          />
          <span className="font-medium text-gray-700">Student Visa</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="visaType"
            value="work"
            checked={visaType === 'work'}
            onChange={(e) => setVisaType(e.target.value)}
            className="w-4 h-4 text-(--color-links) focus:ring-2 focus:ring-(--color-links)"
          />
          <span className="font-medium text-gray-700">Work Visa</span>
        </label>
      </div>

      {/* Application Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Country */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country You Want to Visit
            </label>
            <div className="relative">
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g., Dubai, Singapore, USA"
                className="w-full px-4 py-3 pl-10 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-links) focus:border-(--color-links) outline-none transition-all"
                required
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          {/* Nationality */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Nationality
            </label>
            <div className="relative">
              <select
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                className="w-full px-4 py-3 pl-10 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-links) focus:border-(--color-links) outline-none transition-all appearance-none"
                required
              >
                <option value="India">India</option>
                <option value="USA">USA</option>
                <option value="UK">UK</option>
                <option value="Canada">Canada</option>
                <option value="Australia">Australia</option>
                <option value="Other">Other</option>
              </select>
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
              </svg>
            </div>
          </div>

          {/* Travel Date */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expected Travel Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={travelDate}
                onChange={(e) => setTravelDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
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
              Full Name (as per Passport)
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
          <div className="relative">
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
            className="w-full sm:w-auto px-12 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-lg font-bold rounded-full hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            SUBMIT APPLICATION
          </button>
        </div>
      </form>

      {/* Popular Visas */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Popular Visa Services</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {popularVisas.map((visa, index) => (
            <div
              key={index}
              className="group cursor-pointer bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="text-4xl mb-2 text-center">{visa.flag}</div>
              <h4 className="text-sm font-bold text-gray-800 text-center">{visa.country}</h4>
              <p className="text-xs text-gray-600 text-center mt-1">{visa.processing}</p>
              <p className="text-xs text-purple-600 text-center font-semibold mt-1">
                From {visa.price}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Services Included */}
      <div className="bg-purple-50 p-6 rounded-lg">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Our Visa Services Include</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            'Complete documentation assistance',
            'Application form filling',
            'Appointment scheduling',
            'Document verification',
            'Status tracking',
            'Expert consultation',
          ].map((service, index) => (
            <div key={index} className="flex items-center gap-3">
              <svg className="w-5 h-5 text-purple-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-gray-700">{service}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Info */}
      <div className="flex items-center gap-2 text-sm text-gray-600 bg-purple-50 p-4 rounded-lg">
        <svg className="w-5 h-5 text-purple-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p>
          <strong>Visa Assistance:</strong> Expert guidance for all visa types.
          High success rate. Hassle-free process. Call us for personalized assistance.
        </p>
      </div>
    </div>
  );
};
