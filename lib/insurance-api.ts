import { authFetch } from './api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

// ── Types (mirror soul_paradise_backend/src/insurance) ──

export type PolicyType = 'INDIVIDUAL' | 'FAMILY' | 'FRIENDS' | 'STUDENT' | 'ANNUAL MULTITRIP';
export type Relation =
  | 'SELF'
  | 'SPOUSE'
  | 'SON'
  | 'DAUGHTER'
  | 'FATHER'
  | 'MOTHER'
  | 'BROTHER'
  | 'SISTER'
  | 'FRIEND';
export type Title = 'Mr' | 'Mrs' | 'Ms' | 'Master';

export interface PolicyTypeOption {
  value: PolicyType;
  label: string;
  maxTravellers: number;
  relations: Relation[];
}

export interface InsuranceOptions {
  policyTypes: PolicyTypeOption[];
  providers: string[];
  checklist: string[];
}

export interface SearchTraveller {
  birthdate: string; // YYYY-MM-DD
  relation: Relation;
}

/** Everything a search carries from page to page (lives in the URL). */
export interface InsuranceSearch {
  policyType: PolicyType;
  countryCodes: string[];
  countryNames: string[];
  startDate: string;
  endDate: string;
  tenureInMonths: number;
  travellers: SearchTraveller[];
}

export interface Coverage {
  amount: number;
  currency: string;
}

export interface InsuranceQuote {
  planId: string;
  provider: string;
  providerLabel: string;
  providerLogo: string;
  planName: string;
  category: string;
  coverage: Coverage;
  /** All-inclusive INR price. */
  price: number;
  highlights: string[];
  specialHighlights: string[];
  policyWordingURL: string;
  isRecommended: boolean;
  isWithSubLimits: boolean;
  minTripDays: number;
  maxTripDays: number;
}

export interface QuotesResponse {
  tui: string;
  quotes: InsuranceQuote[];
  providers: Array<{ provider: string; label: string; count: number }>;
  coverageBands: Array<{ currency: string; min: number; max: number; count: number }>;
}

export interface PlanQuestion {
  title: string;
  questionCode: string;
  selectionType: string; // "CheckBox" | "TextBox"
  category: string; // "Health" | "Other"
}

export interface InsurancePlan extends Omit<InsuranceQuote, 'category' | 'isRecommended'> {
  planType: string;
  policyType: string;
  travellerPrices: Array<{ travellerRefId: number; relation: string; price: number }>;
  benefits: Array<{ name: string; sumInsured: string; deductible: string }>;
  notes: string[];
  termsAndConditions: string[];
  questions: PlanQuestion[];
  requiresKyc: boolean;
  wantsGstin: boolean;
}

export type KycResult =
  | {
      status: 'VERIFIED';
      address: { line1: string; line2: string; city: string; state: string; pinCode: string };
    }
  | { status: 'ACTION_REQUIRED'; url: string }
  | { status: 'FAILED'; message: string };

export interface BookingTraveller {
  title: Title;
  firstName: string;
  lastName: string;
  birthDate: string;
  relation: Relation;
  passportNumber: string;
  nominee: { firstName: string; lastName: string; relation: string };
  answers: Record<string, string>;
}

export interface BookingRequest extends Omit<InsuranceSearch, 'travellers'> {
  planId: string;
  tui: string;
  expectedAmount: number;
  travellers: BookingTraveller[];
  contact: { email: string; mobile: string };
  address: { line1: string; line2: string; city: string; state: string; pinCode: string };
  pan?: string;
  gstin?: string;
}

export interface BookingStatus {
  bookingId: string;
  transactionId: string | null;
  status: string;
  inProgress: boolean;
  paymentStatus: string;
}

export interface PolicyDetails {
  bookingId: string;
  transactionId: string;
  status: string;
  provider: string;
  planName: string;
  policyType: string;
  destinations: string;
  startDate: string | null;
  endDate: string | null;
  days: number | null;
  coverage: Coverage | null;
  amountPaid: number;
  currency: string;
  policyWordingURL: string;
  documents: Array<{ policyNumber: string | null; url: string; travellerIds: number[] }>;
  contact: { name: string; email: string; mobile: string };
  travellers: Array<{
    name: string;
    dob: string;
    relation: string;
    policyNumber: string;
    passportNumber: string;
    nominee: string;
  }>;
}

/** Thrown when the insurer re-priced the plan between viewing and paying. */
export class PriceChangedError extends Error {
  constructor(message: string, public readonly amount: number) {
    super(message);
    this.name = 'PriceChangedError';
  }
}

// ── Labels shared by the insurance pages ──

export const RELATION_LABELS: Record<Relation, string> = {
  SELF: 'You',
  SPOUSE: 'Spouse',
  SON: 'Son',
  DAUGHTER: 'Daughter',
  FATHER: 'Father',
  MOTHER: 'Mother',
  BROTHER: 'Brother',
  SISTER: 'Sister',
  FRIEND: 'Friend',
};

/** The only destinations Benzy accepts for an Annual Multi-Trip policy. */
export const MULTITRIP_REGIONS = [
  { code: '1A', name: 'Worldwide Including USA and Canada' },
  { code: '2B', name: 'Worldwide Excluding USA and Canada' },
] as const;

