import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

/**
 * Shared heading for homepage sections: same title style as the Offers
 * section, plus an optional subtitle and "see all" link.
 */
export function SectionHeader({
  title,
  subtitle,
  link,
}: {
  title: string;
  subtitle?: string;
  link?: { href: string; label: string };
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-2xl font-bold text-(--color-foreground)">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-(--color-inactive)">{subtitle}</p>}
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
