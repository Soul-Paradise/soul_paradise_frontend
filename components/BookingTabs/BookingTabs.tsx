'use client';

import { useState } from 'react';
import { FlightBooking } from './FlightBooking';
import { HotelBooking } from './HotelBooking';
import { TravelInsurance } from './TravelInsurance';

type TabType = 'flights' | 'hotel' | 'insurance';

const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
  {
    id: 'flights',
    label: 'Flights',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
        <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
      </svg>
    ),
  },
  {
    id: 'hotel',
    label: 'Hotels',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
        <path d="M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z"/>
      </svg>
    ),
  },
  {
    id: 'insurance',
    label: 'Travel\nInsurance',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 4l5 2.18V11c0 3.5-2.33 6.79-5 7.93-2.67-1.14-5-4.43-5-7.93V7.18L12 5zm-2 9l5-5-1.41-1.42L10 11.17l-1.59-1.59L7 11l3 3z"/>
      </svg>
    ),
  },
];

export const BookingTabs = () => {
  const [activeTab, setActiveTab] = useState<TabType>('flights');

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <div className="bg-white rounded-2xl shadow-2xl overflow-visible">
        {/* Tabs Navigation — MMT style: icons above labels, blue underline for active */}
        <div className="border-b border-gray-100 overflow-x-auto scrollbar-hide">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex flex-col items-center gap-1 px-5 py-3.5 min-w-[88px] transition-colors ${
                  activeTab === tab.id
                    ? 'text-[#1F7AC4]'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tab.icon}
                <span className="text-[11px] font-semibold text-center leading-tight whitespace-pre-line">
                  {tab.label}
                </span>
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-3 right-3 h-[3px] bg-[#1F7AC4] rounded-t-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-5 sm:p-6 lg:p-8">
          {activeTab === 'flights' && <FlightBooking />}
          {activeTab === 'hotel' && <HotelBooking />}
          {activeTab === 'insurance' && <TravelInsurance />}
        </div>
      </div>
    </div>
  );
};
