import Link from 'next/link';
import { ArrowRight, BookOpen, FileText, HelpCircle, Mail, MapPin, type LucideIcon } from 'lucide-react';
import { PageHero } from './PageHero';
import { LegalToc } from './LegalToc';
import { GRADIENTS, ACCENT_CYCLE } from './palette';

export interface LegalSection {
  number: number;
  title: string;
  content: string[];
  subsections?: { title: string; content: string }[];
}

const POLICIES = [
  { href: '/terms', label: 'Terms & Conditions' },
  { href: '/privacy-policy', label: 'Privacy Policy' },
  { href: '/refund-cancellation-policy', label: 'Refund & Cancellation Policy' },
];

const sectionId = (n: number) => `section-${n}`;

/**
 * Shared layout for the legal pages: compact hero, sticky table of contents,
 * one card per numbered section, and a help card. Copy comes from each page.
 */
export function LegalPage({
  path,
  title,
  description,
  sections,
  help,
  icon = FileText,
}: {
  /** This page's route, so it can be excluded from "Related policies". */
  path: string;
  title: string;
  description: string;
  sections: LegalSection[];
  help: { title: string; text: string };
  icon?: LucideIcon;
}) {
  const Icon = icon;
  const toc = sections.map((s) => ({ id: sectionId(s.number), number: s.number, title: s.title }));
  const related = POLICIES.filter((p) => p.href !== path);

  return (
    <main className="min-h-screen bg-(--color-background)">
      <PageHero
        title={title}
        description={description}
        image="/hero_bg.jpg"
        imagePosition="center 70%"
        compact
      />

      <div className="relative z-10 mx-auto -mt-16 grid max-w-7xl grid-cols-1 gap-6 px-4 pb-16 sm:px-6 md:pb-20 lg:grid-cols-[280px_1fr] lg:gap-8 lg:px-8">
        {/* Sidebar: collapsible on mobile, sticky on desktop */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl bg-(--color-peace) p-4 shadow-xl ring-1 ring-(--color-tertiary-button)">
            <details className="group lg:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold text-(--color-foreground)">
                <span className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-(--color-links)" /> On this page
                </span>
                <span className="text-xs font-semibold text-(--color-links) group-open:hidden">Show</span>
                <span className="hidden text-xs font-semibold text-(--color-links) group-open:inline">Hide</span>
              </summary>
              <div className="mt-3">
                <LegalToc items={toc} />
              </div>
            </details>
            <div className="hidden lg:block">
              <p className="mb-2 flex items-center gap-2 px-2.5 text-xs font-bold uppercase tracking-[0.18em] text-(--color-inactive)">
                <BookOpen className="h-4 w-4 text-(--color-links)" /> On this page
              </p>
              <div className="max-h-[50vh] overflow-y-auto pr-1">
                <LegalToc items={toc} />
              </div>
            </div>
          </div>

          <div className="mt-4 hidden rounded-2xl bg-(--color-peace) p-4 ring-1 ring-(--color-tertiary-button) lg:block">
            <p className="mb-2 px-1 text-xs font-bold uppercase tracking-[0.18em] text-(--color-inactive)">Related policies</p>
            {related.map((p) => (
              <Link
                key={p.href}
                href={p.href}
                className="group flex items-center justify-between rounded-lg px-1 py-2 text-sm font-medium text-(--color-foreground) hover:text-(--color-links)"
              >
                {p.label}
                <ArrowRight className="h-4 w-4 text-(--color-inactive) transition group-hover:translate-x-0.5 group-hover:text-(--color-links)" />
              </Link>
            ))}
          </div>
        </aside>

        {/* Sections */}
        <div className="min-w-0 space-y-4">
          {sections.map((section, i) => (
            <article
              key={section.number}
              id={sectionId(section.number)}
              className="scroll-mt-24 rounded-2xl bg-(--color-peace) p-6 shadow-sm ring-1 ring-(--color-tertiary-button) transition-shadow hover:shadow-md sm:p-8"
            >
              <header className="flex items-start gap-4">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${
                    GRADIENTS[ACCENT_CYCLE[i % ACCENT_CYCLE.length]]
                  } text-sm font-extrabold text-white shadow-md`}
                >
                  {String(section.number).padStart(2, '0')}
                </span>
                <h2 className="pt-1.5 text-xl font-bold text-(--color-foreground) sm:text-2xl">{section.title}</h2>
              </header>
              <div className="mt-4 space-y-3 sm:pl-14">
                {section.content.map((paragraph, idx) => (
                  <p key={idx} className="leading-relaxed text-(--color-inactive)">
                    {paragraph}
                  </p>
                ))}
                {section.subsections?.map((sub) => (
                  <div key={sub.title} className="rounded-xl border-l-4 border-(--color-links) bg-(--color-links)/5 p-4">
                    <h3 className="font-semibold text-(--color-foreground)">{sub.title}</h3>
                    <p className="mt-1 leading-relaxed text-(--color-inactive)">{sub.content}</p>
                  </div>
                ))}
              </div>
            </article>
          ))}

          {/* Help card */}
          <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700 to-(--color-primary-button) p-6 text-white shadow-lg sm:p-8">
            <span className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10" />
            <Icon className="pointer-events-none absolute -bottom-6 right-6 h-32 w-32 text-white/5" />
            <div className="relative flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                <HelpCircle className="h-6 w-6" />
              </span>
              <h2 className="text-xl font-bold sm:text-2xl">{help.title}</h2>
            </div>
            <p className="relative mt-3 max-w-2xl leading-relaxed text-white/80">{help.text}</p>
            <div className="relative mt-5 flex flex-col gap-4 sm:flex-row sm:gap-8">
              <a href="mailto:soulparadise21@gmail.com" className="flex items-center gap-2 font-semibold hover:underline">
                <Mail className="h-5 w-5 text-sky-300" />
                soulparadise21@gmail.com
              </a>
              <span className="flex items-start gap-2 text-white/85">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-sky-300" />
                <span>
                  Shop No. 21, 1st Floor, PPR Plaza
                  <br />
                  Jalandhar, Punjab – 144001
                </span>
              </span>
            </div>
            <Link
              href="/contact"
              className="relative mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-(--color-primary-button) transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              Visit our Contact page for more ways to reach us
              <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        </div>
      </div>
    </main>
  );
}
