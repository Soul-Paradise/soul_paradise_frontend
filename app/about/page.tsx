import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  FileText,
  Headphones,
  MapPin,
  Plane,
  ShieldCheck,
  Sparkles,
  Tag,
  Users,
  Heart,
  Palmtree,
} from 'lucide-react';
import { PageHero, SectionHeading, IconTile, type Accent } from '@/components/Page';
import { PlanHolidayCta } from '@/components/Home';

export const metadata: Metadata = {
  title: 'About Us - Soul Paradise Travels',
  description: 'Learn about Soul Paradise Travels - Your trusted IATA-accredited travel partner founded by Mr. Sanjay Srivastava and Mrs. Shafali Srivastava in Jalandhar, Punjab',
};

const SERVICES: { icon: typeof Plane; accent: Accent; title: string; body: string }[] = [
  {
    icon: Plane,
    accent: 'blue',
    title: 'Flight Ticketing',
    body: 'We search and compare routes across multiple airlines to find you the most competitive fares for both international and domestic travel.',
  },
  {
    icon: Palmtree,
    accent: 'green',
    title: 'Tour Packages',
    body: 'Curated holiday packages designed to suit every budget and preference, from adventure trips to relaxing getaways.',
  },
  {
    icon: FileText,
    accent: 'orange',
    title: 'Visa Assistance',
    body: 'Expert guidance for various tourist visas, handled by our highly experienced and skilled staff dedicated exclusively to visa processing.',
  },
  {
    icon: ShieldCheck,
    accent: 'purple',
    title: 'Travel Insurance',
    body: 'Comprehensive travel insurance solutions to ensure peace of mind throughout your journey, covering unforeseen circumstances.',
  },
  {
    icon: Building2,
    accent: 'teal',
    title: 'Hotel Bookings',
    body: 'Access to a wide range of accommodations worldwide, from budget-friendly options to luxury stays, tailored to your needs.',
  },
  {
    icon: Headphones,
    accent: 'pink',
    title: '24/7 Support',
    body: 'Round-the-clock customer support to assist you at every stage of your journey, ensuring a smooth travel experience.',
  },
];

const REASONS = [
  {
    icon: Tag,
    title: 'Best Price Guarantee',
    body: 'We compare multiple airlines and routes to ensure you always get the most competitive rates for your journey.',
  },
  {
    icon: BadgeCheck,
    title: 'IATA Certified',
    body: "Our IATA accreditation ensures you're working with a globally recognized and trusted travel service provider.",
  },
  {
    icon: Users,
    title: 'Expert Team',
    body: 'Our highly experienced staff, especially in visa processing, brings years of expertise to help you with every detail.',
  },
  {
    icon: Heart,
    title: 'Personalized Service',
    body: "Every client's budget and preferences matter to us. We tailor our services to create your perfect travel experience.",
  },
];

