'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import {
  fetchPreferences,
  PREFERENCE_DEFAULTS,
  savePreferences,
  type PreferenceKey,
  type Preferences,
} from '@/lib/preferences';

interface PreferencesContextType {
  prefs: Preferences;
  /** The signed-in user's saved choices have loaded (always true when signed out). */
  ready: boolean;
  setPreference: <K extends PreferenceKey>(key: K, value: Preferences[K]) => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

/**
 * Loads the signed-in user's saved preferences whenever they sign in (on any
 * device) and saves changes back to the server. Signed-out visitors get the
 * defaults; their changes last only for the visit.
 */
export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const userId = user?.id ?? null;

  const [prefs, setPrefs] = useState<Preferences>(PREFERENCE_DEFAULTS);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  // Saves in flight - a background refresh must not overwrite them.
  const pending = useRef(0);

  // Different user (or signed out): start from the defaults again.
  const [prefsUser, setPrefsUser] = useState<string | null>(userId);
  if (prefsUser !== userId) {
    setPrefsUser(userId);
    setPrefs(PREFERENCE_DEFAULTS);
    setLoadedFor(null);
  }

  const load = useCallback(
    async (id: string, signal?: AbortSignal) => {
      try {
        const next = await fetchPreferences(signal);
        if (signal?.aborted || pending.current > 0) return;
        setPrefs(next);
      } catch (e) {
        if (signal?.aborted) return;
        console.warn('Could not load preferences:', e instanceof Error ? e.message : e);
      } finally {
        if (!signal?.aborted) setLoadedFor(id);
      }
    },
    [],
  );

  useEffect(() => {
    if (!userId) return;
    const controller = new AbortController();
    void load(userId, controller.signal);
    return () => controller.abort();
  }, [userId, load]);

  // Coming back to the tab picks up choices made on another device meanwhile.
  useEffect(() => {
    if (!userId) return;
    const onVisible = () => {
      if (document.visibilityState === 'visible') void load(userId);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [userId, load]);

  const setPreference = useCallback(
    <K extends PreferenceKey>(key: K, value: Preferences[K]) => {
      let previous: Preferences[K] | undefined;
      setPrefs((p) => {
        previous = p[key];
        return { ...p, [key]: value };
      });
      if (!userId) return;
      pending.current += 1;
      savePreferences({ [key]: value } as Partial<Preferences>)
        .catch((e) => {
          console.warn('Could not save preference:', e instanceof Error ? e.message : e);
          // Put the old value back unless the user has changed it again since.
          setPrefs((p) => (p[key] === value && previous !== undefined ? { ...p, [key]: previous } : p));
        })
        .finally(() => {
          pending.current -= 1;
        });
    },
    [userId],
  );

  const ready = !authLoading && (!userId || loadedFor === userId);
  const value = useMemo(() => ({ prefs, ready, setPreference }), [prefs, ready, setPreference]);
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesContextType {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences must be used within a PreferencesProvider');
  return ctx;
}

/**
 * "Results per page" for one product's result list. `pageSize` stays
 * undefined until the user's saved choice has loaded, so the list keeps the
 * page the search returned (the server already used the saved choice).
 */
export function useResultPageSize(kind: 'flights' | 'hotels' | 'insurance') {
  const { prefs, ready, setPreference } = usePreferences();
  const key = `results.pageSize.${kind}` as const;
  const setPageSize = useCallback((n: number) => setPreference(key, n), [setPreference, key]);
  return { pageSize: ready ? prefs[key] : undefined, setPageSize };
}
