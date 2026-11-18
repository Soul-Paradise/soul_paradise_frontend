'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  compactQuery,
  fetchResultPage,
  ResultsExpiredError,
  type QueryParams,
  type ResultKind,
  type ResultPage,
} from './results-api';

interface Options<T, F> {
  kind: ResultKind;
  /** Page 1 as returned by the search call (null until the search finishes). */
  initial: ResultPage<T, F> | null;
  /** Filters + sort, with defaults left out. Changing it goes back to page 1. */
  query: QueryParams;
  /** Stored results expired - the page should re-run the search. */
  onExpired: () => void;
  /** Extra fixed params for every request (e.g. { leg: 'return' }). */
  fixed?: QueryParams;
  /** false = don't fetch (e.g. the map list while the map is closed). */
  enabled?: boolean;
  /**
   * false = `initial` is only a placeholder (it doesn't answer `fixed`, e.g. a
   * list page seeding the map view), so the first page is fetched too.
   */
  initialAnswers?: boolean;
}

interface State<T, F> {
  initial: ResultPage<T, F> | null;
  data: ResultPage<T, F> | null;
  page: number;
  queryKey: string;
  fixedKey: string;
}

const DEBOUNCE_MS = 250;
const NO_FILTERS = '{}';

/**
 * Server-side filter / sort / page state for one result list - shared by the
 * flight, hotel and insurance result pages. Filter changes are debounced and
 * stale requests are aborted; the current list stays on screen while the next
 * page loads (no page reload).
 */
export function useResultPage<T, F>({
  kind,
  initial,
  query,
  onExpired,
  fixed,
  enabled = true,
  initialAnswers = true,
}: Options<T, F>) {
  const queryKey = JSON.stringify(compactQuery(query));
  const fixedKey = JSON.stringify(compactQuery(fixed ?? {}));

  const [state, setState] = useState<State<T, F>>({ initial, data: initial, page: 1, queryKey, fixedKey });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Derived resets (during render, per React's "adjust state on prop change"):
  // a new search starts at its own page 1; new filters go back to page 1.
  let current = state;
  if (state.initial !== initial || state.fixedKey !== fixedKey) {
    current = { initial, data: initial, page: 1, queryKey, fixedKey };
    setState(current);
  } else if (state.queryKey !== queryKey) {
    current = { ...state, page: 1, queryKey };
    setState(current);
  }
  const { data, page } = current;
  const resultId = initial?.resultId ?? '';

  const expiredRef = useRef(onExpired);
  useEffect(() => {
    expiredRef.current = onExpired;
  }, [onExpired]);

  // What `data` currently answers - so the search's own page 1 isn't refetched.
  const answered = useRef('');
  useEffect(() => {
    answered.current =
      initial && initialAnswers ? JSON.stringify([initial.resultId, NO_FILTERS, fixedKey, 1]) : '';
  }, [initial, fixedKey, initialAnswers]);

  // Only the newest request may clear the loading state (an aborted one with no
  // successor clears it too, so the spinner never sticks).
  const latest = useRef(0);

  useEffect(() => {
    if (!resultId || !enabled) return;
    const requestKey = JSON.stringify([resultId, queryKey, fixedKey, page]);
    if (requestKey === answered.current) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const id = ++latest.current;
      setLoading(true);
      setError('');
      try {
        const next = await fetchResultPage<T, F>(
          kind,
          resultId,
          { ...JSON.parse(fixedKey), ...JSON.parse(queryKey), page },
          controller.signal,
        );
        answered.current = JSON.stringify([resultId, queryKey, fixedKey, next.page]);
        setState((s) => ({ ...s, data: next, page: next.page }));
      } catch (e) {
        if (controller.signal.aborted) return;
        if (e instanceof ResultsExpiredError) {
          expiredRef.current();
          return;
        }
        setError(e instanceof Error ? e.message : 'Could not load results.');
      } finally {
        if (id === latest.current) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [kind, resultId, queryKey, fixedKey, page, enabled]);

  const setPage = useCallback((p: number) => setState((s) => ({ ...s, page: Math.max(1, p) })), []);

  return { data, page, setPage, loading, error };
}
