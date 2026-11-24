'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { downloadHotelVoucher } from '@/lib/bookings-api';
import {
  BookButton,
  ConfirmationHero,
  ConfirmationPage,
  ConfirmationRow,
  ConfirmationSection,
  SecondaryButton,
} from '@/components/Results/ui';

// Hotel booking voucher: the confirmation view and its PDF. Shown on the
// payment-result page once the hotel is booked after the customer has paid.

interface VoucherGuest {
  title: string;
  firstName: string;
  lastName: string;
  paxType: string;
  age: string;
}

interface VoucherRoom {
  id: string;
  name: string;
  description: string;
  capacity: string;
  adults: string;
  children: string;
  refundable: string;
  supplierConfirmationNumber: string;
  guests: VoucherGuest[];
  cancellationPolicy: Array<{ text: string; fromDate: string; toDate: string; amount: string }>;
}

export interface BookingVoucher {
  bookingId: string;
  transactionId: string;
  confirmationId: string;
  supplierConfirmationId: string;
  status: string;
  currentStatus: string;
  paymentStatus: string;
  bookedAt: string;
  /** What the customer paid - the only price a customer ever sees. */
  totalAmount: number;
  currency: string;
  checkInDate: string;
  checkOutDate: string;
  checkInTime: string;
  checkOutTime: string;
  nights: number;
  hotel: {
    code: string;
    name: string;
    starRating: string;
    heroImage: string;
    phone: string;
    address: {
      line1: string;
      line2: string;
      city: string;
      state: string;
      country: string;
      zip: string;
    };
  };
  contactInfo: {
    title: string;
    firstName: string;
    lastName: string;
    email: string;
    mobile: string;
  };
  rooms: VoucherRoom[];
  cancellationPolicies: Array<{ text: string; fromDate: string; toDate: string; amount: string }>;
  freeCancellationUntil?: string | null;
}

function fmt(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}



// Expandable disclosure used by fare summary rows

// ── Booking Confirmation (Voucher) ──

function statusTone(status: string): { tone: 'success' | 'pending' | 'error'; label: string } {
  const s = (status || '').toUpperCase();
  if (s === 'BOOKED' || s === 'B0' || s === 'BO0' || s === 'CONFIRMED' || s.includes('SUCCESS')) {
    return { tone: 'success', label: 'Confirmed' };
  }
  if (s === 'B1' || s === 'BO1' || s.includes('FAIL')) {
    return { tone: 'error', label: 'Failed' };
  }
  if (s.includes('PEND') || s.includes('PROGRESS')) {
    return { tone: 'pending', label: 'Pending' };
  }
  // Never show a raw supplier code: a voucher only exists once booked.
  return { tone: 'success', label: 'Confirmed' };
}

function formatLongDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}


