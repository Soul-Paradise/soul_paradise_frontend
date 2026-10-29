'use client';

import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Expand,
  Globe2,
  Headphones,
  Loader2,
  MapPin,
  Quote,
  Smile,
  Star,
  Trophy,
  X,
} from 'lucide-react';
import { api, type Testimonial } from '@/lib/api';
import { PageHero, SectionHeading } from '@/components/Page';
import { PlanHolidayCta } from '@/components/Home';

const galleryImages = [
  { id: 1, src: '/dubai_1.jpg', alt: 'Dubai Travel Experience', category: 'Dubai' },
  { id: 2, src: '/dubai_2.jpg', alt: 'Dubai Adventure', category: 'Dubai' },
  { id: 3, src: '/dubai_3.jpg', alt: 'Dubai Memories', category: 'Dubai' },
  { id: 4, src: '/dubai_4.jpg', alt: 'Dubai Journey', category: 'Dubai' },
  { id: 5, src: '/kerala_1.jpg', alt: 'Kerala Backwaters', category: 'Kerala' },
  { id: 6, src: '/kerala_2.jpg', alt: 'Kerala Beauty', category: 'Kerala' },
  { id: 7, src: '/kerala_3.jpg', alt: 'Kerala Adventure', category: 'Kerala' },
  { id: 8, src: '/kerala_4.jpg', alt: 'Kerala Experience', category: 'Kerala' },
  { id: 9, src: '/kerala_5.jpg', alt: 'Kerala Memories', category: 'Kerala' },
  { id: 10, src: '/kerala_6.jpg', alt: 'Kerala Journey', category: 'Kerala' },
  { id: 11, src: '/rajasthan_1.jpg', alt: 'Rajasthan Heritage', category: 'Rajasthan' },
  { id: 12, src: '/rajasthan_2.jpg', alt: 'Rajasthan Culture', category: 'Rajasthan' },
  { id: 13, src: '/rajasthan_3.jpg', alt: 'Rajasthan Adventure', category: 'Rajasthan' },
  { id: 14, src: '/rajasthan_4.jpg', alt: 'Rajasthan Memories', category: 'Rajasthan' },
  { id: 15, src: '/rajasthan_5.jpg', alt: 'Rajasthan Journey', category: 'Rajasthan' },
  { id: 16, src: '/ne_1.jpg', alt: 'Northeast Beauty', category: 'Northeast' },
  { id: 17, src: '/ne_2.jpg', alt: 'Northeast Adventure', category: 'Northeast' },
  { id: 18, src: '/ne_3.jpg', alt: 'Northeast Experience', category: 'Northeast' },
  { id: 19, src: '/ne_4.jpg', alt: 'Northeast Memories', category: 'Northeast' },
  { id: 20, src: '/ne_5.jpg', alt: 'Northeast Journey', category: 'Northeast' },
  { id: 21, src: '/digha_1.jpg', alt: 'Digha Beach', category: 'Digha' },
  { id: 22, src: '/digha_2.jpg', alt: 'Digha Memories', category: 'Digha' },
];

const STATS = [
  { icon: Smile, value: '1000+', label: 'Happy Customers', accent: 'from-blue-500 to-indigo-600' },
  { icon: Globe2, value: '50+', label: 'Destinations Covered', accent: 'from-emerald-500 to-teal-600' },
  { icon: Trophy, value: '95%', label: 'Success Rate', accent: 'from-orange-500 to-red-500' },
  { icon: Headphones, value: '24/7', label: 'Customer Support', accent: 'from-purple-500 to-violet-600' },
];

/** Every few tiles is a big 2x2 feature tile, giving the grid a bento rhythm. */
const isFeature = (index: number) => index % 7 === 0;

