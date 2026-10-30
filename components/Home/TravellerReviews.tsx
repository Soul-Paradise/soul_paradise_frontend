'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Quote, Star } from 'lucide-react';
import { api, type Testimonial } from '@/lib/api';
import { SectionHeader } from './SectionHeader';
import type { HeadingWithLink } from '@/lib/site-content-shared';

/** Auto-scroll speed in px per second. */
const AUTO_SPEED = 40;
/** How quickly an arrow-click nudge settles (higher = snappier). */
const NUDGE_EASE = 8;

/**
 * Latest approved reviews in an endless, auto-scrolling strip. Arrows nudge
 * the strip one card either way; auto-scroll pauses while hovered/focused and
 * is disabled for users who prefer reduced motion. Renders nothing until
 * there is at least one review.
 */
export function TravellerReviews({ heading }: { heading: HeadingWithLink }) {
  const [reviews, setReviews] = useState<Testimonial[]>([]);
  // Number of times the review set is repeated so the strip always overflows
  // the viewport by at least one full set (needed for a seamless wrap).
  const [copies, setCopies] = useState(2);

  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const setRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const nudgeRef = useRef(0);
  const pausedRef = useRef(false);

  useEffect(() => {
    api
      .getLatestTestimonials(12)
      .then((res) => setReviews(res.data ?? []))
      .catch(() => {});
  }, []);

  // Keep enough copies to cover the viewport plus one set.
  useEffect(() => {
    const viewport = viewportRef.current;
    const set = setRef.current;
    if (!viewport || !set) return;
    const measure = () => {
      const setWidth = set.offsetWidth;
      if (setWidth > 0) setCopies(Math.ceil(viewport.offsetWidth / setWidth) + 1);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(set);
    return () => observer.disconnect();
  }, [reviews]);

  // Animation loop: constant drift plus any pending arrow nudge, wrapped
  // modulo one set's width so the loop never visibly resets.
  useEffect(() => {
    if (reviews.length === 0) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      const setWidth = setRef.current?.offsetWidth ?? 0;
      if (setWidth > 0) {
        let delta = pausedRef.current || reduceMotion ? 0 : AUTO_SPEED * dt;
        if (nudgeRef.current !== 0) {
          const remaining = nudgeRef.current;
          const step =
            Math.abs(remaining) < 0.5 ? remaining : remaining * (1 - Math.exp(-NUDGE_EASE * dt));
          nudgeRef.current -= step;
          delta += step;
        }
        offsetRef.current = (((offsetRef.current + delta) % setWidth) + setWidth) % setWidth;
        if (trackRef.current) {
          trackRef.current.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;
        }
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reviews]);

  const nudge = (direction: 1 | -1) => {
    const card = setRef.current?.firstElementChild as HTMLElement | null;
    const cardStep = card ? card.offsetWidth + 16 : 320;
    nudgeRef.current += direction * cardStep;
  };

  if (reviews.length === 0) return null;

  const arrowClass =
    'absolute top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-(--color-foreground) shadow-md transition hover:scale-105 hover:text-(--color-links) focus-visible:outline-2 focus-visible:outline-(--color-links)';

  return (
    <section className="py-14 md:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <SectionHeader eyebrow={heading.eyebrow} title={heading.title} subtitle={heading.subtitle} link={heading.link} />
        <div
          className="relative"
          onPointerEnter={(e) => (pausedRef.current = e.pointerType === 'mouse')}
          onPointerLeave={() => (pausedRef.current = false)}
          onFocus={(e) => {
            if (e.target.matches(':focus-visible')) pausedRef.current = true;
          }}
          onBlur={() => (pausedRef.current = false)}
        >
          <button
            type="button"
            aria-label="Previous reviews"
            onClick={() => nudge(-1)}
            className={`${arrowClass} -left-2 sm:-left-5`}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Next reviews"
            onClick={() => nudge(1)}
            className={`${arrowClass} -right-2 sm:-right-5`}
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div
            ref={viewportRef}
            className="overflow-hidden py-2"
            style={{
              maskImage:
                'linear-gradient(to right, transparent, black 4%, black 96%, transparent)',
            }}
          >
            <div ref={trackRef} className="flex w-max will-change-transform">
              {Array.from({ length: copies }, (_, copy) => (
                <div
                  key={copy}
                  ref={copy === 0 ? setRef : undefined}
                  aria-hidden={copy > 0 || undefined}
                  className="flex gap-4 pr-4"
                >
                  {reviews.map((review, i) => (
                    <ReviewCard key={review.id} review={review} accent={ACCENTS[i % ACCENTS.length]} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Same accent family as the Hall of Fame review cards. */
const ACCENTS = [
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-red-500',
  'from-purple-500 to-violet-600',
];

function ReviewCard({ review, accent }: { review: Testimonial; accent: string }) {
  return (
    <figure className="relative flex w-[280px] shrink-0 flex-col overflow-hidden rounded-2xl bg-(--color-peace) p-6 shadow-sm ring-1 ring-(--color-tertiary-button) transition-all hover:-translate-y-1 hover:shadow-xl sm:w-[340px]">
      <span className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent}`} aria-hidden="true" />
      <Quote className="absolute right-5 top-5 h-8 w-8 text-(--color-tertiary-button)" />
      <div className="mb-3 flex gap-0.5" aria-label={`${review.rating} out of 5 stars`}>
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < review.rating
                ? 'fill-(--color-warn) text-(--color-warn)'
                : 'text-(--color-tertiary-button)'
            }`}
          />
        ))}
      </div>
      <blockquote className="line-clamp-4 flex-1 text-sm leading-relaxed text-(--color-inactive)">
        “{review.review}”
      </blockquote>
      <figcaption className="mt-5 flex items-center gap-3 border-t border-(--color-tertiary-button) pt-4">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${accent} text-sm font-bold text-white`}>
          {review.name
            .split(/\s+/)
            .map((part) => part[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold text-(--color-foreground)">
            {review.name}
          </span>
          <span className="block truncate text-xs text-(--color-inactive)">
            {review.service}
          </span>
        </span>
      </figcaption>
    </figure>
  );
}