export function BookingConfirmation({ voucher, onDone }: { voucher: BookingVoucher; onDone: () => void }) {
  const tone = statusTone(voucher.status);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  async function handleDownload() {
    setDownloading(true);
    setDownloadError(null);
    try {
      // The server's voucher: the same PDF the confirmation email carries.
      await downloadHotelVoucher(voucher.transactionId, voucher.bookingId);
    } catch (err) {
      console.error('PDF download failed:', err);
      setDownloadError(
        err instanceof Error ? err.message : 'Could not generate PDF. Please try again.',
      );
    } finally {
      setDownloading(false);
    }
  }

  const primaryGuest = voucher.rooms[0]?.guests[0];
  const addressLine = [voucher.hotel.address.line1, voucher.hotel.address.city, voucher.hotel.address.state]
    .filter(Boolean)
    .join(', ');
  const totalGuests = voucher.rooms.reduce((s, r) => s + r.guests.length, 0);

  return (
    <ConfirmationPage
      actions={
        <>
          <SecondaryButton href="/orders?tab=hotels">My Bookings</SecondaryButton>
          <BookButton onClick={onDone}>Back to home</BookButton>
        </>
      }
    >
      <ConfirmationHero
        tone={tone.tone}
        title={`Booking ${tone.label}`}
        subtitle={
          voucher.contactInfo.email && (
            <>A confirmation has been sent to <span className="font-semibold text-(--color-foreground)">{voucher.contactInfo.email}</span></>
          )
        }
        refs={[
          { label: 'Booking ID', value: voucher.bookingId },
          { label: 'Confirmation', value: voucher.confirmationId || '-' },
          { label: 'Total paid', value: fmt(voucher.totalAmount, voucher.currency) },
        ]}
      >
        <SecondaryButton onClick={handleDownload} disabled={downloading} icon={Download}>
          {downloading ? 'Preparing PDF...' : 'Download Voucher (PDF)'}
        </SecondaryButton>
      </ConfirmationHero>
      {downloadError && <p className="text-xs text-(--color-danger) text-center">{downloadError}</p>}

      <ConfirmationSection title="Your stay">
        <div className="flex items-start gap-4">
          {voucher.hotel.heroImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={voucher.hotel.heroImage}
              alt={voucher.hotel.name}
              className="w-24 h-24 rounded-xl object-cover shrink-0"
            />
          ) : (
            <div className="w-24 h-24 rounded-xl bg-(--color-background) shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-(--color-foreground)">{voucher.hotel.name || 'Hotel'}</h3>
            </div>
            {addressLine && <p className="text-xs text-(--color-inactive) mt-1">{addressLine}</p>}
            {voucher.hotel.phone && (
              <p className="text-xs text-(--color-inactive) mt-0.5">Phone: {voucher.hotel.phone}</p>
            )}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          {[
            { label: 'Check-in', date: voucher.checkInDate, time: voucher.checkInTime && `After ${voucher.checkInTime}` },
            { label: 'Check-out', date: voucher.checkOutDate, time: voucher.checkOutTime && `Before ${voucher.checkOutTime}` },
          ].map(({ label, date, time }) => (
            <div key={label} className="rounded-xl border border-(--color-tertiary-button) bg-(--color-background) p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-(--color-inactive)">{label}</p>
              <p className="text-sm font-bold text-(--color-foreground) mt-1">{formatLongDate(date)}</p>
              {time && <p className="text-xs text-(--color-inactive) mt-0.5">{time}</p>}
            </div>
          ))}
        </div>
        <p className="text-xs text-(--color-inactive) mt-3">
          <span className="font-bold text-(--color-foreground)">
            {voucher.nights} night{voucher.nights === 1 ? '' : 's'}
          </span>{' '}
          • {voucher.rooms.length} room{voucher.rooms.length === 1 ? '' : 's'} • {totalGuests} guest
          {totalGuests === 1 ? '' : 's'}
        </p>
      </ConfirmationSection>

      <ConfirmationSection title="Rooms & Guests">
        <div className="space-y-3">
          {voucher.rooms.map((room, idx) => (
            <div key={idx} className="rounded-xl border border-(--color-tertiary-button) bg-(--color-background) p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-(--color-foreground)">
                    Room {idx + 1}: {room.name || 'Room'}
                  </p>
                  {room.capacity && (
                    <p className="text-xs text-(--color-inactive) mt-0.5">
                      {room.adults} Adult{room.adults === '1' ? '' : 's'}
                      {Number(room.children) > 0 ? ` • ${room.children} Child` : ''}
                    </p>
                  )}
                </div>
                {room.supplierConfirmationNumber && (
                  <span className="text-xs font-bold text-(--color-links) bg-(--color-primary-tint) rounded-full px-2.5 py-1 whitespace-nowrap">
                    {room.supplierConfirmationNumber}
                  </span>
                )}
              </div>
              <ul className="mt-2 space-y-1">
                {room.guests.map((g, gIdx) => (
                  <li key={gIdx} className="text-sm font-semibold text-(--color-foreground)">
                    {g.title} {g.firstName} {g.lastName}
                    {g.paxType === 'C' && g.age && (
                      <span className="font-normal text-(--color-inactive)"> (age {g.age})</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </ConfirmationSection>

      <ConfirmationSection title="Contact">
        <dl>
          <ConfirmationRow
            label="Guest"
            value={
              primaryGuest
                ? `${primaryGuest.title} ${primaryGuest.firstName} ${primaryGuest.lastName}`
                : `${voucher.contactInfo.firstName} ${voucher.contactInfo.lastName}`
            }
          />
          <ConfirmationRow label="Mobile" value={voucher.contactInfo.mobile || '-'} />
          <ConfirmationRow label="Email" value={voucher.contactInfo.email || '-'} />
        </dl>
      </ConfirmationSection>

      <ConfirmationSection title="Payment">
        <dl>
          <ConfirmationRow label="Transaction" value={voucher.transactionId} />
          <ConfirmationRow label="Total Paid" value={fmt(voucher.totalAmount, voucher.currency)} strong />
        </dl>
      </ConfirmationSection>

      <p className="text-xs text-(--color-inactive) text-center">
        Present this voucher along with a valid ID at check-in.
      </p>
    </ConfirmationPage>
  );
}
