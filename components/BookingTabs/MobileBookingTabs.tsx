'use client';

import { useState } from 'react';
import { Plane, Hotel, ShieldCheck, X } from 'lucide-react';
import { FlightBooking } from './FlightBooking';
import { HotelBooking } from './HotelBooking';
import { TravelInsurance } from './TravelInsurance';

type TabType = 'flights' | 'hotel' | 'insurance';

const tabs: { id: TabType; label: string; icon: React.ReactNode; bg: string; iconColor: string }[] = [
  {
    id: 'flights',
    label: 'Flights',
    icon: <Plane className="w-8 h-8" strokeWidth={1.5} />,
    bg: 'bg-blue-50',
    iconColor: 'text-[#1F7AC4]',
  },
  {
    id: 'hotel',
    label: 'Hotels',
    icon: <Hotel className="w-8 h-8" strokeWidth={1.5} />,
    bg: 'bg-teal-50',
    iconColor: 'text-teal-600',
  },
  {
    id: 'insurance',
    label: 'Travel Insurance',
    icon: <ShieldCheck className="w-8 h-8" strokeWidth={1.5} />,
    bg: 'bg-purple-50',
    iconColor: 'text-purple-600',
  },
];

export const MobileBookingTabs = () => {
  const [activeTab, setActiveTab] = useState<TabType | null>(null);

  const handleTabClick = (id: TabType) => {
    setActiveTab((prev) => (prev === id ? null : id));
  };

  return (
    <div className="w-full">
      {/* Icon Grid */}
      <div className="bg-white px-4 pt-5 pb-4">
        <div className="grid grid-cols-3 gap-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex flex-col items-center gap-2 py-4 px-2 rounded-2xl transition-all duration-200 ${
                activeTab === tab.id
                  ? `${tab.bg} ring-2 ring-[#1F7AC4] ring-offset-1 scale-[0.97]`
                  : 'bg-gray-50 hover:bg-gray-100 active:scale-95'
              }`}
            >
              <span className={`${activeTab === tab.id ? tab.iconColor : 'text-gray-500'} transition-colors`}>
                {tab.icon}
              </span>
              <span
                className={`text-[12px] font-semibold text-center leading-tight ${
                  activeTab === tab.id ? 'text-[#1F7AC4]' : 'text-gray-600'
                }`}
              >
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Expandable Form Panel */}
      {activeTab && (
        <div className="bg-white border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
          {/* Form header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              {tabs.find((t) => t.id === activeTab) && (
                <>
                  <span className={tabs.find((t) => t.id === activeTab)!.iconColor}>
                    {tabs.find((t) => t.id === activeTab)!.icon && (
                      <span className="[&>svg]:w-4 [&>svg]:h-4">
                        {tabs.find((t) => t.id === activeTab)!.icon}
                      </span>
                    )}
                  </span>
                  <span className="text-sm font-bold text-gray-700">
                    {tabs.find((t) => t.id === activeTab)!.label}
                  </span>
                </>
              )}
            </div>
            <button
              onClick={() => setActiveTab(null)}
              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form content */}
          <div className="p-4">
            {activeTab === 'flights' && <FlightBooking />}
            {activeTab === 'hotel' && <HotelBooking />}
            {activeTab === 'insurance' && <TravelInsurance />}
          </div>
        </div>
      )}
    </div>
  );
};
