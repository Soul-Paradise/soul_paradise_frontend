'use client';

import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Expand, Loader2, MapPin, Quote, Star, X } from 'lucide-react';
import { api, type Testimonial } from '@/lib/api';
import { PageHero, SectionHeading, GRADIENTS } from '@/components/Page';
import { PlanHolidayCta } from '@/components/Home';
import { CmsIcon } from '@/components/SiteContent';
import { HeroSpacer } from '@/components/SiteContent/HeroSpacer';
import {
  orderedKeys,
  type Accent,
  type GalleryImage,
  type HallOfFameSections,
  type SiteContent,
} from '@/lib/site-content-shared';

/** Every few tiles is a big 2x2 feature tile, giving the grid a bento rhythm. */
const isFeature = (index: number) => index % 7 === 0;

const BODY_KEYS = ['stats', 'gallery', 'testimonials', 'plan_holiday_cta'] as const;
const DEFAULT_ACCENTS: Accent[] = ['blue', 'green', 'orange', 'purple'];

export function HallOfFameView({ content }: { content: SiteContent<'hall_of_fame'> }) {
  const { sections, global } = content;
  const keys = orderedKeys(content.order, BODY_KEYS);
  // Testimonial cards cycle the stats' accent colours, as before.
  const accents = sections.stats?.items.length ? sections.stats.items.map((s) => s.accent) : DEFAULT_ACCENTS;

  return (
    <main className="min-h-screen bg-(--color-background)">
      {sections.hero ? (
        <PageHero
          crumb={sections.hero.crumb}
          title={sections.hero.title}
          description={sections.hero.description}
          image={sections.hero.image}
          imagePosition={sections.hero.imagePosition}
        />
      ) : (
        <HeroSpacer />
      )}

      {keys.map((key, i) => {
        if (key === 'stats' && sections.stats) {
          return <Stats key={key} items={sections.stats.items} overlap={!!sections.hero && i === 0} />;
        }
        if (key === 'gallery' && sections.gallery) {
          return <Gallery key={key} heading={sections.gallery} images={content.gallery ?? []} />;
        }
        if (key === 'testimonials' && sections.testimonials) {
          return <Testimonials key={key} heading={sections.testimonials} accents={accents} />;
        }
        if (key === 'plan_holiday_cta') {
          return (
            <div key={key} className="pt-12">
              <PlanHolidayCta content={global.plan_holiday_cta} contact={global.contact} />
            </div>
          );
        }
        return null;
      })}
    </main>
  );
}

