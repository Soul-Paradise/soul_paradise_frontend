import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { PageHero, SectionHeading, IconTile, GRADIENTS } from '@/components/Page';
import { PlanHolidayCta } from '@/components/Home';
import {
  CmsIcon,
  HeroSpacer,
  RichText,
  getSiteContent,
  hasImage,
  heroMetadata,
  iconForName,
  orderedKeys,
  type AboutSections,
} from '@/lib/site-content';

// Copy, photos and section visibility come from the admin panel (Site Content → About).
export async function generateMetadata(): Promise<Metadata> {
  const { sections } = await getSiteContent('about');
  return heroMetadata(sections.hero, 'about');
}

/** Sections below the hero, in admin order. */
const BODY_KEYS = ['story', 'iata', 'services', 'reasons', 'commitment', 'plan_holiday_cta'] as const;

export default async function AboutPage() {
  const { sections, order, global, gallery } = await getSiteContent('about');
  const { hero, story, iata } = sections;
  // Photos picked for the collage win; with none picked, show the latest trips from the gallery.
  const picked = iata?.collage.filter(hasImage) ?? [];
  const collage = (picked.length ? picked : (gallery ?? []).map((g) => g.url)).slice(0, 4);
  const keys = orderedKeys(order, BODY_KEYS);
  // Story and IATA share the band that overlaps the hero; they render there
  // together, at the position of whichever of the two comes first.
  const introAt = keys.findIndex((k) => k === 'story' || k === 'iata');

  return (
    <main className="min-h-screen bg-(--color-background)">
      {hero ? (
        <PageHero
          crumb={hero.crumb}
          title={hero.title}
          description={hero.description}
          image={hero.image}
          imagePosition={hero.imagePosition}
        />
      ) : (
        <HeroSpacer />
      )}

      {keys.map((key, i) => {
        if (key === 'story' || key === 'iata') {
          return i === introAt ? (
            <IntroBand key="intro" story={story} iata={iata} collage={collage} overlap={!!hero && i === 0} />
          ) : null;
        }
        if (key === 'services' && sections.services) return <WhatWeDo key={key} content={sections.services} />;
        if (key === 'reasons' && sections.reasons) return <Reasons key={key} content={sections.reasons} />;
        if (key === 'commitment' && sections.commitment) return <Commitment key={key} content={sections.commitment} />;
        if (key === 'plan_holiday_cta') {
          return <PlanHolidayCta key={key} content={global.plan_holiday_cta} contact={global.contact} />;
        }
        return null;
      })}
    </main>
  );
}

