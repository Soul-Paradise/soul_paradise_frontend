import { authFetch } from './api';

/**
 * Shared server-side paging for flight, hotel and insurance results.
 *
 * A search returns page 1 plus a `resultId`; every filter / sort / page change
 * asks the backend for that page of the stored results. The browser never
 * holds - or filters - the full result list.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export type ResultKind = 'flights' | 'hotels' | 'insurance';

export interface PageMeta {
  page: number;
  pageSize: number;
  /** Items matching the current filters. */
  total: number;
  totalPages: number;
  /** Items in the whole search before filtering. */
  totalAll: number;
}

export interface ResultPage<T, F> extends PageMeta {
  resultId: string;
  items: T[];
  facets: F;
}

/** The stored results expired (or belong to another session): search again. */
export class ResultsExpiredError extends Error {
  constructor(message = 'These search results have expired.') {
    super(message);
    this.name = 'ResultsExpiredError';
  }
}

export type QueryValue = string | number | boolean | null | undefined | Array<string | number>;
export type QueryParams = Record<string, QueryValue>;

const isEmpty = (v: QueryValue) =>
  v === undefined || v === null || v === false || v === '' || (Array.isArray(v) && v.length === 0);

/** Drops empty values, so "no filters" is always `{}` (stable cache key). */
export function compactQuery(params: QueryParams): QueryParams {
  const out: QueryParams = {};
  for (const key of Object.keys(params).sort()) {
    const v = params[key];
    if (!isEmpty(v)) out[key] = Array.isArray(v) ? [...v].map(String).sort() : v;
  }
  return out;
}

/** Arrays become repeated params (never comma-joined); empty / false / null are left out. */
export function toQueryString(params: QueryParams): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === false || value === '') continue;
    if (Array.isArray(value)) value.forEach((v) => qs.append(key, String(v)));
    else qs.append(key, String(value));
  }
  return qs.toString();
}

export async function fetchResultPage<T, F>(
  kind: ResultKind,
  resultId: string,
  params: QueryParams,
  signal?: AbortSignal,
): Promise<ResultPage<T, F>> {
  const qs = toQueryString(params);
  const res = await authFetch(`${API_BASE}/${kind}/results/${encodeURIComponent(resultId)}${qs ? `?${qs}` : ''}`, { signal });
  if (res.status === 410) throw new ResultsExpiredError();
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || 'Could not load results. Please try again.');
  }
  return res.json();
}
