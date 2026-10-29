'use client';

import { useState, useEffect } from 'react';
import { BookingTabs, MobileBookingTabs } from '@/components/BookingTabs';
import {
  LongWeekends,
  PopularTrips,
  TravellerReviews,
  PlanHolidayCta,
} from '@/components/Home';
import { SectionHeader } from '@/components/Home/SectionHeader';

/** Hero photo with the same overlay and slow zoom as the other pages' heroes. */
function HeroBackdrop() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        className="animate-hero-zoom absolute inset-0"
        style={{ backgroundImage: 'url(/hero_bg.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/20" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/30 to-transparent" />
    </div>
  );
}

/** Headline above the booking card. */
function HeroIntro({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? '' : 'mb-2'}>
      <h1
        className={`animate-fade-up font-extrabold leading-tight tracking-tight text-white ${
          compact ? 'text-3xl' : 'text-4xl lg:text-5xl'
        }`}
      >
        Where to next?
      </h1>
      <p
        className={`animate-fade-up mt-2 max-w-2xl leading-relaxed text-white/85 ${compact ? 'text-sm' : 'text-base lg:text-lg'}`}
        style={{ animationDelay: '80ms' }}
      >
        Flights, hotels, travel insurance and holiday packages, all in one place.
      </p>
    </div>
  );
}

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

export default function Home() {
  const [activeOfferTab, setActiveOfferTab] = useState('All Offers');
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
      <div id="booking" className="scroll-mt-20">
        {/* ── Mobile: photo hero, booking icons on a card overlapping it ── */}
        <section className="sm:hidden">
          <div className="relative overflow-hidden px-4 pb-16 pt-8">
            <HeroBackdrop />
            <div className="relative">
              <HeroIntro compact />
            </div>
          </div>
          <div className="relative z-10 mx-4 -mt-10 overflow-hidden rounded-2xl shadow-xl ring-1 ring-(--color-tertiary-button)">
            <MobileBookingTabs />
          </div>
        </section>

        {/* ── Hero Section (sm+ only) ── */}
        {/* min-h (not fixed h) so a taller card - e.g. multi-city with several
            legs - grows the hero and pushes the next section down instead of
            overflowing it. */}
        <section className="relative z-10 hidden min-h-[400px] flex-col justify-center pb-10 pt-12 sm:flex">
          <HeroBackdrop />

          {/* Same container as the booking card, so the text lines up with it */}
          <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6">
            <HeroIntro />
          </div>

          {/* Booking card */}
          <div className="relative z-20 w-full">
            <BookingTabs />
          </div>
        </section>
      </div>

      {/* ── Offers Section ── (only when there are offers; an empty state
          shouldn't be the first thing below the search) */}
      {offers.length > 0 && (
      <section className="py-14 md:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <SectionHeader eyebrow="Deals" title="Offers" />

          {/* Offer tabs */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 border-b border-gray-200 mb-6">
            {offerTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveOfferTab(tab)}
                className={`px-4 py-1.5 whitespace-nowrap text-sm font-semibold rounded-full transition-all ${
                  activeOfferTab === tab
                    ? 'bg-(--color-links) text-white'
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
                  className={`bg-gradient-to-br ${COLOR_GRADIENTS[offer.colorTheme] ?? COLOR_GRADIENTS.blue} rounded-2xl p-5 text-white cursor-pointer hover:shadow-xl transition-all hover:-translate-y-1`}
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
            <div className="flex flex-col items-center justify-center py-6">
              <video
                src="/empty_box.webm"
                autoPlay
                muted
                playsInline
                className="w-48 h-48"
              />
              <p className="text-gray-400 text-sm mt-2">No offers in this category right now.</p>
            </div>
          )}
        </div>
      </section>
      )}

      <LongWeekends />
      <PopularTrips />
      <TravellerReviews />
      <PlanHolidayCta />
    </main>
  );
}
