'use client';

import { useState, useEffect } from 'react';
import { BookingTabs } from '@/components/BookingTabs';

const heroImages = [
  '/dubai_1.jpg',
  '/kerala_1.jpg',
  '/rajasthan_1.jpg',
  '/ne_1.jpg',
];

const offerTabs = ['All Offers', 'Bank Offers', 'Flights', 'Hotels', 'Holidays', 'Visa'];

const offers = [
  {
    title: 'Flat ₹1500 off on Flights',
    desc: 'Use code SOUL1500 on your next international booking',
    tag: 'Flights',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    title: 'Up to 40% off on Hotels',
    desc: 'Exclusive deals on select properties across India',
    tag: 'Hotels',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    title: 'Holiday Packages from ₹9,999',
    desc: 'Best curated holiday packages — just for you',
    tag: 'Holidays',
    color: 'from-orange-500 to-red-500',
  },
];

const exploreLinks = [
  { label: 'Where2Go', desc: 'Discover destinations', badge: null },
  { label: 'How2Go', desc: 'Find routes to anywhere', badge: 'new' },
  { label: 'Credit Card Offers', desc: 'Never-expiring rewards', badge: null },
  { label: 'MICE', desc: 'Offsites, Events & Meetings', badge: null },
  { label: 'Gift Cards', desc: 'Share the joy of travel', badge: null },
];

export default function Home() {
  const [currentImage, setCurrentImage] = useState(0);
  const [activeOfferTab, setActiveOfferTab] = useState('All Offers');
  const [showExplore, setShowExplore] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <main className="min-h-screen bg-(--color-background)">
      {/* ── Hero Section ── */}
      <section className="relative min-h-[580px] flex items-center pt-16 overflow-hidden">
        {/* Rotating background images */}
        {heroImages.map((img, i) => (
          <div
            key={img}
            className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
            style={{
              backgroundImage: `url(${img})`,
              opacity: i === currentImage ? 1 : 0,
            }}
          />
        ))}
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Image indicator dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {heroImages.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentImage(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentImage ? 'bg-white w-5' : 'bg-white/50'
              }`}
            />
          ))}
        </div>

        {/* Booking card */}
        <div className="relative z-10 w-full">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {offers.map((offer) => (
              <div
                key={offer.title}
                className={`bg-gradient-to-br ${offer.color} rounded-xl p-5 text-white cursor-pointer hover:shadow-lg transition-all hover:-translate-y-0.5`}
              >
                <span className="text-[11px] font-bold uppercase tracking-wider bg-white/20 px-2 py-1 rounded-full">
                  {offer.tag}
                </span>
                <h3 className="text-lg font-bold mt-3 mb-1">{offer.title}</h3>
                <p className="text-sm opacity-90">{offer.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
