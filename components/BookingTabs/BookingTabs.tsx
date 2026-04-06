'use client';

import { useState } from 'react';
import { Hotel, Plane, ShieldCheck } from 'lucide-react';
import { FlightBooking } from './FlightBooking';
import { HotelBooking } from './HotelBooking';
import { TravelInsurance } from './TravelInsurance';

type TabType = 'flights' | 'hotel' | 'insurance';

const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
  {
    id: 'flights',
    label: 'Flights',
    icon: (
      <Plane className="w-5 h-5" />
    ),
  },
  {
    id: 'hotel',
    label: 'Hotels',
    icon: (
      <Hotel className="w-5 h-5" />
    ),
  },
  {
    id: 'insurance',
    label: 'Travel\nInsurance',
    icon: (
      <ShieldCheck className="w-5 h-5" />
    ),
  },
];

export const BookingTabs = () => {
  const [activeTab, setActiveTab] = useState<TabType>('flights');

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-4">
      <div className="bg-white rounded-2xl overflow-visible" style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.45)' }}>
        {/* Tabs Navigation — MMT style: icons above labels, blue underline for active */}
        <div className="border-b border-gray-100 overflow-x-auto scrollbar-hide">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex flex-col items-center gap-1 px-5 py-2.5 min-w-[80px] transition-colors ${
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
        <div className="p-4 sm:p-5 lg:p-6">
          {activeTab === 'flights' && <FlightBooking />}
          {activeTab === 'hotel' && <HotelBooking />}
          {activeTab === 'insurance' && <TravelInsurance />}
        </div>
      </div>
    </div>
  );
};