const FOUNDERS = [
  { name: 'Mr. Sanjay Srivastava', initials: 'SS', accent: 'from-blue-500 to-indigo-600' },
  { name: 'Mrs. Shafali Srivastava', initials: 'SS', accent: 'from-orange-500 to-red-500' },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-(--color-background)">
      <PageHero
        eyebrow="About Us"
        title="Your pocket-friendly tour planner"
        description="Soul Paradise makes travel accessible, affordable and memorable for everyone, from a first family holiday to a last-minute business trip."
        image="/kerala_2.jpg"
        imagePosition="center 30%"
        chips={[
          { icon: BadgeCheck, label: 'IATA accredited' },
          { icon: MapPin, label: 'Jalandhar, Punjab' },
          { icon: Headphones, label: '24/7 support' },
        ]}
      />

      {/* Our Story + IATA, overlapping the hero */}
      <section className="relative z-10 mx-auto -mt-16 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="rounded-2xl bg-(--color-peace) p-6 shadow-xl ring-1 ring-(--color-tertiary-button) sm:p-8 lg:col-span-3">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-(--color-links)">Our Story</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-(--color-foreground) sm:text-3xl">
              More than a destination
            </h2>
            <div className="mt-4 space-y-4 text-base leading-relaxed text-(--color-inactive)">
              <p>
                Soul Paradise is a proud initiative founded by <span className="font-semibold text-(--color-foreground)">Mr. Sanjay Srivastava</span> and <span className="font-semibold text-(--color-foreground)">Mrs. Shafali Srivastava</span>, driven by a passion for making travel accessible, affordable, and memorable for everyone.
              </p>
              <p>
                What started as a vision to provide exceptional travel services has grown into a trusted name in the industry. We believe that every journey should be more than just a destination - it should be an experience that enriches your life.
              </p>
              <p>
                Based in <span className="font-semibold text-(--color-foreground)">Jalandhar, Punjab</span>, we&apos;ve built our reputation on three pillars: competitive pricing, personalized service, and unwavering commitment to quality.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3 border-t border-(--color-tertiary-button) pt-6">
              {FOUNDERS.map((f) => (
                <div key={f.name} className="flex items-center gap-3 rounded-xl bg-(--color-background) py-2 pl-2 pr-4">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${f.accent} text-sm font-bold text-white`}
                  >
                    {f.initials}
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-(--color-foreground)">{f.name}</span>
                    <span className="block text-xs text-(--color-inactive)">Founder</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col overflow-hidden rounded-2xl bg-(--color-peace) shadow-xl ring-1 ring-(--color-tertiary-button) lg:col-span-2">
            <div className="relative bg-gradient-to-br from-blue-500 to-indigo-600 px-6 pb-14 pt-6 text-white">
              <span className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10" />
              <span className="pointer-events-none absolute -bottom-12 left-6 h-24 w-24 rounded-full bg-white/10" />
              <p className="relative text-xs font-bold uppercase tracking-[0.18em] text-white/80">Accreditation</p>
              <h3 className="relative mt-1 text-2xl font-extrabold">IATA Accredited</h3>
              <p className="relative mt-1 text-sm text-white/85">
                Certified by the International Air Transport Association
              </p>
            </div>
            <div className="relative -mt-10 flex justify-center">
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-lg ring-4 ring-(--color-peace)">
                <Image src="/iata_logo.png" alt="IATA Accredited" width={56} height={56} className="object-contain" />
              </span>
            </div>
            <dl className="grid grid-cols-2 gap-3 px-6 pt-5">
              <div className="rounded-xl bg-(--color-background) p-4 text-center">
                <dt className="text-[11px] font-bold uppercase tracking-wider text-(--color-inactive)">IATA Code</dt>
                <dd className="mt-1 text-lg font-extrabold text-(--color-foreground)">14009881</dd>
              </div>
              <div className="rounded-xl bg-(--color-background) p-4 text-center">
                <dt className="text-[11px] font-bold uppercase tracking-wider text-(--color-inactive)">Accreditation</dt>
                <dd className="mt-1 text-lg font-extrabold text-(--color-foreground)">GoLite</dd>
              </div>
            </dl>

            {/* A glimpse of real trips, pinned to the bottom of the card */}
            <Link href="/hall-of-fame" className="group mt-auto block p-6 pt-5">
              <span className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-(--color-inactive)">
                Trips we&apos;ve planned
                <span className="inline-flex items-center gap-1 normal-case tracking-normal text-(--color-links)">
                  See gallery <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </span>
              <span className="grid grid-cols-3 gap-2">
                {['/dubai_1.jpg', '/rajasthan_3.jpg', '/digha_2.jpg'].map((src) => (
                  <span key={src} className="relative aspect-square overflow-hidden rounded-lg">
                    <Image
                      src={src}
                      alt=""
                      fill
                      sizes="120px"
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </span>
                ))}
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* What We Do */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20 lg:px-8">
        <SectionHeading
          eyebrow="What We Do"
          title="Every part of your trip, handled"
          subtitle="From the first fare search to the moment you land back home."
        />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <div
              key={s.title}
              className="group relative overflow-hidden rounded-2xl bg-(--color-peace) p-6 shadow-sm ring-1 ring-(--color-tertiary-button) transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <IconTile icon={s.icon} accent={s.accent} />
              <h3 className="mt-4 text-lg font-bold text-(--color-foreground)">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-(--color-inactive)">{s.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link
            href="/service"
            className="group inline-flex items-center gap-1.5 text-sm font-semibold text-(--color-links) hover:opacity-80"
          >
            Explore all services
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      {/* Why Choose Us — dark band */}
      <section className="relative overflow-hidden bg-(--color-primary-button) py-16 md:py-20">
        <span className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
        <span className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-orange-500/15 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Why Soul Paradise" title="Why Choose Soul Paradise?" tone="dark" />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {REASONS.map(({ icon: Icon, title, body }, i) => (
              <div
                key={title}
                className="group flex gap-5 rounded-2xl bg-white/5 p-6 ring-1 ring-inset ring-white/10 backdrop-blur-sm transition hover:bg-white/10"
              >
                <span className="text-4xl font-extrabold leading-none text-white/20 transition group-hover:text-sky-300/60">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-bold text-white">
                    <Icon className="h-5 w-5 text-sky-300" />
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/75">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Commitment */}
      <section className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 md:py-20 lg:px-8">
        <Sparkles className="mx-auto h-8 w-8 text-(--color-warn)" />
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-(--color-foreground) sm:text-4xl">
          Our Commitment to You
        </h2>
        <p className="mx-auto mt-5 max-w-3xl text-lg leading-relaxed text-(--color-inactive)">
          At Soul Paradise, we don&apos;t just book tickets - we create experiences. Our commitment to service, quality, and operational excellence sets the benchmark for travel services in India. We continually innovate to bring you the best in tourism and hospitality, ensuring every journey with us is prompt, efficient, and memorable.
        </p>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { value: '100%', label: 'Customer Satisfaction', accent: 'from-blue-500 to-indigo-600' },
            { value: '24/7', label: 'Support Available', accent: 'from-emerald-500 to-teal-600' },
            { value: 'IATA', label: 'Certified Agency', accent: 'from-orange-500 to-red-500' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl bg-(--color-peace) p-6 shadow-sm ring-1 ring-(--color-tertiary-button) transition hover:-translate-y-1 hover:shadow-lg"
            >
              <p className={`bg-gradient-to-br ${stat.accent} bg-clip-text text-4xl font-extrabold text-transparent`}>
                {stat.value}
              </p>
              <p className="mt-1 text-sm font-semibold text-(--color-inactive)">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <PlanHolidayCta />
    </main>
  );
}
