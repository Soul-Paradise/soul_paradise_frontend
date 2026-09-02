import { authFetch } from './api';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

// ========== Types ==========

export interface Airport {
  code: string;
  name: string;
  cityName: string;
  country: string;
  cityCode: string;
  type: string;
  logoPath: string;
}

export interface FlightConnection {
  airport: string;
  airportName: string;
  duration: string;
  type: string;
}

export interface FlightResult {
  index: string;
  provider: string;
  airlineName: string;
  airlineCode: string;
  flightNo: string;
  from: string;
  to: string;
  fromName: string;
  toName: string;
  departureTime: string;
  arrivalTime: string;
  departureTerminal: string;
  arrivalTerminal: string;
  duration: string;
  stops: number;
  connections: FlightConnection[];
  cabin: string;
  refundable: boolean;
  grossFare: number;
  netFare: number;
  currency: string;
  baggage: string | null;
  amenities: string;
  seats: number;
  fareClass: string;
  fareType: string;
  // Fare identity — what the airline's rules attach to.
  rbd?: string; // reservation booking class letter
  fareBasisCode?: string; // Benzy FBC
  fareHead?: string; // Benzy FCType, e.g. "PUBLISHED"
  fareGroup?: string; // Benzy FCGroup
  promo?: string;
  alliances?: string;
  hold?: boolean; // fare can be held before payment
  holdInfo?: string; // raw Benzy HoldInfo, e.g. "E|01:00|1.00|SE|EE"
  recommended: boolean;
  aircraft: string;
  mealsIncluded?: string | null;
  pieceDescription?: string | null;
  notice?: string; // per-flight travel/visa advisory
  noticeLink?: string; // source link backing the advisory
  isBusStation?: boolean; // surface/bus segment
}

export interface FlightSearchResponse {
  tui: string;
  completed: boolean;
  currency: string;
  flights: FlightResult[];
  returnFlights?: FlightResult[];
  notices: Array<{ notice: string; link: string }>;
  totalResults: number;
}

export interface FlightSearchParams {
  from: string;
  to: string;
  departDate: string;
  returnDate?: string;
  adults: number;
  children: number;
  infants: number;
  cabin: 'E' | 'PE' | 'B' | 'F';
  tripType: 'oneway' | 'roundtrip';
  directOnly: boolean;
  refundableOnly: boolean;
  nearbyAirports: boolean;
}

// ========== Multi-City Types ==========

export interface MultiCitySegmentInput {
  from: string;
  to: string;
  departDate: string;
}

export interface MultiCitySearchParams {
  segments: MultiCitySegmentInput[];
  adults: number;
  children: number;
  infants: number;
  cabin: 'E' | 'PE' | 'B' | 'F';
  directOnly: boolean;
  refundableOnly: boolean;
  nearbyAirports: boolean;
}

export interface MultiCityLeg {
  legIndex: number;
  from: string;
  to: string;
  fromName: string;
  toName: string;
  departDate: string;
  // The search-session TUI this leg belongs to (DM: unique per leg; IM: shared).
  // Echoed back per-leg at pricing time.
  tui: string;
  flights: FlightResult[];
}

export interface MultiCitySearchResponse {
  tui: string;
  // Benzy multi-city FareType used ('DM' domestic / 'IM' international);
  // echoed back at pricing time as the SmartPricer TripType.
  tripType: 'DM' | 'IM';
  completed: boolean;
  currency: string;
  legs: MultiCityLeg[];
  notices: Array<{ notice: string; link: string }>;
  totalResults: number;
}

/** One selected leg for multi-city pricing (its own search TUI + selection). */
export interface MultiCityPriceLeg {
  tui: string;
  flightIndex: string;
  netFare: number;
}

// ========== Pricing & Booking Types ==========

