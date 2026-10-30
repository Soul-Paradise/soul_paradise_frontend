import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { PageHero, SectionHeading, IconTile, GRADIENTS } from '@/components/Page';
import { PlanHolidayCta } from '@/components/Home';
import {
  CmsIcon,
  HeroSpacer,
  getSiteContent,
  heroMetadata,
  iconForName,
  orderedKeys,
  waLink,
  type ServicesSections,
} from '@/lib/site-content';

// Copy, photos and section visibility come from the admin panel (Site Content → Services).
export async function generateMetadata(): Promise<Metadata> {
  const { sections } = await getSiteContent('services');
  return heroMetadata(sections.hero, 'services');
}

const BODY_KEYS = ['services', 'steps', 'plan_holiday_cta'] as const;
type ServicesList = NonNullable<ServicesSections['services']>;

export default async function ServicePage() {
  const { sections, order, global } = await getSiteContent('services');
  const { hero } = sections;
  const whatsappNumber = global.contact?.whatsappNumber ?? '';
  const keys = orderedKeys(order, BODY_KEYS);

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
        if (key === 'services' && sections.services) {
          // The grid overlaps the hero only when it directly follows it.
          const overlap = !!hero && i === 0;
          return (
            <section
              key={key}
              className={`relative z-10 mx-auto max-w-7xl px-4 pb-16 sm:px-6 md:pb-20 lg:px-8 ${overlap ? '-mt-16' : 'pt-16'}`}
            >
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {sections.services.items.map((s) => (
                  <ServiceCard key={s.title} service={s} labels={sections.services!} whatsappNumber={whatsappNumber} />
                ))}
              </div>
            </section>
          );
        }
        if (key === 'steps' && sections.steps) {
          return (
            <section key={key} className="bg-(--color-peace) py-16 md:py-20">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <SectionHeading eyebrow={sections.steps.eyebrow} title={sections.steps.title} />
                <ol className="relative grid grid-cols-1 gap-6 md:grid-cols-3">
                  {/* Connector line behind the steps on desktop */}
                  <span
                    className="pointer-events-none absolute left-[16%] right-[16%] top-7 hidden h-0.5 bg-gradient-to-r from-blue-500 via-emerald-500 to-orange-500 opacity-30 md:block"
                    aria-hidden="true"
                  />
                  {sections.steps.items.map(({ icon, title, body }, n) => (
                    <li key={title} className="group relative text-center">
                      <span className="relative mx-auto flex w-fit">
                        <IconTile icon={iconForName(icon)} accent={(['blue', 'green', 'orange'] as const)[n % 3]} size="lg" />
                        <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-(--color-primary-button) text-[11px] font-bold text-white ring-2 ring-(--color-peace)">
                          {n + 1}
                        </span>
                      </span>
                      <h3 className="mt-4 text-lg font-bold text-(--color-foreground)">{title}</h3>
                      <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-(--color-inactive)">{body}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </section>
          );
        }
        if (key === 'plan_holiday_cta') {
          return (
            <div key={key} className="pt-12">
              <PlanHolidayCta content={global.plan_holiday_cta} contact={global.contact} />
            </div>
          );
        }
        return null;
      })}
    </main>
  );
}

function ServiceCard({
  service: s,
  labels,
  whatsappNumber,
}: {
  service: ServicesList['items'][number];
  labels: Pick<ServicesList, 'bookLabel' | 'enquiryLabel'>;
  whatsappNumber: string;
}) {
  const actionClass =
    'group/btn mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-(--color-links) hover:opacity-80';

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl bg-(--color-peace) shadow-lg ring-1 ring-(--color-tertiary-button) transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
      <div className={`relative h-28 overflow-hidden bg-gradient-to-br ${GRADIENTS[s.accent]}`}>
        <span className="pointer-events-none absolute -right-6 -top-8 h-32 w-32 rounded-full bg-white/10 transition-transform duration-500 group-hover:scale-125" />
        <CmsIcon
          name={s.icon}
          className="absolute -bottom-4 right-4 h-24 w-24 text-white/15 transition-transform duration-500 group-hover:-rotate-12"
        />
      </div>
      <div className="flex flex-1 flex-col p-6">
        {/* relative + z-10 so the tile sits above the band it overlaps */}
        <span className="relative z-10 -mt-12 mb-3">
          <span className="inline-flex rounded-2xl bg-(--color-peace) p-1.5 shadow-md">
            <IconTile icon={iconForName(s.icon)} accent={s.accent} />
          </span>
        </span>
        <h3 className="text-lg font-bold text-(--color-foreground)">{s.title}</h3>
        <p className="mb-5 mt-2 text-sm leading-relaxed text-(--color-inactive)">{s.body}</p>
        {s.tab ? (
          <Link href={`/?tab=${s.tab}#booking`} className={actionClass}>
            {labels.bookLabel}
            <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
          </Link>
        ) : (
          <a href={waLink(whatsappNumber, s.enquiry)} target="_blank" rel="noopener noreferrer" className={actionClass}>
            <MessageCircle className="h-4 w-4" />
            {labels.enquiryLabel}
          </a>
        )}
      </div>
    </article>
  );
}
