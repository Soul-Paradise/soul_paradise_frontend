/**
 * Stars that match the guest rating shown next to them (client decision,
 * 2026-11-23): every whole point is a full star, any .1-.9 is a half star,
 * and the rest of the 5 are grey. 4.3 -> 4 full + 1 half; 3.0 -> 3 full + 2 grey.
 *
 * No rating (0/missing) draws nothing unless a `fallback` is given, so a
 * property without reviews never looks like it scored zero.
 */
import { useId } from 'react';
import { roundRating, starParts } from '@/lib/star-parts';

const STAR_PATH =
  'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z';

export default function HotelStars({
  rating,
  size = 'sm',
  fallback = null,
}: {
  /** Guest rating out of 5 (the same number as the score badge). */
  rating: number | null | undefined;
  size?: 'xs' | 'sm' | 'md';
  fallback?: React.ReactNode;
}) {
  const gradientId = `star-half-${useId().replace(/:/g, '')}`;
  const value = roundRating(rating);
  if (value <= 0) return <>{fallback}</>;

  const { full, half, empty } = starParts(value);
  const px = size === 'xs' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5';
  const label = `Rated ${value} out of 5`;

  return (
    <span className="inline-flex gap-0.5 items-center align-middle" role="img" aria-label={label} title={label}>
      {Array.from({ length: full }).map((_, i) => (
        <svg key={`f${i}`} className={`${px} text-yellow-400`} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path d={STAR_PATH} />
        </svg>
      ))}
      {half && (
        <svg className={px} viewBox="0 0 20 20" aria-hidden="true">
          <defs>
            <linearGradient id={gradientId}>
              <stop offset="50%" stopColor="#facc15" />
              <stop offset="50%" stopColor="#d1d5db" />
            </linearGradient>
          </defs>
          <path d={STAR_PATH} fill={`url(#${gradientId})`} />
        </svg>
      )}
      {Array.from({ length: empty }).map((_, i) => (
        <svg key={`e${i}`} className={`${px} text-gray-300`} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path d={STAR_PATH} />
        </svg>
      ))}
    </span>
  );
}