export interface SegmentDetail {
  fuid: number;
  flightNo: string;
  airline: string;
  airlineCode: string;
  from: string;
  to: string;
  fromName: string;
  toName: string;
  departureTime: string;
  arrivalTime: string;
  departureTerminal: string;
  arrivalTerminal: string;
  duration: string;
  aircraft: string;
  cabin: string;
  fareClass: string;
  rbd?: string;
  stops: number;
  baggage?: string | null;
  mealsIncluded?: string | null;
  pieceDescription?: string | null;
  refundable?: string;
  amenities?: string;
  equipmentType?: string;
  seatsAvailable?: number;
  hops?: Array<{
    arrivalCode: string;
    arrivalName: string;
    arrivalTime: string;
    departureTime: string;
    duration: string;
  }>;
  direction?: 'ONWARD' | 'RETURN';
  // Zero-based index of the leg/journey this segment belongs to. Used to group
  // segments per hop for multi-city itineraries.
  legIndex?: number;
}

export interface FareBreakdownItem {
  label: string;
  adultAmount: number;
  childAmount: number;
  infantAmount: number;
  currency: string;
}

/**
 * Benzy penalty amounts are not always numeric — "Non Refundable" is a valid
 * value and must reach the customer verbatim. `null` means the airline defined
 * no amount for that pax type, which is NOT the same as a zero-rupee fee.
 */
export type FareRuleAmount = number | string | null;

export interface FareRuleCharge {
  description: string;
  adultAmount: FareRuleAmount;
  childAmount: FareRuleAmount;
  infantAmount: FareRuleAmount;
  currency?: string;
}

export interface FareRule {
  category: string;
  charges: FareRuleCharge[];
  sector?: string; // which O&D/leg the rule applies to
  text?: string | null; // free-text narrative of the fare rule
}

export interface SSROption {
  id: number;
  code: string;
  description: string;
  charge: number; // tax-inclusive: supplier VAT is already folded in
  type: 'baggage' | 'meal' | 'priority' | 'seat' | 'sports' | 'fastForward' | 'other';
  mealImage?: string;
  pieceDescription?: string | null;
  isFreeMeal?: boolean;
  multiSelect?: boolean;
  fuid: number;
}

export interface SeatInfo {
  ssid: number;
  seatNumber: string;
  seatInfo: string;
  seatType: string;
  available: boolean;
  fare: number; // tax-inclusive: seat tax is already folded in
  x: number;
  y: number;
  height?: number;
  width?: number;
  seatGroup: string;
}

export interface SegmentSeatMap {
  fuid: number;
  flightNo: string;
  airlineName: string;
  seats: SeatInfo[];
  maxX: number;
  maxY: number;
}

export interface TravelChecklist {
  nationality: boolean;
  visaType: boolean;
  passportNo: boolean;
  dob: boolean;
  passportExpiry: boolean;
  passportPlaceOfIssue: boolean;
  passportDateOfIssue: boolean;
  panNo: boolean;
  emigrationCheck: boolean;
}

export interface FreeSSR {
  fuid: number;
  ssrId: number;
  ptc: string;
}

export interface FnuLnuSetting {
  airlineCode: string;
  titleMandatory: boolean;
  fnuMessage: string;
  lnuMessage: string;
}

export interface BookingRequirements {
  baggageMandatory: boolean;
  gstMandatory: boolean;
  // PAN can be collected for this itinerary — shown as an optional field unless
  // panMandatory is also set.
  panApplicable?: boolean;
  // PAN must be supplied: only for journeys arriving into India from abroad.
  panMandatory: boolean;
  fareMaskingRequired: boolean;
  seatLayoutAvailable: boolean;
  ssrAvailable: boolean;
}

export interface FlightPricingResponse {
  tui: string;
  netAmount: number;
  segments: SegmentDetail[];
  fareBreakdown: FareBreakdownItem[];
  totalFare: {
    net: number;
    gross: number;
    currency: string;
  };
  fareRules: FareRule[];
  ssrOptions: {
    baggage: SSROption[];
    meals: SSROption[];
    priority: SSROption[];
    sports: SSROption[];
    fastForward: SSROption[];
  };
  seatMaps: SegmentSeatMap[];
  travelChecklist: TravelChecklist;
  fnuLnuSettings: FnuLnuSetting[];
  bookingRequirements: BookingRequirements;
  fareNotices: string[];
  passengerCounts: {
    adults: number;
    children: number;
    infants: number;
  };
  ssrChargeMap: Record<string, number>;
  freeSSRs: FreeSSR[];
  // Multi-city only: one { tui, netAmount } per priced leg (DM: N, IM: 1).
  // Echoed back on booking so the backend can ticket each leg.
  multiCitySessions?: Array<{ tui: string; netAmount: number }>;
}

