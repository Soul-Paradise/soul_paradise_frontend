import { FlaskConical } from 'lucide-react';
import { IS_STAGING } from '@/lib/app-env';

/**
 * Slim strip pinned to the top of every page on the staging site. Its height
 * is reserved through --staging-h (set on <html> in app/layout.tsx, 0px
 * otherwise), which the body padding, the fixed navbar and the sticky bars
 * offset themselves by, so it never covers the nav.
 */
export default function StagingBanner() {
  if (!IS_STAGING) return null;
  return (
    <div
      role="region"
      aria-label="Environment notice"
      className="fixed inset-x-0 top-0 z-[60] flex h-(--staging-h) items-center justify-center gap-1.5 bg-(--color-warn) px-4 text-xs font-semibold text-(--color-ink) shadow-sm"
    >
      <FlaskConical className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} aria-hidden="true" />
      <p className="truncate">
        <strong className="font-extrabold">STAGING</strong> — test site. No real bookings or payments.
      </p>
    </div>
  );
}