function Stats({ items, overlap }: { items: NonNullable<HallOfFameSections['stats']>['items']; overlap: boolean }) {
  if (items.length === 0) return null;
  return (
    <section className={`relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${overlap ? '-mt-16' : 'pt-16'}`}>
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-(--color-tertiary-button) shadow-xl ring-1 ring-(--color-tertiary-button) md:grid-cols-4">
        {items.map(({ icon, value, label, accent }) => (
          <div key={label} className="group flex items-center gap-4 bg-(--color-peace) p-5 sm:p-6">
            <span
              className={`hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${GRADIENTS[accent]} text-white shadow-md transition-transform group-hover:scale-110 sm:flex`}
            >
              <CmsIcon name={icon} className="h-6 w-6" />
            </span>
            <div>
              <p className={`bg-gradient-to-br ${GRADIENTS[accent]} bg-clip-text text-3xl font-extrabold text-transparent sm:text-4xl`}>
                {value}
              </p>
              <p className="text-xs font-semibold text-(--color-inactive) sm:text-sm">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Gallery({ heading, images }: { heading: NonNullable<HallOfFameSections['gallery']>; images: GalleryImage[] }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('__all');

  const categories = Array.from(new Set(images.map((img) => img.category).filter((c): c is string => !!c)));
  const filteredImages = selectedCategory === '__all' ? images : images.filter((img) => img.category === selectedCategory);

  const closeLightbox = () => setSelectedIndex(null);
  const step = useCallback(
    (delta: number) =>
      setSelectedIndex((i) => (i === null ? i : (i + delta + filteredImages.length) % filteredImages.length)),
    [filteredImages.length],
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
    <>
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20 lg:px-8">
        <SectionHeading eyebrow={heading.eyebrow} title={heading.title} subtitle={heading.subtitle} />

        {images.length === 0 ? (
          <p className="py-12 text-center text-lg text-(--color-inactive)">{heading.emptyText}</p>
        ) : (
          <>
            {categories.length > 0 && (
              <div className="mb-8 flex flex-wrap justify-center gap-2" role="tablist" aria-label="Filter by destination">
                {[{ key: '__all', label: heading.allLabel }, ...categories.map((c) => ({ key: c, label: c }))].map(({ key, label }) => {
                  const active = selectedCategory === key;
                  return (
                    <button
                      key={key}
                      role="tab"
                      aria-selected={active}
                      onClick={() => {
                        setSelectedCategory(key);
                        setSelectedIndex(null);
                      }}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                        active
                          ? 'bg-(--color-primary-button) text-white shadow-lg'
                          : 'bg-(--color-peace) text-(--color-inactive) ring-1 ring-(--color-tertiary-button) hover:text-(--color-foreground) hover:ring-(--color-secondary-button)'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="grid grid-flow-dense auto-rows-[160px] grid-cols-2 gap-3 sm:auto-rows-[190px] md:grid-cols-3 lg:grid-cols-4 lg:gap-4">
              {filteredImages.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setSelectedIndex(index)}
                  aria-label={`Open photo: ${image.title}`}
                  className={`group relative overflow-hidden rounded-2xl shadow-sm ring-1 ring-black/5 transition-shadow hover:shadow-xl ${
                    isFeature(index) ? 'col-span-2 row-span-2' : ''
                  }`}
                >
                  <Image
                    src={image.url}
                    alt={image.title}
                    fill
                    sizes={isFeature(index) ? '(max-width: 768px) 100vw, 50vw' : '(max-width: 768px) 50vw, 25vw'}
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    priority={index < 4}
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-60 transition-opacity group-hover:opacity-100" />
                  <span className="absolute inset-x-0 bottom-0 flex items-end justify-between p-3 text-left text-white">
                    <span>
                      {image.category && (
                        <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider">
                          <MapPin className="h-3 w-3" />
                          {image.category}
                        </span>
                      )}
                      <span className="mt-0.5 block translate-y-1 text-sm font-semibold opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
                        {image.caption || image.title}
                      </span>
                    </span>
                    <span className="rounded-full bg-white/20 p-1.5 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                      <Expand className="h-4 w-4" />
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Lightbox */}
      {current && selectedIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label={current.title}
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
              src={current.url}
              alt={current.title}
              width={current.width ?? 1200}
              height={current.height ?? 800}
              className="max-h-[80vh] w-auto rounded-xl object-contain shadow-2xl"
            />
            <figcaption className="mt-3 flex items-center gap-3 text-sm text-white/85">
              {current.category && (
                <span className="inline-flex items-center gap-1 font-semibold text-white">
                  <MapPin className="h-4 w-4" />
                  {current.category}
                </span>
              )}
              <span>{current.caption || current.title}</span>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">
                {selectedIndex + 1} / {filteredImages.length}
              </span>
            </figcaption>
          </figure>
        </div>
      )}
    </>
  );
}

function Testimonials({ heading, accents }: { heading: NonNullable<HallOfFameSections['testimonials']>; accents: Accent[] }) {
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

  return (
    <section className="bg-(--color-peace) py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow={heading.eyebrow} title={heading.title} subtitle={heading.subtitle} />

        {isLoadingTestimonials ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-10 w-10 animate-spin text-(--color-links)" />
          </div>
        ) : testimonials.length === 0 ? (
          <p className="py-12 text-center text-lg text-(--color-inactive)">{heading.emptyText}</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial, i) => {
              const accent = GRADIENTS[accents[i % accents.length]];
              return (
                <figure
                  key={testimonial.id}
                  className="relative flex flex-col overflow-hidden rounded-2xl bg-(--color-background) p-6 ring-1 ring-(--color-tertiary-button) transition-all duration-300 hover:-translate-y-1 hover:bg-(--color-peace) hover:shadow-xl"
                >
                  <span className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent}`} aria-hidden="true" />
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
                  <blockquote className="flex-1 leading-relaxed text-(--color-inactive)">“{testimonial.review}”</blockquote>
                  <figcaption className="mt-6 flex items-center gap-3 border-t border-(--color-tertiary-button) pt-4">
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${accent} font-bold text-white`}
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
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