export interface ContactInfo {
  title: 'Mr' | 'Mrs' | 'Ms' | 'Mstr';
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
  address?: string;
  city?: string;
  state?: string;
  pin?: string;
  countryCode: string;
  mobileCountryCode: string;
  gstCompanyName?: string;
  gstTin?: string;
  gstMobile?: string;
}

export interface TravellerInfo {
  title: 'Mr' | 'Mrs' | 'Ms' | 'Mstr';
  firstName: string;
  lastName: string;
  email?: string;
  dob: string;
  gender: 'M' | 'F';
  paxType: 'ADT' | 'CHD' | 'INF';
  nationality?: string;
  passportNo?: string;
  passportExpiry?: string;
  passportPlaceOfIssue?: string;
  passportDateOfIssue?: string;
  visaType?: string;
  panNo?: string;
  emigrationCheck?: boolean;
}

export interface SSRSelection {
  fuid: number;
  paxId: number;
  ssrId: number;
}

export interface BookingRequest {
  tui: string;
  netAmount: number;
  // Customer-facing grand total we charge through the payment gateway.
  payableAmount: number;
  contactInfo: ContactInfo;
  travellers: TravellerInfo[];
  selectedSSR: SSRSelection[];
  ssrChargeMap: Record<string, number>;
  freeSSRs: FreeSSR[];
  // Echo of bookingRequirements.fareMaskingRequired — sets EnableFareMasking.
  enableFareMasking?: boolean;
  // Multi-city (DM) only: echoed straight back from the pricing response. When
  // length > 1 the backend tickets each leg as its own itinerary.
  multiCitySessions?: Array<{ tui: string; netAmount: number }>;
  // Route summary persisted for the orders list display.
  tripSummary?: {
    fromCode: string;
    toCode: string;
    departureDate: string;
    airline: string;
  };
}

export interface BookingResponse {
  bookingId: string;
  transactionId: string;
  pnr: string;
  status: string;
  totalAmount: number;
  currency: string;
}

/** Returned by createBooking — frontend redirects the browser to redirectUrl. */
export interface BookingInitiateResponse {
  bookingId: string;
  merchantTxnNo: string;
  redirectUrl: string;
  amount: number;
  currency: string;
}

export interface BookingStatusResponse {
  bookingId: string;
  transactionId: string | null;
  pnr: string | null;
  status: string;
  paymentStatus: string;
}

export interface BookingFlightDetail {
  flightNo: string;
  airline: string;
  airlineCode: string;
  aircraft?: string;
  cabin?: string;
  direction?: 'ONWARD' | 'RETURN';
  from: string;
  to: string;
  fromName: string;
  toName: string;
  fromCountry?: string;
  toCountry?: string;
  departureTime: string;
  arrivalTime: string;
  departureTerminal: string;
  arrivalTerminal: string;
  duration: string;
  stops?: string;
  baggage?: string | null;
  pnr: string;
  crsPnr?: string;
  webCheckinUrl: string;
  airlineContact?: string;
  refundable?: boolean;
}

export interface BookingPassenger {
  name: string;
  paxType: string;
  ticketNumber: string;
  ticketStatus?: string;
  gender: string;
  age?: number;
  nationality?: string;
  passportNo?: string;
  passportPlaceOfIssue?: string;
  passportExpiry?: string;
}

export interface BookingCrossSell {
  code: string;
  amount: number;
  status: string;
  transactionId: string;
}

export interface BookingFareBreakdown {
  ticketFare: number; // all-inclusive ticket price for the whole party
  addOns: number; // selected seats / baggage / meals
  total: number;
}

export interface BookingJourneySummary {
  direction: 'ONWARD' | 'RETURN';
  fromCity: string;
  toCity: string;
  date: string;
  durationLabel: string;
  airlineRef: string;
  crsRef: string;
}

