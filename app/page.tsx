'use client';

import { useState, useEffect } from 'react';
import { BookingTabs, MobileBookingTabs } from '@/components/BookingTabs';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

type OfferCategory = 'ALL_OFFERS' | 'BANK_OFFERS' | 'FLIGHTS' | 'HOTELS' | 'HOLIDAYS' | 'VISA';

interface Offer {
  id: string;
  title: string;
  description: string;
  category: OfferCategory;
  colorTheme: string;
  isActive: boolean;
  sortOrder: number;
  validFrom: string | null;
  validUntil: string | null;
}

const COLOR_GRADIENTS: Record<string, string> = {
  blue: 'from-blue-500 to-indigo-600',
  green: 'from-emerald-500 to-teal-600',
  orange: 'from-orange-500 to-red-500',
  purple: 'from-purple-500 to-violet-600',
  teal: 'from-teal-500 to-cyan-600',
  pink: 'from-pink-500 to-rose-600',
};

const CATEGORY_LABELS: Record<OfferCategory, string> = {
  ALL_OFFERS: 'All Offers',
  BANK_OFFERS: 'Bank Offers',
  FLIGHTS: 'Flights',
  HOTELS: 'Hotels',
  HOLIDAYS: 'Holidays',
  VISA: 'Visa',
};

const offerTabs = ['All Offers', 'Bank Offers', 'Flights', 'Hotels', 'Holidays', 'Visa'];

const TAB_TO_CATEGORY: Record<string, OfferCategory> = {
  'All Offers': 'ALL_OFFERS',
  'Bank Offers': 'BANK_OFFERS',
  'Flights': 'FLIGHTS',
  'Hotels': 'HOTELS',
  'Holidays': 'HOLIDAYS',
  'Visa': 'VISA',
};

const exploreLinks = [
  { label: 'Where2Go', desc: 'Discover destinations', badge: null },
  { label: 'How2Go', desc: 'Find routes to anywhere', badge: 'new' },
  { label: 'Credit Card Offers', desc: 'Never-expiring rewards', badge: null },
  { label: 'MICE', desc: 'Offsites, Events & Meetings', badge: null },
  { label: 'Gift Cards', desc: 'Share the joy of travel', badge: null },
];

export default function Home() {
  const [activeOfferTab, setActiveOfferTab] = useState('All Offers');
  const [showExplore, setShowExplore] = useState(false);
  const [offers, setOffers] = useState<Offer[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/offers`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setOffers(data);
      })
      .catch(() => {});
  }, []);

  const filteredOffers =
    activeOfferTab === 'All Offers'
      ? offers
      : offers.filter((o) => o.category === TAB_TO_CATEGORY[activeOfferTab]);

  return (
    <main className="min-h-screen bg-(--color-background)">
      {/* ── Mobile Icon View (small screens only) ── */}
      <section className="sm:hidden bg-white shadow-sm">
        <MobileBookingTabs />
      </section>

      {/* ── Hero Section (sm+ only) ── */}
      <section
        className="relative h-[400px] hidden sm:flex items-center pb-10 overflow-hidden"
        style={{ backgroundImage: 'url(/hero_bg.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Booking card */}
        <div className="relative z-20 w-full mt-16">
          <BookingTabs />
        </div>
      </section>

      {/* ── Explore More ── */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <button
            onClick={() => setShowExplore(!showExplore)}
            className="flex items-center gap-2 w-full justify-center py-3 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg
              className={`w-4 h-4 transition-transform ${showExplore ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            <span className="text-sm font-semibold uppercase tracking-widest">Explore More</span>
            <svg
              className={`w-4 h-4 transition-transform ${showExplore ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showExplore && (
            <div className="pb-4 flex flex-wrap gap-2 justify-center">
              {exploreLinks.map((item) => (
                <button
                  key={item.label}
                  className="flex items-center gap-3 px-5 py-3 rounded-full border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all group whitespace-nowrap"
                >
                  <div className="text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-600">
                        {item.label}
                      </span>
                      {item.badge && (
                        <span className="text-[10px] font-bold bg-purple-600 text-white px-1.5 py-0.5 rounded-full uppercase">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">{item.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Offers Section ── */}
      <section className="py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-(--color-foreground) mb-5">Offers</h2>

          {/* Offer tabs */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 border-b border-gray-200 mb-6">
            {offerTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveOfferTab(tab)}
                className={`px-4 py-1.5 whitespace-nowrap text-sm font-semibold rounded-full transition-all ${
                  activeOfferTab === tab
                    ? 'bg-[#1F7AC4] text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Offer cards */}
          {filteredOffers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOffers.map((offer) => (
                <div
                  key={offer.id}
                  className={`bg-gradient-to-br ${COLOR_GRADIENTS[offer.colorTheme] ?? COLOR_GRADIENTS.blue} rounded-xl p-5 text-white cursor-pointer hover:shadow-lg transition-all hover:-translate-y-0.5`}
                >
                  <span className="text-[11px] font-bold uppercase tracking-wider bg-white/20 px-2 py-1 rounded-full">
                    {CATEGORY_LABELS[offer.category]}
                  </span>
                  <h3 className="text-lg font-bold mt-3 mb-1">{offer.title}</h3>
                  <p className="text-sm opacity-90">{offer.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No offers available right now.</p>
          )}
        </div>
      </section>
    </main>
  );
}
