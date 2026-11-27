/**
 * Accent gradients for icon tiles and highlight cards. Same family as the
 * homepage Offers / long-weekend cards so every page reads as one site.
 */
export const GRADIENTS = {
  blue: 'from-blue-500 to-indigo-600',
  green: 'from-emerald-500 to-teal-600',
  orange: 'from-orange-500 to-red-500',
  purple: 'from-purple-500 to-violet-600',
  teal: 'from-teal-500 to-cyan-600',
  pink: 'from-pink-500 to-rose-600',
  slate: 'from-slate-600 to-slate-800',
} as const;

/**
 * Flat (no-gradient) versions of the same accents - the client asked for solid
 * colours on buttons and testimonials. Literal class names so Tailwind keeps them.
 */
export const SOLIDS = {
  blue: 'bg-blue-600',
  green: 'bg-emerald-600',
  orange: 'bg-orange-500',
  purple: 'bg-purple-600',
  teal: 'bg-teal-600',
  pink: 'bg-pink-600',
  slate: 'bg-slate-700',
} as const;

/** Text colour of each accent (replaces gradient-clipped text). */
export const TEXT_SOLIDS = {
  blue: 'text-blue-600',
  green: 'text-emerald-600',
  orange: 'text-orange-500',
  purple: 'text-purple-600',
  teal: 'text-teal-600',
  pink: 'text-pink-600',
  slate: 'text-slate-700',
} as const;

export type Accent = keyof typeof GRADIENTS;

/** Cycle through accents for lists, so neighbours never share a colour. */
export const ACCENT_CYCLE: Accent[] = ['blue', 'green', 'orange', 'purple', 'teal', 'pink'];