export const POLICY_TYPE_LABELS: Record<PolicyType, string> = {
  INDIVIDUAL: 'Individual',
  FAMILY: 'Family',
  FRIENDS: 'Friends',
  STUDENT: 'Student',
  'ANNUAL MULTITRIP': 'Multi-Trip',
};

/** "You", "Spouse", "Friend 2" - numbered only when a relation repeats. */
export function travellerLabel(travellers: Array<{ relation: Relation }>, index: number): string {
  const relation = travellers[index].relation;
  const base = RELATION_LABELS[relation] ?? relation;
  if (travellers.filter((t) => t.relation === relation).length < 2) return base;
  const nth = travellers.slice(0, index + 1).filter((t) => t.relation === relation).length;
  return `${base} ${nth}`;
}

export function formatInr(amount: number): string {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

/** Foreign sums insured use international grouping (USD 100,000, not 1,00,000). */
export function formatCoverage(c: Coverage): string {
  return `${c.currency} ${c.amount.toLocaleString(c.currency === 'INR' ? 'en-IN' : 'en-US')}`;
}

// ── URL <-> search ──

export function searchToParams(s: InsuranceSearch): URLSearchParams {
  return new URLSearchParams({
    policyType: s.policyType,
    countryCodes: s.countryCodes.join(','),
    countryNames: s.countryNames.join('|'),
    startDate: s.startDate,
    endDate: s.endDate,
    tenureInMonths: String(s.tenureInMonths),
    travellers: s.travellers.map((t) => `${t.relation}:${t.birthdate}`).join(','),
  });
}

export function searchFromParams(p: URLSearchParams): InsuranceSearch | null {
  const travellers = (p.get('travellers') || '')
    .split(',')
    .filter(Boolean)
    .map((t) => {
      const [relation, birthdate] = t.split(':');
      return { relation: relation as Relation, birthdate };
    });
  const search: InsuranceSearch = {
    policyType: (p.get('policyType') || 'INDIVIDUAL') as PolicyType,
    countryCodes: (p.get('countryCodes') || '').split(',').filter(Boolean),
    countryNames: (p.get('countryNames') || '').split('|').filter(Boolean),
    startDate: p.get('startDate') || '',
    endDate: p.get('endDate') || '',
    tenureInMonths: Number(p.get('tenureInMonths') || '0'),
    travellers,
  };
  const ok =
    search.countryCodes.length > 0 &&
    search.countryCodes.length === search.countryNames.length &&
    !!search.startDate &&
    !!search.endDate &&
    travellers.length > 0 &&
    travellers.every((t) => t.relation && /^\d{4}-\d{2}-\d{2}$/.test(t.birthdate));
  return ok ? search : null;
}

// ── Calls ──

async function post<T>(path: string, body: unknown, fallback: string): Promise<T> {
  const res = await authFetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await toError(res, fallback);
  return res.json();
}

async function get<T>(path: string, fallback: string): Promise<T> {
  const res = await authFetch(`${API_BASE}${path}`);
  if (!res.ok) throw await toError(res, fallback);
  return res.json();
}

async function toError(res: Response, fallback: string): Promise<Error> {
  const body = await res.json().catch(() => null);
  const msg = body?.message;
  if (res.status === 409 && msg && typeof msg === 'object') {
    return new PriceChangedError(msg.message, msg.amount);
  }
  // Validation errors arrive as an array of "field: message" strings.
  const text = Array.isArray(msg) ? msg.map((m: string) => m.split(': ').pop()).join(' ') : msg;
  return new Error(typeof text === 'string' && text ? text : fallback);
}

export async function getInsuranceOptions(): Promise<InsuranceOptions> {
  const res = await fetch(`${API_BASE}/insurance/options`);
  if (!res.ok) throw await toError(res, 'Could not load insurance options.');
  return res.json();
}

export function getQuotes(search: InsuranceSearch): Promise<QuotesResponse> {
  return post('/insurance/quotes', search, 'Could not fetch insurance plans.');
}

export function getPlanDetails(search: InsuranceSearch, planId: string, tui: string): Promise<InsurancePlan> {
  return post('/insurance/plan-details', { ...search, planId, tui }, 'Could not load this plan.');
}

export function verifyKyc(input: {
  pan: string;
  title: Title;
  firstName: string;
  lastName: string;
  birthDate: string;
  providerName: string;
  tui: string;
}): Promise<KycResult> {
  return post('/insurance/kyc', input, 'KYC verification failed.');
}

export function startInsuranceBooking(
  req: BookingRequest,
): Promise<{ bookingId: string; merchantTxnNo: string; redirectUrl: string; amount: number }> {
  return post('/insurance/book', req, 'Could not start the payment.');
}

export function getInsuranceBookingStatus(merchantTxnNo: string): Promise<BookingStatus> {
  return get(`/insurance/booking-status/${encodeURIComponent(merchantTxnNo)}`, 'Could not check the booking.');
}

export function getPolicyDetails(transactionId: string): Promise<PolicyDetails> {
  return get(`/insurance/booking/${encodeURIComponent(transactionId)}`, 'Could not load this policy.');
}