export interface BookingDetailsResponse {
  bookingId: string;
  transactionId: string;
  status: string;
  paymentStatus?: string;
  sectorType?: 'DOMESTIC' | 'INTERNATIONAL' | '';
  invoice?: string;
  cumulativeNetAmount?: number;
  cancellationId?: string;
  refundAmount?: number;
  cancellationCharge?: number;
  bookingDate?: string;
  flights: BookingFlightDetail[];
  journeys?: BookingJourneySummary[];
  passengers: BookingPassenger[];
  crossSell?: BookingCrossSell[];
  totalAmount: number;
  currency: string;
  fareBreakdown?: BookingFareBreakdown;
  contactEmail: string;
  contactMobile: string;
}

export interface CancelFlightResponse {
  transactionId: string;
  cancellationId: string;
  status: string;
  message: string;
  refundAmount: number;
  cancellationCharge: number;
}

// ========== API Functions ==========

export async function searchAirports(
  query: string,
  limit: number = 10,
): Promise<Airport[]> {
  const res = await fetch(
    `${API_BASE}/flights/airports?q=${encodeURIComponent(query)}&limit=${limit}`,
  );
  if (!res.ok) throw new Error('Airport search failed');
  return res.json();
}

export async function searchFlights(
  params: FlightSearchParams,
): Promise<FlightSearchResponse> {
  const res = await authFetch(`${API_BASE}/flights/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Search failed' }));
    throw new Error(err.message || 'Flight search failed');
  }
  return res.json();
}

export async function priceAndGetDetails(
  tui: string,
  flightIndex: string,
  onwardNetFare: number,
  tripType: 'oneway' | 'roundtrip',
  returnFlightIndex?: string,
  returnNetFare?: number,
): Promise<FlightPricingResponse> {
  const res = await authFetch(`${API_BASE}/flights/price`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tui,
      flightIndex,
      onwardNetFare,
      tripType,
      returnFlightIndex,
      returnNetFare,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Pricing failed' }));
    throw new Error(err.message || 'Flight pricing failed');
  }
  return res.json();
}

export interface FareRulesLookupResponse {
  fareRules: FareRule[];
  unavailable: boolean;
}

/**
 * Fetch real cancellation/change penalties for one searched flight.
 *
 * Search results carry no rule data, so this prices the fare against Benzy to
 * obtain it. It is a billable upstream call — only invoke it when the customer
 * actually asks to see the rules, never eagerly for a list of results.
 */
export async function getFareRules(
  tui: string,
  flightIndex: string,
  netFare: number,
): Promise<FareRulesLookupResponse> {
  const res = await authFetch(`${API_BASE}/flights/fare-rules`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tui, flightIndex, netFare }),
  });
  if (!res.ok) {
    const err = await res
      .json()
      .catch(() => ({ message: 'Could not load fare rules' }));
    throw new Error(err.message || 'Could not load fare rules');
  }
  return res.json();
}

/** Free check-in allowance included in the fare, for one flown sector. */
export interface BaggageAllowance {
  fuid: number;
  flightNo: string;
  airlineCode: string;
  from: string;
  to: string;
  checkIn: string | null;
  pieceDescription: string | null;
}

/** Purchasable extra baggage for one sector of the itinerary. */
export interface BaggageSectorOptions {
  /** null when the airline's catalogue is not scoped to a priced segment. */
  fuid: number | null;
  /** "CCU - BOM", or null when the group maps to no specific sector. */
  sector: string | null;
  flightNo: string | null;
  airlineCode: string | null;
  /** Airline bills the add-on on another sector and carries the bag through. */
  carriedThrough: boolean;
  options: SSROption[];
}

export interface BaggageLookupResponse {
  allowances: BaggageAllowance[];
  /** Purchasable extra baggage. Charges are what the add-ons step will bill. */
  extraBaggage: BaggageSectorOptions[];
  unavailable: boolean;
}

/**
 * Fetch the per-sector baggage allowance and paid-baggage catalogue for one
 * searched flight.
 *
 * Search carries only one journey-level allowance string and nothing about
 * add-ons, so this prices the fare against Benzy and pulls SSR. Billable
 * upstream — only invoke when the customer opens the baggage view, never
 * eagerly across a list of results.
 */
export async function getBaggage(
  tui: string,
  flightIndex: string,
  netFare: number,
): Promise<BaggageLookupResponse> {
  const res = await authFetch(`${API_BASE}/flights/baggage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tui, flightIndex, netFare }),
  });
  if (!res.ok) {
    const err = await res
      .json()
      .catch(() => ({ message: 'Could not load baggage details' }));
    throw new Error(err.message || 'Could not load baggage details');
  }
  return res.json();
}

