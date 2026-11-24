'use client';

import { useCallback, useId, useLayoutEffect, useRef, useSyncExternalStore } from 'react';

/**
 * Site-wide accordion rule: within a group, only ONE panel is open at a time;
 * opening a panel closes the others. Every expandable panel (an accordion,
 * a "+ Details" card panel, a collapsible filter section) uses this hook.
 *
 * Groups are named so unrelated panels don't close each other: opening a
 * filter section doesn't collapse an open flight card. Siblings share a name:
 *
 *   const [open, setOpen] = useAccordion('flight-results');
 *   <button aria-expanded={open} onClick={() => setOpen(!open)}>…</button>
 *   {open && <Panel />}
 *
 * At most one item per group should pass defaultOpen (the first to mount wins).
 * "Read more" / "Show more (n)" toggles that only lengthen a list are not
 * accordions and keep their own state.
 */

class GroupStore {
  open: string | null = null;
  private listeners = new Set<() => void>();
  subscribe = (l: () => void) => {
    this.listeners.add(l);
    return () => {
      this.listeners.delete(l);
    };
  };
  get = () => this.open;
  set(id: string | null) {
    if (this.open === id) return;
    this.open = id;
    this.listeners.forEach((l) => l());
  }
}

const groups = new Map<string, GroupStore>();
function groupStore(name: string): GroupStore {
  let g = groups.get(name);
  if (!g) {
    g = new GroupStore();
    groups.set(name, g);
  }
  return g;
}

export function useAccordion(
  group: string,
  defaultOpen = false,
): [boolean, (open: boolean) => void] {
  const store = groupStore(group);
  const id = useId();
  // Set once the user toggles it: a default no longer applies (StrictMode remounts).
  const touched = useRef(false);

  const openId = useSyncExternalStore(
    store.subscribe,
    store.get,
    // Server render: default-open panels render open (the stores are
    // module-level, shared by every request, so they are never written there).
    () => (defaultOpen ? id : null),
  );

  // Layout effect: claims the group before the first paint, so a default-open
  // panel doesn't flash shut.
  useLayoutEffect(() => {
    if (defaultOpen && !touched.current && store.open === null) store.set(id);
    return () => {
      // An unmounted panel must not keep the group "occupied".
      if (store.open === id) store.set(null);
    };
  }, [store, id, defaultOpen]);

  const setOpen = useCallback(
    (open: boolean) => {
      touched.current = true;
      if (open) store.set(id);
      else if (store.open === id) store.set(null);
    },
    [store, id],
  );

  return [openId === id, setOpen];
}
