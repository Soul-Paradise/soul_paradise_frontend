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

export type Accent = keyof typeof GRADIENTS;

/** Cycle through accents for lists, so neighbours never share a colour. */
export const ACCENT_CYCLE: Accent[] = ['blue', 'green', 'orange', 'purple', 'teal', 'pink'];
