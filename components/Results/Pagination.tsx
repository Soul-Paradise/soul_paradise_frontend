'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  /** Items matching the current filters. */
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  /** "flights", "hotels", "plans" */
  noun: string;
  /** Element to scroll back to after a page change (defaults to the top). */
  scrollTargetId?: string;
  disabled?: boolean;
}

/** 1 … 4 5 [6] 7 8 … 20 */
function pageList(page: number, totalPages: number): Array<number | 'gap'> {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((p) => pages.add(p));
  if (page >= totalPages - 2) [totalPages - 3, totalPages - 2, totalPages - 1].forEach((p) => pages.add(p));
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const out: Array<number | 'gap'> = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push('gap');
    out.push(p);
  });
  return out;
}

const btn =
  'inline-flex h-9 min-w-9 items-center justify-center rounded-full px-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40';

/**
 * Shared result pagination for flights, hotels and insurance. Pages are fetched
 * from the backend - this only reports which page the user wants.
 */
export function Pagination({ page, totalPages, total, pageSize, onPageChange, noun, scrollTargetId, disabled }: PaginationProps) {
  if (total <= 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const go = (p: number) => {
    if (p < 1 || p > totalPages || p === page) return;
    onPageChange(p);
    const target = scrollTargetId ? document.getElementById(scrollTargetId) : null;
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav aria-label={`${noun} pages`} className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
      <p className="text-sm text-(--color-inactive)">
        Showing <span className="font-bold text-(--color-foreground)">{from}–{to}</span> of{' '}
        <span className="font-bold text-(--color-foreground)">{total}</span> {noun}
      </p>
      {totalPages > 1 && (
        <div className="flex items-center gap-1 rounded-full border border-(--color-tertiary-button) bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => go(page - 1)}
            disabled={disabled || page <= 1}
            aria-label="Previous page"
            className={`${btn} text-(--color-links) hover:bg-(--color-primary-tint)`}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Prev</span>
          </button>
          {pageList(page, totalPages).map((p, i) =>
            p === 'gap' ? (
              <span key={`gap-${i}`} className="px-1 text-sm text-(--color-inactive)" aria-hidden="true">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => go(p)}
                disabled={disabled}
                aria-label={`Page ${p}`}
                aria-current={p === page ? 'page' : undefined}
                className={`${btn} ${
                  p === page
                    ? 'bg-(--color-links) text-white shadow-sm'
                    : 'text-(--color-foreground) hover:bg-(--color-primary-tint) hover:text-(--color-links)'
                }`}
              >
                {p}
              </button>
            ),
          )}
          <button
            type="button"
            onClick={() => go(page + 1)}
            disabled={disabled || page >= totalPages}
            aria-label="Next page"
            className={`${btn} text-(--color-links) hover:bg-(--color-primary-tint)`}
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}
    </nav>
  );
}

/** Dims the list while the next page loads, without unmounting it. */
export function ResultsBusy({ busy, children, id }: { busy: boolean; children: React.ReactNode; id?: string }) {
  return (
    <div id={id} aria-busy={busy} className={`scroll-mt-40 transition-opacity ${busy ? 'pointer-events-none opacity-50' : ''}`}>
      {children}
    </div>
  );
}
