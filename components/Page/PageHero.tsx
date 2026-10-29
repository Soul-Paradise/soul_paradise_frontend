import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

/** Space at the bottom of the hero that the page's first section overlaps (`-mt-16`). */
const OVERLAP = 'pb-16';

/**
 * Photo-backed page header shared by every page except the homepage.
 *
 * The height is fixed per breakpoint (not driven by the text), so every page's
 * hero image is exactly the same size. The text is centred in the part of the
 * image above the overlap zone, so it always sits on the photo and never runs
 * under the first section's cards.
 */
export function PageHero({
  title,
  description,
  image,
  imagePosition = 'center',
  crumb,
}: {
  title: string;
  description: string;
  image: string;
  imagePosition?: string;
  /** Breadcrumb label after "Home"; defaults to the title. */
  crumb?: string;
}) {
  return (
    <section className="relative h-[440px] overflow-hidden sm:h-[400px] lg:h-[420px]">
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

      <div className={`relative mx-auto flex h-full max-w-7xl flex-col justify-center px-4 sm:px-6 lg:px-8 ${OVERLAP}`}>
        <nav aria-label="Breadcrumb" className="animate-fade-up mb-4 flex items-center gap-1 text-xs font-medium text-white/70">
          <Link href="/" className="hover:text-white">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="truncate text-white">{crumb ?? title}</span>
        </nav>

        <h1
          className="animate-fade-up max-w-3xl text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl"
          style={{ animationDelay: '80ms' }}
        >
          {title}
        </h1>
        <p
          className="animate-fade-up mt-4 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg"
          style={{ animationDelay: '160ms' }}
        >
          {description}
        </p>
      </div>
    </section>
  );
}
