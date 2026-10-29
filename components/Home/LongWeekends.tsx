'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  CalendarDays,
  MessageCircle,
  Plane,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  addDays,
  dayName,
  daysUntil,
  monthName,
  shortDate,
  upcomingLongWeekends,
  type LongWeekend,
} from '@/lib/holidays';
import { SectionHeader } from './SectionHeader';
import { whatsappLink } from './constants';

/** Same palette as the Offers cards, one per card in turn. */
const GRADIENTS = [
  'from-blue-500 to-indigo-600',
  'from-orange-500 to-red-500',
  'from-emerald-500 to-teal-600',
  'from-purple-500 to-violet-600',
];

/** "21 – 24 Nov", or "25 Dec – 3 Jan" across months (weekdays are in the strip). */
function dateRange(start: string, end: string): string {
  const [sd, ed] = [Number(start.slice(8)), Number(end.slice(8))];
  const [sm, em] = [monthName(start), monthName(end)];
  return sm === em ? `${sd} – ${ed} ${em}` : `${sd} ${sm} – ${ed} ${em}`;
}

/** Rough ideas by trip length, from Jalandhar. */
function ideasFor(days: number): string {
  if (days <= 3) return 'Amritsar · Dharamshala · Shimla';
  if (days === 4) return 'Manali · Rishikesh · Jaipur';
  return 'Goa · Kerala · Dubai';
}

export function LongWeekends() {
  const weekends = upcomingLongWeekends();
  if (weekends.length === 0) return null;

  return (
    <section className="py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <SectionHeader
          title="Plan your next long weekend"
          subtitle="Upcoming holidays, the smartest leave to take, and everything you need to book for them."
        />
        <div className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 scrollbar-hide sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
          {weekends.map((w, i) => (
            <WeekendCard key={w.start} weekend={w} gradient={GRADIENTS[i % GRADIENTS.length]} />
          ))}
        </div>
      </div>
    </section>
  );
}