function IntroBand({
  story,
  iata,
  collage,
  overlap,
}: {
  story?: AboutSections['story'];
  iata?: AboutSections['iata'];
  /** Up to four trip photos for the IATA card. */
  collage: string[];
  /** Pull up over the hero photo (only when it directly follows the hero). */
  overlap: boolean;
}) {
  if (!story && !iata) return null;
  return (
    <section className={`relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${overlap ? '-mt-16' : 'pt-16'}`}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {story && (
          <div
            className={`rounded-2xl bg-(--color-peace) p-6 shadow-xl ring-1 ring-(--color-tertiary-button) sm:p-8 ${iata ? 'lg:col-span-3' : 'lg:col-span-5'}`}
          >
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-(--color-links)">{story.eyebrow}</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-(--color-foreground) sm:text-3xl">{story.title}</h2>
            <div className="mt-4 space-y-4 text-base leading-relaxed text-(--color-inactive)">
              {story.paragraphs.map((p, i) => (
                <p key={i}>
                  <RichText text={p} />
                </p>
              ))}
            </div>

            {story.founders.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-3 border-t border-(--color-tertiary-button) pt-6">
                {story.founders.map((f) => (
                  <div key={f.name} className="flex items-center gap-3 rounded-xl bg-(--color-background) py-2 pl-2 pr-4">
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${GRADIENTS[f.accent]} text-sm font-bold text-white`}
                    >
                      {f.initials}
                    </span>
                    <span>
                      <span className="block text-sm font-bold text-(--color-foreground)">{f.name}</span>
                      <span className="block text-xs text-(--color-inactive)">{story.founderRole}</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {iata && (
          <div
            className={`flex flex-col overflow-hidden rounded-2xl bg-(--color-peace) shadow-xl ring-1 ring-(--color-tertiary-button) ${story ? 'lg:col-span-2' : 'lg:col-span-5'}`}
          >
            <div className="relative bg-gradient-to-br from-blue-500 to-indigo-600 px-6 pb-14 pt-6 text-white">
              <span className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10" />
              <span className="pointer-events-none absolute -bottom-12 left-6 h-24 w-24 rounded-full bg-white/10" />
              <h3 className="relative text-2xl font-extrabold">{iata.title}</h3>
              <p className="relative mt-1 text-sm text-white/85">{iata.subtitle}</p>
            </div>
            {hasImage(iata.logo) && (
              <div className="relative -mt-10 flex justify-center">
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-lg ring-4 ring-(--color-peace)">
                  <Image src={iata.logo} alt={iata.title} width={56} height={56} className="object-contain" />
                </span>
              </div>
            )}
            {iata.facts.length > 0 && (
              <dl className="grid grid-cols-2 gap-3 px-6 pt-5">
                {iata.facts.map((f) => (
                  <div key={f.label} className="rounded-xl bg-(--color-background) p-4 text-center">
                    <dt className="text-[11px] font-bold uppercase tracking-wider text-(--color-inactive)">{f.label}</dt>
                    <dd className="mt-1 text-lg font-extrabold text-(--color-foreground)">{f.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            {/* A glimpse of real trips, pinned to the bottom of the card */}
            {collage.length > 0 && (
              <Link href={iata.galleryHref} className="group flex flex-1 flex-col p-6 pt-5">
                <span className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-(--color-inactive)">
                  {iata.galleryLabel}
                  <span className="inline-flex items-center gap-1 normal-case tracking-normal text-(--color-links)">
                    {iata.galleryLinkLabel}{' '}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </span>
                {/* Mosaic that grows to fill the card: one large photo, the rest stacked beside it */}
                <span
                  className={`grid min-h-56 flex-1 gap-2 ${collage.length > 1 ? 'grid-cols-3' : 'grid-cols-1'}`}
                  style={{ gridTemplateRows: `repeat(${Math.max(collage.length - 1, 1)}, minmax(0, 1fr))` }}
                >
                  {collage.map((src, i) => (
                    <span
                      key={src}
                      className={`relative overflow-hidden rounded-lg ${i === 0 && collage.length > 1 ? 'col-span-2' : ''}`}
                      style={i === 0 ? { gridRow: '1 / -1' } : undefined}
                    >
                      <Image
                        src={src}
                        alt=""
                        fill
                        sizes={i === 0 ? '(min-width: 1024px) 280px, 66vw' : '(min-width: 1024px) 140px, 33vw'}
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </span>
                  ))}
                </span>
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function WhatWeDo({ content }: { content: NonNullable<AboutSections['services']> }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20 lg:px-8">
      <SectionHeading eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {content.items.map((s) => (
          <div
            key={s.title}
            className="group relative overflow-hidden rounded-2xl bg-(--color-peace) p-6 shadow-sm ring-1 ring-(--color-tertiary-button) transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            <IconTile icon={iconForName(s.icon)} accent={s.accent} />
            <h3 className="mt-4 text-lg font-bold text-(--color-foreground)">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-(--color-inactive)">{s.body}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 text-center">
        <Link
          href={content.linkHref}
          className="group inline-flex items-center gap-1.5 text-sm font-semibold text-(--color-links) hover:opacity-80"
        >
          {content.linkLabel}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </section>
  );
}

function Reasons({ content }: { content: NonNullable<AboutSections['reasons']> }) {
  return (
    <section className="relative overflow-hidden bg-(--color-ink) py-16 md:py-20">
      <span className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
      <span className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-orange-500/15 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow={content.eyebrow} title={content.title} tone="dark" />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {content.items.map(({ icon, title, body }, i) => (
            <div
              key={title}
              className="group flex gap-5 rounded-2xl bg-white/5 p-6 ring-1 ring-inset ring-white/10 backdrop-blur-sm transition hover:bg-white/10"
            >
              <span className="text-4xl font-extrabold leading-none text-white/20 transition group-hover:text-sky-300/60">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <h3 className="flex items-center gap-2 text-lg font-bold text-white">
                  <CmsIcon name={icon} className="h-5 w-5 text-sky-300" />
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/75">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Commitment({ content }: { content: NonNullable<AboutSections['commitment']> }) {
  return (
    <section className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 md:py-20 lg:px-8">
      <CmsIcon name={content.icon} className="mx-auto h-8 w-8 text-(--color-warn)" />
      <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-(--color-foreground) sm:text-4xl">{content.title}</h2>
      <p className="mx-auto mt-5 max-w-3xl text-lg leading-relaxed text-(--color-inactive)">{content.text}</p>
      {content.stats.length > 0 && (
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {content.stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl bg-(--color-peace) p-6 shadow-sm ring-1 ring-(--color-tertiary-button) transition hover:-translate-y-1 hover:shadow-lg"
            >
              <p className={`bg-gradient-to-br ${GRADIENTS[stat.accent]} bg-clip-text text-4xl font-extrabold text-transparent`}>
                {stat.value}
              </p>
              <p className="mt-1 text-sm font-semibold text-(--color-inactive)">{stat.label}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
