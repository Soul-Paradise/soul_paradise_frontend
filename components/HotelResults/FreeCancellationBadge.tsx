/**
 * Free-cancellation deadline display.
 *
 * Benzy never returns a "free until" field — the backend derives it from the
 * room's cancellation policy (see hotels/cancellation-deadline.ts) and hands it
 * over as `freeCancellationUntil`, an ISO 8601 instant carrying an explicit
 * +05:30 offset.
 */

// Render in IST regardless of the viewer's timezone: the hotel states its
// policy in IST, so a locally-shifted date would contradict the policy text
// shown alongside it.
const IST = 'Asia/Kolkata';

export function formatDeadline(iso: string, withTime = false): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const date = d.toLocaleDateString('en-IN', {
    timeZone: IST,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  if (!withTime) return date;
  const time = d.toLocaleTimeString('en-IN', {
    timeZone: IST,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${date}, ${time} IST`;
}

// Suppliers use IST midnight to mean "end of the previous day", so the clock
// time carries no information there and is left out of the badge.
export function isMidnightIST(iso: string): boolean {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  return (
    d.toLocaleTimeString('en-GB', {
      timeZone: IST,
      hour: '2-digit',
      minute: '2-digit',
    }) === '00:00'
  );
}

function toPlainText(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw
    .replace(/<\\?\/?br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .join('\n');
}

/**
 * "Free Cancellation until <date>" chip. Degrades to a plain "Free
 * Cancellation" chip when the supplier gave no parseable deadline, so the badge
 * never shows less than it did before.
 */
export default function FreeCancellationBadge({
  until,
  policyText,
}: {
  until: string | null | undefined;
  policyText?: string | null;
}) {
  if (!until) {
    return (
      <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded">
        Free Cancellation
      </span>
    );
  }

  const withTime = !isMidnightIST(until);
  const tooltip = [
    `Cancel free of charge until ${formatDeadline(until, true)}.`,
    toPlainText(policyText),
  ]
    .filter(Boolean)
    .join('\n\n');

  return (
    <span
      title={tooltip}
      className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded"
    >
      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3M3 11h18M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 15l2 2 4-4" />
      </svg>
      <span className="font-medium">
        Free Cancellation until {formatDeadline(until, withTime)}
      </span>
      <svg className="w-3 h-3 flex-shrink-0 opacity-70" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    </span>
  );
}
