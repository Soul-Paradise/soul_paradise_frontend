import Image from 'next/image';
import { ArrowUpRight, MapPin } from 'lucide-react';
import { SectionHeader } from './SectionHeader';
import { GRADIENTS, ACCENT_CYCLE } from '@/components/Page/palette';
import { fillTemplate, waLink, type HomeSections } from '@/lib/site-content-shared';

/** Stand-in backgrounds for trips without a photo, cycling the site's accents. */
const TILE_GRADIENTS = ACCENT_CYCLE.map((a) => GRADIENTS[a]);

/** Real trips organised for our travellers (admin panel → Site Content → Home). */
export function PopularTrips({
  content,
  whatsappNumber,
}: {
  content: NonNullable<HomeSections['popular_trips']>;
  whatsappNumber: string;
}) {
  return (
    <section className="bg-(--color-peace) py-14 md:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <SectionHeader eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} link={content.link} />

        {/* Swipeable row on phones, five-up grid on large screens */}
        <div className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 scrollbar-hide sm:mx-0 sm:px-0 lg:grid lg:grid-cols-5 lg:overflow-visible">
          {content.trips.map((trip, i) => (
            <a
              key={trip.name}
              href={waLink(whatsappNumber, fillTemplate(content.enquiryTemplate, { name: trip.name }))}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Enquire about a ${trip.name} holiday on WhatsApp`}
              className="group relative aspect-[3/4] w-56 shrink-0 snap-start overflow-hidden rounded-2xl shadow-sm ring-1 ring-black/5 transition-all hover:-translate-y-1 hover:shadow-xl sm:w-60 lg:w-auto"
            >
              {trip.image ? (
                <Image
                  src={trip.image}
                  alt={`Soul Paradise travellers in ${trip.name}`}
                  fill
                  sizes="(min-width: 1024px) 20vw, 240px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                // No photo set in the media library: a soft brand-gradient tile.
                <span
                  className={`absolute inset-0 bg-gradient-to-br ${TILE_GRADIENTS[i % TILE_GRADIENTS.length]} transition-transform duration-500 group-hover:scale-105`}
                  aria-hidden="true"
                >
                  <MapPin className="absolute right-4 top-4 h-8 w-8 text-white/40" />
                </span>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                <h3 className="text-lg font-bold">{trip.name}</h3>
                <p className="text-xs opacity-90">{trip.tagline}</p>
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold opacity-90 transition-opacity group-hover:opacity-100">
                  {content.ctaLabel} <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