export async function searchMultiCityFlights(
  params: MultiCitySearchParams,
): Promise<MultiCitySearchResponse> {
  const res = await authFetch(`${API_BASE}/flights/search-multicity`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Search failed' }));
    throw new Error(err.message || 'Flight search failed');
  }
  return res.json();
}

export async function priceMultiCityAndGetDetails(
  tripType: 'DM' | 'IM',
  legs: MultiCityPriceLeg[],
): Promise<FlightPricingResponse> {
  const res = await authFetch(`${API_BASE}/flights/price-multicity`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tripType, legs }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Pricing failed' }));
    throw new Error(err.message || 'Flight pricing failed');
  }
  return res.json();
}

/**
 * Starts a booking and returns the payment-gateway redirect URL. The ticket is
 * only issued (by the backend) after the customer completes payment — the
 * caller should send the browser to `redirectUrl`.
 */
export async function createBooking(
  request: BookingRequest,
): Promise<BookingInitiateResponse> {
  const res = await authFetch(`${API_BASE}/flights/book`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Booking failed' }));
    throw new Error(err.message || 'Booking failed');
  }
  return res.json();
}

/** Poll booking/ticketing status by the payment's merchantTxnNo. */
export async function getBookingStatusByTxn(
  merchantTxnNo: string,
): Promise<BookingStatusResponse> {
  const res = await authFetch(
    `${API_BASE}/flights/booking-status/${encodeURIComponent(merchantTxnNo)}`,
  );
  if (!res.ok) {
    const err = await res
      .json()
      .catch(() => ({ message: 'Failed to fetch booking status' }));
    throw new Error(err.message || 'Failed to fetch booking status');
  }
  return res.json();
}

export async function getBookingDetails(
  transactionId: string,
): Promise<BookingDetailsResponse> {
  const res = await authFetch(`${API_BASE}/flights/booking/${transactionId}`);
  if (!res.ok) {
    const err = await res
      .json()
      .catch(() => ({ message: 'Failed to fetch booking details' }));
    throw new Error(err.message || 'Failed to fetch booking details');
  }
  return res.json();
}

export async function cancelBooking(
  transactionId: string,
  remarks?: string,
): Promise<CancelFlightResponse> {
  const res = await authFetch(
    `${API_BASE}/flights/booking/${transactionId}/cancel`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(remarks ? { remarks } : {}),
    },
  );
  if (!res.ok) {
    const err = await res
      .json()
      .catch(() => ({ message: 'Failed to cancel booking' }));
    throw new Error(err.message || 'Failed to cancel booking');
  }
  return res.json();
}

export async function downloadTicketPdf(transactionId: string): Promise<void> {
  const res = await authFetch(
    `${API_BASE}/flights/booking/${transactionId}/ticket.pdf`,
  );
  if (!res.ok) {
    const err = await res
      .json()
      .catch(() => ({ message: 'Failed to download ticket' }));
    throw new Error(err.message || 'Failed to download ticket');
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ticket-SP-${transactionId}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ========== Promo Code Types ==========

export interface PromoCodeListItem {
  id: string;
  code: string;
  description: string | null;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minOrderAmount: number | null;
  maxDiscount: number | null;
}

export interface PromoValidationResult {
  valid: boolean;
  code: string;
  description: string | null;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  discountAmount: number;
  message?: string;
}

// ========== Promo Code API Functions ==========

export async function getPromoCodes(
  serviceType?: string,
): Promise<PromoCodeListItem[]> {
  const params = serviceType ? `?serviceType=${serviceType}` : '';
  const res = await fetch(`${API_BASE}/promo-codes${params}`);
  if (!res.ok) throw new Error('Failed to fetch promo codes');
  return res.json();
}

export async function validatePromoCode(
  code: string,
  amount: number,
  serviceType?: string,
): Promise<PromoValidationResult> {
  const res = await fetch(`${API_BASE}/promo-codes/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, amount, serviceType }),
  });
  if (!res.ok) {
    const err = await res
      .json()
      .catch(() => ({ message: 'Validation failed' }));
    throw new Error(err.message || 'Promo code validation failed');
  }
  return res.json();
}
