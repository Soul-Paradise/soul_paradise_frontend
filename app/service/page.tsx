import { heroImage } from '@/lib/assets';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  FileText,
  Globe2,
  Headphones,
  MessageCircle,
  Palmtree,
  Plane,
  Search,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { PageHero, SectionHeading, IconTile, GRADIENTS, type Accent } from '@/components/Page';
import { PlanHolidayCta } from '@/components/Home';
import { whatsappLink } from '@/components/Home/constants';

export const metadata: Metadata = {
  title: 'Our Services - Soul Paradise Travels',
  description: 'Explore our travel services including international & domestic flights, holiday packages, hotels, visa & insurance',
};

interface Service {
  icon: LucideIcon;
  accent: Accent;
  title: string;
  body: string;
  /** Bookable on the site: link to that search tab. Otherwise: WhatsApp enquiry. */
  tab?: 'flights' | 'hotel' | 'insurance';
  enquiry?: string;
}

const SERVICES: Service[] = [
  {
    icon: Globe2,
    accent: 'blue',
    title: 'International Air Tickets',
    body: 'Competitive fares on international flights to destinations worldwide. We compare routes across multiple airlines to find you the best deals for your global travel.',
    tab: 'flights',
  },
  {
    icon: Plane,
    accent: 'green',
    title: 'Domestic Air Tickets',
    body: 'Affordable domestic flight bookings across India. Get instant confirmations and the most competitive prices for all major Indian airlines.',
    tab: 'flights',
  },
  {
    icon: Palmtree,
    accent: 'orange',
    title: 'Holiday Packages',
    body: 'Carefully curated holiday packages designed to suit every budget and preference, from adventure trips to relaxing getaways and family vacations.',
    enquiry: "Hi Soul Paradise, I'd like a quote for a holiday package.",
  },
  {
    icon: Building2,
    accent: 'teal',
    title: 'Hotel Booking',
    body: 'Access to a wide range of accommodations worldwide, from budget-friendly options to luxury stays, tailored to your needs and preferences.',
    tab: 'hotel',
  },
  {
    icon: FileText,
    accent: 'purple',
    title: 'Tourist Visa',
    body: 'Expert guidance for various tourist visas, handled by our highly experienced and skilled staff dedicated exclusively to visa processing.',
    enquiry: 'Hi Soul Paradise, I need help with a tourist visa.',
  },
  {
    icon: ShieldCheck,
    accent: 'pink',
    title: 'Travel Insurance',
    body: 'Comprehensive travel insurance solutions to ensure peace of mind throughout your journey, covering unforeseen circumstances and emergencies.',
    tab: 'insurance',
  },
];

const STEPS = [
  {
    icon: Search,
    title: 'Tell us your plan',
    body: 'Search flights, hotels or insurance right here, or message us about a package or visa.',
  },
  {
    icon: BadgeCheck,
    title: 'We find the best option',
    body: 'We compare airlines, routes and stays to match your budget and preferences.',
  },
  {
    icon: Headphones,
    title: 'Travel with support',
    body: 'Our team is on call around the clock, before, during and after your trip.',
  },
];

export default function ServicePage() {
  return (
    <main className="min-h-screen bg-(--color-background)">
      <PageHero
        crumb="Our Services"
        title="Everything your trip needs, in one place"
        description="Discover our comprehensive range of travel services designed to make your journey seamless, affordable, and memorable. From flight bookings to visa assistance, we've got you covered."
        image={heroImage('dubai-skyline.webp')}
      />

      {/* Services grid, overlapping the hero */}
      <section className="relative z-10 mx-auto -mt-16 max-w-7xl px-4 pb-16 sm:px-6 md:pb-20 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <ServiceCard key={s.title} service={s} />
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-(--color-peace) py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="How It Works" title="From idea to itinerary in three steps" />
          <ol className="relative grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Connector line behind the steps on desktop */}
            <span
              className="pointer-events-none absolute left-[16%] right-[16%] top-7 hidden h-0.5 bg-gradient-to-r from-blue-500 via-emerald-500 to-orange-500 opacity-30 md:block"
              aria-hidden="true"
            />
            {STEPS.map(({ icon, title, body }, i) => (
              <li key={title} className="group relative text-center">
                <span className="relative mx-auto flex w-fit">
                  <IconTile icon={icon} accent={(['blue', 'green', 'orange'] as const)[i]} size="lg" />
                  <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-(--color-primary-button) text-[11px] font-bold text-white ring-2 ring-(--color-peace)">
                    {i + 1}
                  </span>
                </span>
                <h3 className="mt-4 text-lg font-bold text-(--color-foreground)">{title}</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-(--color-inactive)">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <div className="pt-12">
        <PlanHolidayCta />
      </div>
    </main>
  );
}

function ServiceCard({ service: s }: { service: Service }) {
  const Icon = s.icon;
  const actionClass =
    'group/btn mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-(--color-links) hover:opacity-80';

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl bg-(--color-peace) shadow-lg ring-1 ring-(--color-tertiary-button) transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
      <div className={`relative h-28 overflow-hidden bg-gradient-to-br ${GRADIENTS[s.accent]}`}>
        <span className="pointer-events-none absolute -right-6 -top-8 h-32 w-32 rounded-full bg-white/10 transition-transform duration-500 group-hover:scale-125" />
        <Icon className="absolute -bottom-4 right-4 h-24 w-24 text-white/15 transition-transform duration-500 group-hover:-rotate-12" />
      </div>
      <div className="flex flex-1 flex-col p-6">
        {/* relative + z-10 so the tile sits above the band it overlaps */}
        <span className="relative z-10 -mt-12 mb-3">
          <span className="inline-flex rounded-2xl bg-(--color-peace) p-1.5 shadow-md">
            <IconTile icon={s.icon} accent={s.accent} />
          </span>
        </span>
        <h3 className="text-lg font-bold text-(--color-foreground)">{s.title}</h3>
        <p className="mb-5 mt-2 text-sm leading-relaxed text-(--color-inactive)">{s.body}</p>
        {s.tab ? (
          <Link href={`/?tab=${s.tab}#booking`} className={actionClass}>
            Search & book
            <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
          </Link>
        ) : (
          <a href={whatsappLink(s.enquiry)} target="_blank" rel="noopener noreferrer" className={actionClass}>
            <MessageCircle className="h-4 w-4" />
            Get a quote on WhatsApp
          </a>
        )}
      </div>
    </article>
  );
}
