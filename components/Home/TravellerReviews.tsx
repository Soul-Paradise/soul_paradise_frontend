'use client';

import { useEffect, useState } from 'react';
import { Quote, Star } from 'lucide-react';
import { api, type Testimonial } from '@/lib/api';
import { SectionHeader } from './SectionHeader';

/** Latest approved reviews; renders nothing until there is at least one. */
export function TravellerReviews() {
  const [reviews, setReviews] = useState<Testimonial[]>([]);

  useEffect(() => {
    api
      .getLatestTestimonials(3)
      .then((res) => setReviews(res.data ?? []))
      .catch(() => {});
  }, []);

  if (reviews.length === 0) return null;

  return (
    <section className="py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <SectionHeader
          title="What our travellers say"
          link={{ href: '/hall-of-fame', label: 'Read more stories' }}
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {reviews.map((review) => (
            <figure
              key={review.id}
              className="relative flex flex-col rounded-xl bg-(--color-peace) p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
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
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--color-links) text-sm font-bold text-white">
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
          ))}
        </div>
      </div>
    </section>
  );
}