function WeekendCard({ weekend: w, gradient }: { weekend: LongWeekend; gradient: string }) {
  const inDays = daysUntil(w.start);
  const leaves = w.leaveDates.length;
  const nights = w.days - 1;
  const range = dateRange(w.start, w.end);
  const query = `from=${w.start}&to=${w.end}`;

  const services = [
    {
      tab: 'flights',
      icon: Plane,
      title: 'Return flights',
      detail: `${range}, round trip`,
      aria: 'Book flights',
    },
    {
      tab: 'hotel',
      icon: Building2,
      title: 'Hotel stay',
      detail: `${nights} night${nights === 1 ? '' : 's'} from ${dayName(w.start)} ${Number(w.start.slice(8))}`,
      aria: 'Book hotels',
    },
    {
      tab: 'insurance',
      icon: ShieldCheck,
      title: 'Travel insurance',
      detail: `Covered all ${w.days} days`,
      aria: 'Book insurance',
    },
  ];

  return (
    <article className="group/card flex w-72 shrink-0 snap-start flex-col overflow-hidden rounded-xl bg-(--color-peace) shadow-sm ring-1 ring-(--color-tertiary-button) transition-all hover:-translate-y-1 hover:shadow-xl sm:w-auto">
      {/* Headline: the break itself */}
      <div className={`relative overflow-hidden bg-gradient-to-br ${gradient} p-5 text-white`}>
        {/* Soft decorative circles, like a sports-ticket stub */}
        <span className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10 transition-transform duration-500 group-hover/card:scale-125" />
        <span className="pointer-events-none absolute -bottom-10 right-10 h-20 w-20 rounded-full bg-white/10" />

        <div className="relative flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider">
            <CalendarDays className="h-3.5 w-3.5" />
            {range}
          </span>
          <span className="rounded-full bg-black/15 px-2.5 py-1 text-[11px] font-semibold">
            {inDays === 1 ? 'Tomorrow' : `In ${inDays} days`}
          </span>
        </div>

        <p className="relative mt-4 text-4xl font-extrabold leading-none tracking-tight">
          {w.days}
          <span className="ml-1.5 text-lg font-bold">days off</span>
        </p>
        <h3 className="relative mt-1 text-base font-bold opacity-95">{w.holiday.name}</h3>
        <p className="relative mt-0.5 text-xs font-semibold opacity-90">
          {leaves
            ? `Just take ${w.leaveDates.map(dayName).join(' & ')} off`
            : 'No leave needed, just pack your bags'}
        </p>

        <DayStrip weekend={w} />
      </div>

      {/* What we provide for this window, each one bookable */}
      <div className="flex flex-1 flex-col p-4">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-(--color-inactive)">
          We&apos;ve got you covered
        </p>
        <div className="space-y-1.5">
          {services.map(({ tab, icon: Icon, title, detail, aria }) => (
            <Link
              key={tab}
              href={`/?tab=${tab}&${query}#booking`}
              aria-label={`${aria} for ${w.holiday.name}, ${shortDate(w.start)} to ${shortDate(w.end)}`}
              className="group flex items-center gap-3 rounded-lg border border-(--color-tertiary-button) px-3 py-2.5 transition hover:border-(--color-links) hover:bg-(--color-links)/5"
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${gradient} text-white shadow-sm transition-transform group-hover:scale-110`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-(--color-foreground)">{title}</span>
                <span className="block truncate text-xs text-(--color-inactive)">{detail}</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-(--color-inactive) transition group-hover:translate-x-0.5 group-hover:text-(--color-links)" />
            </Link>
          ))}
        </div>

        <p className="mt-3 flex items-start gap-1.5 text-xs text-(--color-inactive)">
          <Sparkles className="mt-px h-3.5 w-3.5 shrink-0 text-(--color-warn)" />
          <span>
            <span className="font-semibold text-(--color-foreground)">Popular picks:</span>{' '}
            {ideasFor(w.days)}
          </span>
        </p>

        {/* mt-auto pins the button to the bottom so cards in a row line up */}
        <div className="mt-auto pt-4">
          <a
            href={whatsappLink(
              `Hi Soul Paradise, I'd like a holiday package quote for the ${w.holiday.name} long weekend (${shortDate(w.start)} to ${shortDate(w.end)}).`
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-lg bg-(--color-primary-button) px-4 py-2.5 text-sm font-semibold text-(--color-peace) transition hover:bg-(--color-secondary-button)"
          >
            <MessageCircle className="h-4 w-4" />
            Get a package quote
          </a>
        </div>
      </div>
    </article>
  );
}

/** One square per day of the break: holiday, weekend or leave. */
function DayStrip({ weekend: w }: { weekend: LongWeekend }) {
  const days = Array.from({ length: w.days }, (_, i) => addDays(w.start, i));
  const leave = new Set(w.leaveDates);

  return (
    <div className="relative mt-4 flex gap-1" aria-hidden="true">
      {days.map((d) => {
        const isHoliday = d === w.holiday.date;
        const cls = isHoliday
          ? 'bg-white text-(--color-foreground) shadow-sm'
          : leave.has(d)
            ? 'bg-white/10 text-white ring-1 ring-inset ring-white/70 [background-image:repeating-linear-gradient(45deg,transparent_0_4px,rgba(255,255,255,0.18)_4px_8px)]'
            : 'bg-white/20 text-white';
        return (
          <span
            key={d}
            title={isHoliday ? w.holiday.name : leave.has(d) ? 'Take leave' : 'Weekend'}
            className={`flex h-10 flex-1 flex-col items-center justify-center rounded-md text-[10px] font-semibold leading-tight ${cls}`}
          >
            <span className="opacity-80">{dayName(d).slice(0, 2)}</span>
            <span className="text-sm font-bold">{Number(d.slice(8))}</span>
          </span>
        );
      })}
    </div>
  );
}
