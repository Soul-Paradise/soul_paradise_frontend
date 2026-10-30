import { useMemo, useSyncExternalStore } from 'react';

/**
 * Remembers how the user last signed in on this browser so the login page can
 * mark that option "Last used" (the GitHub / Vercel pattern). Device-local on
 * purpose: it is a hint for this browser, not account data, and it survives
 * logout. Storage can be unavailable (private mode, blocked site data), so
 * every access is best-effort.
 */
export type LoginMethod = 'google' | 'email';

export interface LastLogin {
  method: LoginMethod;
  /** Pre-fills the email form; only kept for the email method. */
  email?: string;
  at: string;
}

const KEY = 'sp:lastLogin';
/** Same-tab change signal (the `storage` event only fires in other tabs). */
const CHANGE_EVENT = 'sp:lastLogin:change';

function write(value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, value);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // Storage blocked - the hint is optional.
  }
}

export function rememberLogin(method: LoginMethod, email?: string): void {
  const value: LastLogin = { method, at: new Date().toISOString() };
  if (method === 'email' && email) value.email = email;
  write(JSON.stringify(value));
}

export function forgetLastLogin(): void {
  write(null);
}

function parse(raw: string | null): LastLogin | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as LastLogin;
    return value.method === 'google' || value.method === 'email' ? value : null;
  } catch {
    return null;
  }
}

function readRaw(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener('storage', onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

/**
 * The last sign-in on this browser, or null. Null during server render and the
 * first client render, so the markup always hydrates cleanly.
 */
export function useLastLogin(): LastLogin | null {
  const raw = useSyncExternalStore(subscribe, readRaw, () => null);
  return useMemo(() => parse(raw), [raw]);
}
