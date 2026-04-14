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
  recommended: boolean;
  aircraft: string;
}

export interface FlightSearchResponse {
  searchId: string;
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
  stops: number;
  baggage?: string | null;
  refundable?: string;
  amenities?: string;
  equipmentType?: string;
  seatsAvailable?: number;
  direction?: 'ONWARD' | 'RETURN';
}

export interface FareBreakdownItem {
  label: string;
  adultAmount: number;
  childAmount: number;
  infantAmount: number;
  currency: string;
}

export interface FareRuleCharge {
  description: string;
  adultAmount: number;
  childAmount: number;
  infantAmount: number;
}

export interface FareRule {
  category: string;
  charges: FareRuleCharge[];
}

export interface SSROption {
  id: number;
  code: string;
  description: string;
  charge: number;
  type: 'baggage' | 'meal' | 'priority' | 'seat' | 'sports' | 'fastForward' | 'other';
  mealImage?: string;
  fuid: number;
}

export interface SeatInfo {
  ssid: number;
  seatNumber: string;
  seatInfo: string;
  seatType: string;
  available: boolean;
  fare: number;
  tax: number;
  x: number;
  y: number;
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

export interface FlightPricingResponse {
  pricingId: string;
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
  passengerCounts: {
    adults: number;
    children: number;
    infants: number;
  };
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
  pricingId: string;
  contactInfo: ContactInfo;
  travellers: TravellerInfo[];
  selectedSSR: SSRSelection[];
}

export interface BookingResponse {
  bookingId: string;
  transactionId: string;
  pnr: string;
  status: string;
  totalAmount: number;
  currency: string;
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
}

export interface BookingPassenger {
  name: string;
  paxType: string;
  ticketNumber: string;
  gender: string;
}

export interface BookingFareBreakdown {
  baseFare: number;
  taxes: number;
  ssrAmount: number;
  gst: number;
  atFare: number;
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
  bookingDate?: string;
  flights: BookingFlightDetail[];
  journeys?: BookingJourneySummary[];
  passengers: BookingPassenger[];
  totalAmount: number;
  currency: string;
  fareBreakdown?: BookingFareBreakdown;
  contactEmail: string;
  contactMobile: string;
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
  const res = await fetch(`${API_BASE}/flights/search`, {
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
  searchId: string,
  flightIndex: string,
  tripType: string,
  returnFlightIndex?: string,
): Promise<FlightPricingResponse> {
  const res = await fetch(`${API_BASE}/flights/price`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ searchId, flightIndex, tripType, returnFlightIndex }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Pricing failed' }));
    throw new Error(err.message || 'Flight pricing failed');
  }
  return res.json();
}

export async function createBooking(
  request: BookingRequest,
): Promise<BookingResponse> {
  const res = await fetch(`${API_BASE}/flights/book`, {
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

export async function getBookingDetails(
  transactionId: string,
): Promise<BookingDetailsResponse> {
  const res = await fetch(`${API_BASE}/flights/booking/${transactionId}`);
  if (!res.ok) {
    const err = await res
      .json()
      .catch(() => ({ message: 'Failed to fetch booking details' }));
    throw new Error(err.message || 'Failed to fetch booking details');
  }
  return res.json();
}

export async function downloadTicketPdf(transactionId: string): Promise<void> {
  const res = await fetch(
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
