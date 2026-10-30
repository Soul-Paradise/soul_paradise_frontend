import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

/**
 * Heading for homepage sections. Same typography as the other pages'
 * SectionHeading (eyebrow + bold title), but left-aligned so a "see all"
 * link can sit on the right.
 */
export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  link,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  link?: { href: string; label: string };
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-(--color-links)">{eyebrow}</p>
        )}
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-(--color-foreground) sm:text-4xl">{title}</h2>
        {subtitle && <p className="mt-2 text-base leading-relaxed text-(--color-inactive)">{subtitle}</p>}
      </div>
      {link && (
        <Link
          href={link.href}
          className="group inline-flex items-center gap-1 text-sm font-semibold text-(--color-links) hover:opacity-80"
        >
          {link.label}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
