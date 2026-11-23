/**
 * Stars for a guest rating out of 5 (client rule, 2026-11-23): every whole
 * point is a full star, any .1-.9 is a half star, the rest of the 5 are grey.
 * The rating is first rounded to one decimal, like the score badge, so the
 * stars and the badge always agree (4.3 -> 4 full + 1 half).
 */
export function roundRating(rating: number | null | undefined): number {
  return Math.round(Math.min(5, Math.max(0, Number(rating) || 0)) * 10) / 10;
}

export function starParts(rating: number | null | undefined): { full: number; half: boolean; empty: number } {
  const r = roundRating(rating);
  const full = Math.floor(r);
  const half = Math.round((r - full) * 10) >= 1;
  return { full, half, empty: 5 - full - (half ? 1 : 0) };
}
