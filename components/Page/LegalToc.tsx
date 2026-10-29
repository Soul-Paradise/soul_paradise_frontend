'use client';

import { useEffect, useState } from 'react';

/** Navbar height plus breathing room: a section counts as "current" once its top passes this line. */
const ACTIVATION_LINE = 120;

/** "On this page" list that highlights the section currently being read. */
export function LegalToc({ items }: { items: { id: string; number: number; title: string }[] }) {
  const [active, setActive] = useState(items[0]?.id);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      // The last section whose top has scrolled past the line; the first one
      // when nothing has yet (top of page).
      let current = items[0]?.id;
      for (const { id } of items) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= ACTIVATION_LINE) current = id;
      }
      // At the very bottom, short last sections never reach the line.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
        current = items[items.length - 1]?.id;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [items]);

  return (
    <ol className="space-y-0.5">
      {items.map(({ id, number, title }) => {
        const isActive = active === id;
        return (
          <li key={id}>
            <a
              href={`#${id}`}
              aria-current={isActive ? 'location' : undefined}
              className={`flex items-start gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition ${
                isActive
                  ? 'bg-(--color-links)/10 font-semibold text-(--color-links)'
                  : 'text-(--color-inactive) hover:bg-(--color-background) hover:text-(--color-foreground)'
              }`}
            >
              <span className={`mt-px w-5 shrink-0 text-xs font-bold ${isActive ? '' : 'text-(--color-tertiary-button)'}`}>
                {String(number).padStart(2, '0')}
              </span>
              <span className="leading-snug">{title}</span>
            </a>
          </li>
        );
      })}
    </ol>
  );
}
