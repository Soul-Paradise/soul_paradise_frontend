/**
 * Upcoming holidays and the long weekends they make possible.
 *
 * HOLIDAYS is the only thing to maintain: add next year's dates once the
 * central government (DoPT) and Punjab holiday lists are published. Fixed-date
 * holidays never move; festival dates follow the lunar calendar and shift every
 * year, so check those against the official list. Weekdays are always computed.
 */

export interface Holiday {
  /** YYYY-MM-DD */
  date: string;
  name: string;
}

export const HOLIDAYS: Holiday[] = [
  { date: '2026-11-08', name: 'Diwali' },
  { date: '2026-11-24', name: 'Guru Nanak Jayanti' },
  { date: '2026-12-25', name: 'Christmas' },
  { date: '2027-01-01', name: 'New Year' },
  { date: '2027-01-13', name: 'Lohri' },
  { date: '2027-01-26', name: 'Republic Day' },
  { date: '2027-03-22', name: 'Holi' },
  { date: '2027-03-26', name: 'Good Friday' },
  { date: '2027-04-14', name: 'Baisakhi' },
  { date: '2027-08-15', name: 'Independence Day' },
  { date: '2027-10-02', name: 'Gandhi Jayanti' },
  { date: '2027-10-29', name: 'Diwali' },
];

export interface LongWeekend {
  holiday: Holiday;
  /** First and last day off, YYYY-MM-DD (inclusive). */
  start: string;
  end: string;
  days: number;
  /** Working days to take off to get the whole window. */
  leaveDates: string[];
}

const MAX_LEAVES = 2;
/** Below this, a window isn't worth suggesting as a getaway. */
const MIN_DAYS = 3;

// All date math is done on UTC midnights of 'YYYY-MM-DD' strings so the
// viewer's timezone can never shift a day.
const toUtc = (d: string) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10));
const fromUtc = (ms: number) => new Date(ms).toISOString().slice(0, 10);
export const addDays = (d: string, n: number) => fromUtc(toUtc(d) + n * 86_400_000);
const weekday = (d: string) => new Date(toUtc(d)).getUTCDay();

export function todayStr(now = new Date()): string {
  // Local calendar date (what the visitor thinks "today" is).
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * The best way to turn a holiday into a trip: either the days already off
 * around it, or the fewest leave days (at most MAX_LEAVES) that bridge it to a
 * weekend for a 4+ day break. Returns null when neither makes a getaway.
 */
export function planLongWeekend(holiday: Holiday, holidays: Holiday[] = HOLIDAYS): LongWeekend | null {
  const holidaySet = new Set(holidays.map((h) => h.date));
  const isOff = (d: string) => weekday(d) === 0 || weekday(d) === 6 || holidaySet.has(d);

  // Extend from `d` in `dir` by `leaves` working days, then swallow any days
  // already off beyond them.
  const reach = (d: string, dir: 1 | -1, leaves: number) => {
    const taken: string[] = [];
    let edge = d;
    for (;;) {
      const next = addDays(edge, dir);
      if (isOff(next)) edge = next;
      else if (taken.length < leaves) {
        taken.push(next);
        edge = next;
      } else return { edge, taken };
    }
  };

  for (let leaves = 0; leaves <= MAX_LEAVES; leaves++) {
    // Longest window for this many leave days, trying every left/right split.
    let best: LongWeekend | null = null;
    for (let left = 0; left <= leaves; left++) {
      const l = reach(holiday.date, -1, left);
      const r = reach(holiday.date, 1, leaves - left);
      const days = (toUtc(r.edge) - toUtc(l.edge)) / 86_400_000 + 1;
      if (!best || days > best.days) {
        best = { holiday, start: l.edge, end: r.edge, days, leaveDates: [...l.taken, ...r.taken].sort() };
      }
    }
    if (!best) continue;
    // Already a break with no leave needed.
    if (leaves === 0 && best.days >= MIN_DAYS) return best;
    // Worth the leave only if it joins the holiday to a full weekend:
    // holiday + Sat + Sun + the leave days (Tue holiday: 1 leave -> 4 days;
    // Wed holiday: 2 leaves -> 5 days). Rules out "take 2, get 3".
    if (leaves > 0 && best.days >= leaves + 3) return best;
  }
  return null;
}

/** Upcoming long weekends, soonest first, one per break. */
export function upcomingLongWeekends(today = todayStr(), limit = 4): LongWeekend[] {
  const seen = new Set<string>();
  const result: LongWeekend[] = [];
  for (const h of [...HOLIDAYS].sort((a, b) => a.date.localeCompare(b.date))) {
    const plan = planLongWeekend(h);
    // Needs to still be bookable: the break hasn't started yet.
    if (!plan || plan.start <= today || seen.has(plan.start)) continue;
    seen.add(plan.start);
    result.push(plan);
    if (result.length === limit) break;
  }
  return result;
}

export function daysUntil(date: string, today = todayStr()): number {
  return Math.round((toUtc(date) - toUtc(today)) / 86_400_000);
}

const fmt = (d: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(toUtc(d)).toLocaleDateString('en-IN', { timeZone: 'UTC', ...opts });

/** "Sat 7 Nov" */
export const shortDate = (d: string) => fmt(d, { weekday: 'short', day: 'numeric', month: 'short' });
/** "Nov" */
export const monthName = (d: string) => fmt(d, { month: 'short' });
/** "Mon" */
export const dayName = (d: string) => fmt(d, { weekday: 'short' });
