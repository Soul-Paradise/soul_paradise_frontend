'use client';

import { useState } from 'react';

/**
 * Round reviewer avatar: the photo from the admin panel's media library, or
 * the reviewer's initials on the card's accent gradient when there is no
 * photo or it fails to load (never a broken image).
 */
export function ReviewerAvatar({
  name,
  photoUrl,
  accent,
  className = 'h-10 w-10 text-sm',
}: {
  name: string;
  photoUrl?: string | null;
  /** Tailwind gradient stops, e.g. "from-blue-500 to-indigo-600". */
  accent: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (photoUrl && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
        className={`shrink-0 rounded-full object-cover ring-2 ring-white ${className}`}
      />
    );
  }
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${accent} font-bold text-white ${className}`}>
      {initials}
    </span>
  );
}
