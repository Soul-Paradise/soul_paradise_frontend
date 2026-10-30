'use client';

import { ArrowRight, type LucideIcon } from 'lucide-react';

/**
 * Shared look for the booking widget's tabs (Flights, Hotels, Insurance,
 * Custom Payment). Every tab is built from these pieces so they stay
 * identical: a header row, one bordered group of fields, and an action row.
 */

/** The bordered container holding a tab's fields. */
export const FIELD_GROUP = 'relative rounded-2xl border border-gray-200 bg-white overflow-visible';

/**
 * Padding, height and hover/active tint for one clickable field. A top-aligned
 * column, because a <button> otherwise centres its content vertically and the
 * fields in one row would sit at different heights.
 */
export const fieldCell = (active = false) =>
  `flex flex-col justify-start text-left px-5 py-4 min-h-[88px] transition-colors ${active ? 'bg-blue-50/70' : 'hover:bg-slate-50'}`;

/** Main value line (a city, a destination, a count). */
export const FIELD_VALUE = 'text-xl font-extrabold leading-tight text-gray-900';
/** Same line when nothing is chosen yet. */
export const FIELD_PLACEHOLDER = 'text-xl font-bold leading-tight text-gray-400';
/** Small grey line under the value. */
export const FIELD_SUB = 'mt-1 truncate text-xs text-gray-500';

/** Small uppercase label with an icon, above a field's value. */
export function FieldLabel({
  icon: Icon,
  active = false,
  children,
}: {
  icon?: LucideIcon;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] ${
        active ? 'text-(--color-links)' : 'text-gray-500'
      }`}
    >
      {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
      {children}
    </div>
  );
}

/** "29 Oct'26 / Thursday" - the same date rendering in every tab. */
export function DateValue({ day, monthYear, weekday }: { day: string | number; monthYear: string; weekday?: string }) {
  return (
    <>
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-extrabold leading-none text-gray-900">{day}</span>
        <span className="text-sm font-bold text-gray-700">{monthYear}</span>
      </div>
      {weekday && <div className={FIELD_SUB}>{weekday}</div>}
    </>
  );
}

/**
 * Segmented pill switch (trip type, policy type). Real radio inputs, visually
 * hidden, so keyboard and screen-reader behaviour stay native.
 */
export function OptionPills<T extends string>({
  name,
  label,
  options,
  value,
  onChange,
}: {
  name: string;
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex max-w-full flex-wrap gap-1 rounded-full bg-slate-100 p-1">
      {options.map((opt) => {
        const checked = value === opt.value;
        return (
          <label
            key={opt.value}
            className={`cursor-pointer rounded-full px-4 py-1.5 text-sm font-semibold transition-all has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-(--color-links)/40 ${
              checked
                ? 'bg-white text-(--color-links) shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={checked}
              onChange={() => onChange(opt.value)}
              className="sr-only"
            />
            {opt.label}
          </label>
        );
      })}
    </div>
  );
}

/**
 * Top row of every tab: options on the left (if the tab has any) and a short
 * tagline. Without options the tagline sits on the left, same style.
 */
export function TabHeader({ tagline, children }: { tagline: string; children?: React.ReactNode }) {
  return (
    <div className="flex min-h-10 flex-wrap items-center justify-between gap-3">
      {children}
      <span className={`text-sm font-medium text-gray-500 ${children ? 'hidden sm:block' : ''}`}>{tagline}</span>
    </div>
  );
}

/** The one primary action button used by every tab. */
export function ActionButton({
  children,
  type = 'button',
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  type?: 'button' | 'submit';
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="group inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-gradient-to-r from-(--color-accent-light) to-(--color-accent) px-9 py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-orange-500/30 transition-all hover:-translate-y-0.5 hover:from-(--color-accent) hover:to-(--color-accent-hover) hover:shadow-xl hover:shadow-orange-500/35 disabled:translate-y-0 disabled:opacity-70"
    >
      {children}
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}

/** Bottom row: optional secondary content on the left, action on the right. */
export function ActionRow({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center justify-end gap-4">{children}</div>;
}
