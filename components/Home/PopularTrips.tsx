import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import { SectionHeader } from './SectionHeader';
import { whatsappLink } from './constants';

/** Real trips organised for our travellers (same photos as the Hall of Fame). */
const TRIPS = [
  { name: 'Dubai', tagline: 'City lights & desert safaris', src: '/dubai_1.jpg' },
  { name: 'Kerala', tagline: 'Backwaters & houseboats', src: '/kerala_2.jpg' },
  { name: 'Rajasthan', tagline: 'Forts, palaces & dunes', src: '/rajasthan_3.jpg' },
  { name: 'North East', tagline: 'Hills, monasteries & sunrises', src: '/ne_2.jpg' },
  { name: 'Puri & Digha', tagline: 'Temples & sea beaches', src: '/digha_2.jpg' },
];

export function PopularTrips() {
  return (
    <section className="py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <SectionHeader
          title="Trips our travellers loved"
          subtitle="Holiday packages we plan end to end: flights, stays and sightseeing."
          link={{ href: '/hall-of-fame', label: 'See the gallery' }}
        />

        {/* Swipeable row on phones, five-up grid on large screens */}
        <div className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 scrollbar-hide sm:mx-0 sm:px-0 lg:grid lg:grid-cols-5 lg:overflow-visible">
          {TRIPS.map((trip) => (
            <a
              key={trip.name}
              href={whatsappLink(
                `Hi Soul Paradise, I'd like a quote for a ${trip.name} holiday package.`
              )}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Enquire about a ${trip.name} holiday on WhatsApp`}
              className="group relative aspect-[3/4] w-56 shrink-0 snap-start overflow-hidden rounded-xl shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg sm:w-60 lg:w-auto"
            >
              <Image
                src={trip.src}
                alt={`Soul Paradise travellers in ${trip.name}`}
                fill
                sizes="(min-width: 1024px) 20vw, 240px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                <h3 className="text-lg font-bold">{trip.name}</h3>
                <p className="text-xs opacity-90">{trip.tagline}</p>
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold opacity-90 transition-opacity group-hover:opacity-100">
                  Get a quote <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
