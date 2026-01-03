'use client';

import { useState } from 'react';
import { FlightBooking } from './FlightBooking';
import { HolidayPackages } from './HolidayPackages';
import { HotelBooking } from './HotelBooking';
import { TouristVisa } from './TouristVisa';
import { TravelInsurance } from './TravelInsurance';

type TabType = 'flight' | 'package' | 'hotel' | 'visa' | 'insurance';

interface Tab {
  id: TabType;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

export const BookingTabs = () => {
  const [activeTab, setActiveTab] = useState<TabType>('flight');

  const tabs: Tab[] = [
    {
      id: 'flight',
      label: 'Flight Tickets',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      ),
    },
    {
      id: 'package',
      label: 'Holiday Packages',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      badge: 'Popular',
    },
    {
      id: 'hotel',
      label: 'Hotel Booking',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      id: 'visa',
      label: 'Tourist Visa',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      id: 'insurance',
      label: 'Travel Insurance',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'flight':
        return <FlightBooking type="domestic" />;
      case 'package':
        return <HolidayPackages />;
      case 'hotel':
        return <HotelBooking />;
      case 'visa':
        return <TouristVisa />;
      case 'insurance':
        return <TravelInsurance />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Tabs Navigation */}
        <div className="bg-gradient-to-r from-(--color-primary-button) to-(--color-secondary-button) p-1">
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex min-w-max lg:min-w-0 lg:grid lg:grid-cols-6 gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    relative flex items-center justify-center gap-2 px-4 py-3 sm:py-4
                    text-sm sm:text-base font-medium transition-all duration-300
                    whitespace-nowrap sm:whitespace-normal
                    ${
                      activeTab === tab.id
                        ? 'bg-white text-(--color-primary-button) shadow-lg'
                        : 'text-white hover:bg-white/10'
                    }
                  `}
                >
                  <span className="flex-shrink-0">{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                  {tab.badge && activeTab === tab.id && (
                    <span className="absolute -top-1 -right-1 bg-(--color-success) text-white text-xs px-2 py-0.5 rounded-full">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6 lg:p-8">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};
