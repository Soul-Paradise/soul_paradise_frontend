import { authFetch } from './api';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

// ========== Types (mirror backend listUserBookings select shapes) ==========

export interface FlightBookingSummary {
  bookingId: string;
  transactionId: string;
  pnr: string | null;
  status: string;
  totalAmount: number;
  currency: string;
  fromCode: string;
  toCode: string;
  departureDate: string;
  airline: string | null;
  passengerCount: number;
  contactEmail: string | null;
  contactMobile: string | null;
  createdAt: string;
}

export interface HotelBookingSummary {
  bookingId: string;
  transactionId: string;
  confirmationId: string | null;
  status: string;
  totalAmount: number;
  currency: string;
  hotelCode: string | null;
  hotelName: string | null;
  city: string | null;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  contactEmail: string | null;
  contactMobile: string | null;
  createdAt: string;
}

export interface InsuranceBookingSummary {
  bookingId: string;
  transactionId: string;
  policyNumber: string | null;
  status: string;
  totalAmount: number;
  currency: string;
  policyType: string | null;
  startDate: string;
  endDate: string;
  travellerCount: number;
  contactEmail: string | null;
  createdAt: string;
}

export interface HotelCancelResult {
  cancellationId: number;
  autoCancellation: boolean;
  status: string;
  cancellationCharge: number;
  refundAmount: number;
}

/** What cancelling now would cost, in the customer's prices (shown before confirming). */
export interface HotelCancellationPreview {
  bookingId: string;
  transactionId: string;
  hotelName: string | null;
  checkInDate: string;
  totalPaid: number;
  cancellationCharge: number;
  refundAmount: number;
  freeCancellation: boolean;
  freeCancellationUntil: string | null;
  policy: Array<{ from: string | null; to: string | null; charge: number }>;
  currency: string;
}

// ========== Helpers ==========

async function getJson<T>(path: string, fallbackMsg: string): Promise<T> {
  const res = await authFetch(`${API_BASE}${path}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: fallbackMsg }));
    throw new Error(err.message || fallbackMsg);
  }
  return res.json();
}

// ========== List bookings ==========

export function listFlightBookings(): Promise<FlightBookingSummary[]> {
  return getJson('/flights/bookings', 'Failed to load flight bookings');
}

export function listHotelBookings(): Promise<HotelBookingSummary[]> {
  return getJson('/hotels/bookings', 'Failed to load hotel bookings');
}

export function listInsuranceBookings(): Promise<InsuranceBookingSummary[]> {
  return getJson('/insurance/bookings', 'Failed to load insurance bookings');
}

// ========== Cancel (hotel) ==========

export function getHotelCancellationPreview(transactionId: string): Promise<HotelCancellationPreview> {
  return getJson(
    `/hotels/booking/${encodeURIComponent(transactionId)}/cancellation`,
    'Could not load the cancellation charges',
  );
}

/** The hotel voucher PDF (the same file as the confirmation email). */
export async function downloadHotelVoucher(transactionId: string, bookingId: string): Promise<void> {
  const res = await authFetch(`${API_BASE}/hotels/booking/${encodeURIComponent(transactionId)}/voucher.pdf`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to download the voucher' }));
    throw new Error(err.message || 'Failed to download the voucher');
  }
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement('a');
  a.href = url;
  a.download = `hotel-voucher-${bookingId}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function cancelHotelBooking(
  transactionId: string,
  remarks = '',
): Promise<HotelCancelResult> {
  const res = await authFetch(`${API_BASE}/hotels/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transactionId, remarks }),
  });
  if (!res.ok) {
    const err = await res
      .json()
      .catch(() => ({ message: 'Hotel cancellation failed' }));
    const msg = Array.isArray(err.message)
      ? err.message.join(', ')
      : err.message;
    throw new Error(msg || 'Hotel cancellation failed');
  }
  return res.json();
}
