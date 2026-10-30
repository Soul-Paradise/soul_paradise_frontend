'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CreditCard, Hotel, Plane, ShieldCheck } from 'lucide-react';
import { FlightBooking } from './FlightBooking';
import { HotelBooking } from './HotelBooking';
import { TravelInsurance } from './TravelInsurance';
import { CustomPayment } from './CustomPayment';

type TabType = 'flights' | 'hotel' | 'insurance' | 'payment';

const isTabType = (v: string | null): v is TabType =>
  v === 'flights' || v === 'hotel' || v === 'insurance' || v === 'payment';

/** Each tab has its own accent, from the same palette as the rest of the site. */
const tabs: { id: TabType; label: string; icon: React.ReactNode; accent: string }[] = [
  { id: 'flights', label: 'Flights', icon: <Plane className="w-[18px] h-[18px]" />, accent: 'from-blue-500 to-indigo-600' },
  { id: 'hotel', label: 'Hotels', icon: <Hotel className="w-[18px] h-[18px]" />, accent: 'from-emerald-500 to-teal-600' },
  { id: 'insurance', label: 'Insurance', icon: <ShieldCheck className="w-[18px] h-[18px]" />, accent: 'from-purple-500 to-violet-600' },
  { id: 'payment', label: 'Custom Payment', icon: <CreditCard className="w-[18px] h-[18px]" />, accent: 'from-orange-500 to-red-500' },
];

const BookingTabsInner = () => {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<TabType>(
    isTabType(tabParam) ? tabParam : 'flights',
  );

  // Sync the active tab when the ?tab= param changes (e.g. footer deep links
  // navigated to while already on the home page, where this stays mounted).
  const [prevParam, setPrevParam] = useState(tabParam);
  if (tabParam !== prevParam) {
    setPrevParam(tabParam);
    if (isTabType(tabParam)) setActiveTab(tabParam);
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-4">
      <div className="bg-white rounded-2xl overflow-visible" style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.45)' }}>
        {/* Tabs: icon tile + label; the active tile fills with the tab's accent */}
        <div className="border-b border-gray-100 overflow-x-auto scrollbar-hide rounded-t-2xl px-2 sm:px-4">
          <div className="flex gap-1">
            {tabs.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  aria-pressed={active}
                  className={`group relative flex items-center gap-2.5 px-3 sm:px-4 py-3.5 whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-(--color-links)/40 ${
                    active ? 'text-gray-900' : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
                      active
                        ? `bg-gradient-to-br ${tab.accent} text-white shadow-md`
                        : 'bg-slate-100 text-gray-500 group-hover:bg-slate-200'
                    }`}
                  >
                    {tab.icon}
                  </span>
                  <span className="text-sm font-bold">{tab.label}</span>
                  {active && (
                    <span className={`absolute bottom-0 left-2 right-2 h-[3px] rounded-t-full bg-gradient-to-r ${tab.accent}`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-5 lg:p-6">
          {activeTab === 'flights' && <FlightBooking />}
          {activeTab === 'hotel' && <HotelBooking />}
          {activeTab === 'insurance' && <TravelInsurance />}
          {activeTab === 'payment' && <CustomPayment />}
        </div>
      </div>
    </div>
  );
};

export const BookingTabs = () => (
  <Suspense fallback={<div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-4" />}>
    <BookingTabsInner />
  </Suspense>
);
