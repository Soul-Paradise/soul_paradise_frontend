import Link from 'next/link';
import { ChevronRight, type LucideIcon } from 'lucide-react';

export interface HeroChip {
  icon: LucideIcon;
  label: string;
}

/**
 * Photo-backed page header shared by the content pages (same treatment as the
 * homepage hero: real photo, dark overlay, white type). Leaves room at the
 * bottom so the first section can overlap it with `-mt-16`.
 */
export function PageHero({
  eyebrow,
  title,
  description,
  image,
  imagePosition = 'center',
  crumb,
  chips,
  compact = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  imagePosition?: string;
  /** Breadcrumb label after "Home"; defaults to the eyebrow. */
  crumb?: string;
  chips?: HeroChip[];
  /** Shorter hero for text-heavy pages (legal). */
  compact?: boolean;
}) {
  return (
    <section className={`relative overflow-hidden ${compact ? 'pb-24 pt-12' : 'pb-28 pt-16 md:pb-32 md:pt-20'}`}>
      <div
        className="animate-hero-zoom absolute inset-0"
        style={{
          backgroundImage: `url(${image})`,
          backgroundSize: 'cover',
          backgroundPosition: imagePosition,
        }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/25" aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/30 to-transparent" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="animate-fade-up mb-5 flex items-center gap-1 text-xs font-medium text-white/70">
          <Link href="/" className="hover:text-white">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-white">{crumb ?? eyebrow}</span>
        </nav>

        <span
          className="animate-fade-up inline-block rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white ring-1 ring-inset ring-white/25 backdrop-blur-sm"
          style={{ animationDelay: '60ms' }}
        >
          {eyebrow}
        </span>
        <h1
          className={`animate-fade-up mt-4 max-w-3xl font-extrabold leading-tight tracking-tight text-white ${compact ? 'text-3xl sm:text-4xl' : 'text-4xl sm:text-5xl'}`}
          style={{ animationDelay: '120ms' }}
        >
          {title}
        </h1>
        <p
          className="animate-fade-up mt-4 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg"
          style={{ animationDelay: '180ms' }}
        >
          {description}
        </p>

        {chips && chips.length > 0 && (
          <ul className="animate-fade-up mt-6 flex flex-wrap gap-2" style={{ animationDelay: '240ms' }}>
            {chips.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full bg-black/25 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-inset ring-white/20 backdrop-blur-sm"
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