export default function HallOfFamePage() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoadingTestimonials, setIsLoadingTestimonials] = useState(true);

  useEffect(() => {
    api
      .getLatestTestimonials(6)
      .then((response) => setTestimonials(response.data))
      .catch((error) => {
        console.error('Failed to fetch testimonials:', error);
        setTestimonials([]);
      })
      .finally(() => setIsLoadingTestimonials(false));
  }, []);

  const categories = ['All', ...Array.from(new Set(galleryImages.map((img) => img.category)))];
  const countFor = (category: string) =>
    category === 'All' ? galleryImages.length : galleryImages.filter((img) => img.category === category).length;
  const filteredImages =
    selectedCategory === 'All' ? galleryImages : galleryImages.filter((img) => img.category === selectedCategory);

  const closeLightbox = () => setSelectedIndex(null);
  const step = useCallback(
    (delta: number) =>
      setSelectedIndex((i) => (i === null ? i : (i + delta + filteredImages.length) % filteredImages.length)),
    [filteredImages.length]
  );

  // Keyboard control while the lightbox is open
  useEffect(() => {
    if (selectedIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedIndex(null);
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedIndex, step]);

  const current = selectedIndex !== null ? filteredImages[selectedIndex] : null;

  return (
    <main className="min-h-screen bg-(--color-background)">
      <PageHero
        eyebrow="Hall of Fame"
        title="Real trips. Real travellers. Real smiles."
        description="Celebrating our valued customers and their unforgettable travel experiences. Browse through memories captured during amazing journeys with Soul Paradise."
        image="/dubai_1.jpg"
        imagePosition="center 35%"
        chips={[
          { icon: Camera, label: `${galleryImages.length} trip photos` },
          { icon: MapPin, label: `${categories.length - 1} destinations` },
        ]}
      />

      {/* Stats band, overlapping the hero */}
      <section className="relative z-10 mx-auto -mt-16 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-(--color-tertiary-button) shadow-xl ring-1 ring-(--color-tertiary-button) md:grid-cols-4">
          {STATS.map(({ icon: Icon, value, label, accent }) => (
            <div key={label} className="group flex items-center gap-4 bg-(--color-peace) p-5 sm:p-6">
              <span
                className={`hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white shadow-md transition-transform group-hover:scale-110 sm:flex`}
              >
                <Icon className="h-6 w-6" />
              </span>
              <div>
                <p className={`bg-gradient-to-br ${accent} bg-clip-text text-3xl font-extrabold text-transparent sm:text-4xl`}>
                  {value}
                </p>
                <p className="text-xs font-semibold text-(--color-inactive) sm:text-sm">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Gallery */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20 lg:px-8">
        <SectionHeading
          eyebrow="Travel Gallery"
          title="Moments from the road"
          subtitle="Moments captured from our customers' amazing journeys across beautiful destinations"
        />

        <div className="mb-8 flex flex-wrap justify-center gap-2" role="tablist" aria-label="Filter by destination">
          {categories.map((category) => {
            const active = selectedCategory === category;
            return (
              <button
                key={category}
                role="tab"
                aria-selected={active}
                onClick={() => setSelectedCategory(category)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                  active
                    ? 'bg-(--color-primary-button) text-white shadow-lg'
                    : 'bg-(--color-peace) text-(--color-inactive) ring-1 ring-(--color-tertiary-button) hover:text-(--color-foreground) hover:ring-(--color-secondary-button)'
                }`}
              >
                {category}
                <span
                  className={`rounded-full px-1.5 text-[11px] ${active ? 'bg-white/20' : 'bg-(--color-background)'}`}
                >
                  {countFor(category)}
                </span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-flow-dense auto-rows-[160px] grid-cols-2 gap-3 sm:auto-rows-[190px] md:grid-cols-3 lg:grid-cols-4 lg:gap-4">
          {filteredImages.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setSelectedIndex(index)}
              aria-label={`Open photo: ${image.alt}`}
              className={`group relative overflow-hidden rounded-2xl shadow-sm ring-1 ring-black/5 transition-shadow hover:shadow-xl ${
                isFeature(index) ? 'col-span-2 row-span-2' : ''
              }`}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes={isFeature(index) ? '(max-width: 768px) 100vw, 50vw' : '(max-width: 768px) 50vw, 25vw'}
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                priority={index < 4}
              />
              <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-60 transition-opacity group-hover:opacity-100" />
              <span className="absolute inset-x-0 bottom-0 flex items-end justify-between p-3 text-left text-white">
                <span>
                  <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider">
                    <MapPin className="h-3 w-3" />
                    {image.category}
                  </span>
                  <span className="mt-0.5 block translate-y-1 text-sm font-semibold opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
                    {image.alt}
                  </span>
                </span>
                <span className="rounded-full bg-white/20 p-1.5 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                  <Expand className="h-4 w-4" />
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Lightbox */}
      {current && selectedIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label={current.alt}
        >
          <button
            onClick={closeLightbox}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              step(-1);
            }}
            className="absolute left-3 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20 sm:left-6"
            aria-label="Previous"
          >
            <ChevronLeft className="h-7 w-7" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              step(1);
            }}
            className="absolute right-3 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20 sm:right-6"
            aria-label="Next"
          >
            <ChevronRight className="h-7 w-7" />
          </button>

          <figure className="relative flex max-h-[90vh] max-w-6xl flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <Image
              src={current.src}
              alt={current.alt}
              width={1200}
              height={800}
              className="max-h-[80vh] w-auto rounded-xl object-contain shadow-2xl"
            />
            <figcaption className="mt-3 flex items-center gap-3 text-sm text-white/85">
              <span className="inline-flex items-center gap-1 font-semibold text-white">
                <MapPin className="h-4 w-4" />
                {current.category}
              </span>
              <span>{current.alt}</span>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">
                {selectedIndex + 1} / {filteredImages.length}
              </span>
            </figcaption>
          </figure>
        </div>
      )}

      {/* Customer Reviews */}
      <section className="bg-(--color-peace) py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Testimonials"
            title="What Our Customers Say"
            subtitle="Don't just take our word for it. Here's what our satisfied customers have to say about their travel experiences with Soul Paradise."
          />

          {isLoadingTestimonials ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-(--color-links)" />
            </div>
          ) : testimonials.length === 0 ? (
            <p className="py-12 text-center text-lg text-(--color-inactive)">No testimonials available at the moment.</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((testimonial, i) => (
                <figure
                  key={testimonial.id}
                  className="relative flex flex-col overflow-hidden rounded-2xl bg-(--color-background) p-6 ring-1 ring-(--color-tertiary-button) transition-all duration-300 hover:-translate-y-1 hover:bg-(--color-peace) hover:shadow-xl"
                >
                  <span
                    className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${STATS[i % STATS.length].accent}`}
                    aria-hidden="true"
                  />
                  <Quote className="absolute right-5 top-5 h-10 w-10 text-(--color-tertiary-button)" />
                  <div className="mb-4 flex gap-0.5" aria-label={`${testimonial.rating} out of 5 stars`}>
                    {Array.from({ length: 5 }, (_, s) => (
                      <Star
                        key={s}
                        className={`h-4 w-4 ${
                          s < testimonial.rating ? 'fill-(--color-warn) text-(--color-warn)' : 'text-(--color-tertiary-button)'
                        }`}
                      />
                    ))}
                  </div>
                  <blockquote className="flex-1 leading-relaxed text-(--color-inactive)">
                    “{testimonial.review}”
                  </blockquote>
                  <figcaption className="mt-6 flex items-center gap-3 border-t border-(--color-tertiary-button) pt-4">
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${STATS[i % STATS.length].accent} font-bold text-white`}
                    >
                      {testimonial.name
                        .split(/\s+/)
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>
                    <span>
                      <span className="block text-base font-bold text-(--color-foreground)">{testimonial.name}</span>
                      <span className="block text-sm text-(--color-inactive)">{testimonial.service}</span>
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="pt-12">
        <PlanHolidayCta />
      </div>
    </main>
  );
}
