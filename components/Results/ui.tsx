'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronDown, ChevronLeft, Pencil, type LucideIcon } from 'lucide-react';

/**
 * Shared look for the flight, hotel and insurance results pages. Each page is
 * built from the same pieces - summary bar, filter panel, sort tabs, result
 * cards, loader and empty state - so the three stay identical.
 */

/** Page width + gutters used by every results page. */
export const RESULTS_CONTAINER = 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8';

/** Outer card style for one result (a flight, a hotel, a plan). */
export const RESULT_CARD =
  'rounded-2xl border border-(--color-tertiary-button) bg-white shadow-sm transition-all duration-200 hover:border-(--color-links)/30 hover:shadow-lg';

// ---------------------------------------------------------------------------
// Summary bar
// ---------------------------------------------------------------------------

export interface SummaryField {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon?: LucideIcon;
}

/** Sticky bar under the navbar showing the current search, with Modify Search. */
export function SummaryBar({
  fields,
  modifyHref = '/',
  extra,
  backHref,
}: {
  fields: SummaryField[];
  modifyHref?: string;
  /** Extra controls left of Modify Search (e.g. share). */
  extra?: React.ReactNode;
  /** Later booking steps show a back arrow to the previous step. */
  backHref?: string;
}) {
  return (
    <div className="sticky top-16 z-30 border-b border-(--color-tertiary-button) bg-white/95 shadow-sm backdrop-blur">
      <div className={`${RESULTS_CONTAINER} flex items-center justify-between gap-4 py-3`}>
        {backHref && (
          <Link
            href={backHref}
            aria-label="Back"
            className="-mr-2 shrink-0 rounded-full p-2 text-(--color-inactive) transition-colors hover:bg-(--color-primary-tint) hover:text-(--color-links)"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
        )}
        <div className="flex min-w-0 flex-1 overflow-x-auto scrollbar-hide">
          <div className="flex divide-x divide-(--color-tertiary-button) rounded-xl border border-(--color-tertiary-button) bg-white">
            {fields.map(({ label, value, sub, icon: Icon }) => (
              <div key={label} className="min-w-[130px] px-4 py-2">
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em] text-(--color-inactive)">
                  {Icon && <Icon className="h-3 w-3" />}
                  {label}
                </div>
                <div className="truncate text-sm font-bold text-(--color-foreground)">{value}</div>
                {sub && <div className="truncate text-xs text-(--color-inactive)">{sub}</div>}
              </div>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {extra}
          <ModifySearchButton href={modifyHref} />
        </div>
      </div>
    </div>
  );
}

export function ModifySearchButton({ href = '/' }: { href?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-(--color-links) px-4 py-2 text-xs font-bold uppercase tracking-wide text-(--color-links) transition-colors hover:bg-(--color-links) hover:text-white"
    >
      <Pencil className="h-3.5 w-3.5" />
      Modify Search
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Sort tabs + result count
// ---------------------------------------------------------------------------

export function SortTabs<T extends string>({
  options,
  active,
  onChange,
  shown,
  total,
  noun,
}: {
  options: readonly { key: T; label: string; icon?: LucideIcon }[];
  active: T;
  onChange: (key: T) => void;
  shown: number;
  total: number;
  /** "Flights", "Hotels", "Plans" */
  noun: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div role="tablist" aria-label="Sort results" className="inline-flex flex-wrap gap-1 rounded-full bg-slate-100 p-1">
        {options.map(({ key, label, icon: Icon }) => {
          const isActive = active === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(key)}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
                isActive ? 'bg-white text-(--color-links) shadow-sm' : 'text-(--color-inactive) hover:text-(--color-foreground)'
              }`}
            >
              {Icon && <Icon className="h-4 w-4" />}
              {label}
            </button>
          );
        })}
      </div>
      <p className="text-sm text-(--color-inactive)">
        Showing <span className="font-bold text-(--color-foreground)">{shown}</span> of{' '}
        <span className="font-bold text-(--color-foreground)">{total}</span> {noun} found
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

/** Left-hand filter card. */
export function FilterPanel({
  onClear,
  children,
  className = '',
}: {
  onClear?: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <aside className={`overflow-hidden rounded-2xl border border-(--color-tertiary-button) bg-white shadow-sm ${className}`}>
      <div className="flex items-center justify-between px-5 py-4">
        <h2 className="text-base font-extrabold text-(--color-foreground)">Filters</h2>
        {onClear && (
          <button type="button" onClick={onClear} className="text-xs font-bold text-(--color-links) hover:underline">
            Clear all
          </button>
        )}
      </div>
      {children}
    </aside>
  );
}

/**
 * One titled group inside the filter card. `collapsible` adds a chevron for
 * long lists (e.g. amenities) that start closed.
 */
export function FilterSection({
  title,
  hint,
  children,
  collapsible = false,
  defaultOpen = true,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const heading = <h3 className="text-sm font-bold text-(--color-foreground)">{title}</h3>;
  return (
    <section className="border-t border-(--color-tertiary-button) px-5 py-4">
      {collapsible ? (
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="flex w-full items-center justify-between text-left"
        >
          {heading}
          <ChevronDown className={`h-4 w-4 text-(--color-inactive) transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      ) : (
        heading
      )}
      {hint && <p className="mt-0.5 text-xs text-(--color-inactive)">{hint}</p>}
      {(!collapsible || open) && <div className="mt-3">{children}</div>}
    </section>
  );
}

/** Checkbox row used in every filter list. */
export function FilterCheckbox({
  checked,
  onChange,
  label,
  meta,
}: {
  checked: boolean;
  onChange: () => void;
  label: React.ReactNode;
  /** Right-aligned extra (a count or a price). */
  meta?: React.ReactNode;
}) {
  return (
    <label className="group flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-1.5 transition-colors hover:bg-(--color-primary-tint)/50">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 shrink-0 rounded border-gray-300 accent-(--color-links)"
      />
      <span className={`min-w-0 flex-1 text-sm ${checked ? 'font-semibold text-(--color-foreground)' : 'text-(--color-inactive)'} group-hover:text-(--color-foreground)`}>
        {label}
      </span>
      {meta !== undefined && <span className="shrink-0 text-xs text-(--color-inactive)">{meta}</span>}
    </label>
  );
}

/** Selectable chip (e.g. a cover band or a time slot) used inside filters. */
export const filterChip = (active: boolean) =>
  `rounded-xl border px-3 py-2 text-center text-xs font-semibold transition-all ${
    active
      ? 'border-(--color-links) bg-(--color-primary-tint) text-(--color-links)'
      : 'border-(--color-tertiary-button) text-(--color-inactive) hover:border-(--color-links)/50 hover:text-(--color-foreground)'
  }`;

// ---------------------------------------------------------------------------
// Booking action on a result card
// ---------------------------------------------------------------------------

/**
 * The sunset-orange booking action: result cards (Book, View Plan, Select)
 * and the continue/pay step of every booking page. `href` renders a link.
 */
export function BookButton({
  children,
  onClick,
  disabled,
  type = 'button',
  href,
  block = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
  href?: string;
  /** Full width (summary-card CTAs). */
  block?: boolean;
}) {
  const className = `group inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-gradient-to-r from-(--color-accent-light) to-(--color-accent) px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-500/25 transition-all hover:-translate-y-0.5 hover:from-(--color-accent) hover:to-(--color-accent-hover) hover:shadow-lg disabled:pointer-events-none disabled:translate-y-0 disabled:opacity-60 ${block ? 'w-full py-3' : ''}`;
  const content = (
    <>
      {children}
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
    </>
  );
  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={className}>
      {content}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Booking steps (after a result is picked)
// ---------------------------------------------------------------------------

/** Static content card on the booking steps (same frame as a result card). */
export const STEP_CARD = 'rounded-2xl border border-(--color-tertiary-button) bg-white shadow-sm';

/** Section title inside a STEP_CARD. */
export const STEP_HEADING = 'text-base font-bold text-(--color-foreground)';

/** Sticky header on every booking step: back arrow, step title, trip line. */
export function StepHeader({
  title,
  subtitle,
  backHref,
  onBack,
  extra,
}: {
  title: string;
  subtitle?: React.ReactNode;
  backHref?: string;
  onBack?: () => void;
  extra?: React.ReactNode;
}) {
  const backClass =
    'shrink-0 rounded-full border border-(--color-tertiary-button) p-2 text-(--color-inactive) transition-colors hover:border-(--color-links) hover:bg-(--color-primary-tint) hover:text-(--color-links)';
  return (
    <div className="sticky top-16 z-30 border-b border-(--color-tertiary-button) bg-white/95 shadow-sm backdrop-blur">
      <div className={`${RESULTS_CONTAINER} flex min-h-[68px] items-center gap-3 py-3`}>
        {backHref ? (
          <Link href={backHref} aria-label="Back" className={backClass}>
            <ChevronLeft className="h-4 w-4" />
          </Link>
        ) : onBack ? (
          <button type="button" onClick={onBack} aria-label="Back" className={backClass}>
            <ChevronLeft className="h-4 w-4" />
          </button>
        ) : null}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold text-(--color-foreground)">{title}</h1>
          {subtitle && <p className="truncate text-xs text-(--color-inactive)">{subtitle}</p>}
        </div>
        {extra && <div className="flex shrink-0 items-center gap-2">{extra}</div>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading + empty states
// ---------------------------------------------------------------------------

/** Spinner card plus skeleton rows shaped like result cards. */
export function ResultsLoader({ title, subtitle, rows = 3 }: { title: string; subtitle?: string; rows?: number }) {
  return (
    <div className="space-y-3" role="status" aria-live="polite">
      <div className={`${RESULT_CARD} flex flex-col items-center px-6 py-10 text-center hover:shadow-sm`}>
        <span className="relative flex h-12 w-12">
          <span className="absolute inset-0 rounded-full border-4 border-(--color-primary-tint)" />
          <span className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-(--color-links)" />
        </span>
        <h3 className="mt-5 text-lg font-extrabold text-(--color-foreground)">{title}</h3>
        {subtitle && <p className="mt-1 max-w-md text-sm text-(--color-inactive)">{subtitle}</p>}
      </div>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={`${RESULT_CARD} flex animate-pulse items-center gap-4 p-5 hover:shadow-sm`}>
          <div className="h-12 w-12 shrink-0 rounded-xl bg-slate-100" />
          <div className="flex-1 space-y-2.5">
            <div className="h-3.5 w-2/5 rounded-full bg-slate-100" />
            <div className="h-3 w-1/4 rounded-full bg-slate-100" />
          </div>
          <div className="hidden w-32 space-y-2.5 sm:block">
            <div className="ml-auto h-4 w-20 rounded-full bg-slate-100" />
            <div className="ml-auto h-9 w-28 rounded-full bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** "Nothing to show" card: no results at all, or none matching the filters. */
export function ResultsEmpty({
  icon: Icon,
  title,
  message,
  action,
}: {
  icon: LucideIcon;
  title: string;
  message: string;
  /** e.g. { label: 'Clear filters', onClick } or { label: 'Modify search', href: '/' } */
  action?: { label: string; onClick?: () => void; href?: string };
}) {
  const actionClass =
    'mt-5 inline-flex items-center gap-1.5 rounded-full border border-(--color-links) px-5 py-2 text-sm font-bold text-(--color-links) transition-colors hover:bg-(--color-links) hover:text-white';
  return (
    <div className={`${RESULT_CARD} flex flex-col items-center px-6 py-12 text-center hover:shadow-sm`}>
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-(--color-primary-tint) text-(--color-links)">
        <Icon className="h-7 w-7" />
      </span>
      <h3 className="mt-4 text-lg font-extrabold text-(--color-foreground)">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-(--color-inactive)">{message}</p>
      {action &&
        (action.href ? (
          <Link href={action.href} className={actionClass}>
            {action.label}
          </Link>
        ) : (
          <button type="button" onClick={action.onClick} className={actionClass}>
            {action.label}
          </button>
        ))}
    </div>
  );
}

/** Full-page frame for a loader or empty state on a booking step. */
export function StepState({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-(--color-background)">
      <div className={`${RESULTS_CONTAINER} py-6`}>{children}</div>
    </div>
  );
}
