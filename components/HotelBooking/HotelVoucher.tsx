'use client';

import { useState } from 'react';
import type { jsPDF } from 'jspdf';
import { Download } from 'lucide-react';
import { formatDeadline } from '@/components/HotelResults/FreeCancellationBadge';
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

function htmlToLines(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const cleaned = raw
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6]|ul|ol)>/gi, '\n')
    .replace(/<li\b[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/[ \t]+/g, ' ');
  return cleaned
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

function Stars({ count }: { count: number }) {
  return (
    <span className="inline-flex gap-0.5 align-middle">
      {Array.from({ length: Math.max(0, count) }).map((_, i) => (
        <svg key={i} className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

// Expandable disclosure used by fare summary rows

// ── Booking Confirmation (Voucher) ──

function statusTone(status: string): { tone: 'success' | 'pending' | 'error'; label: string } {
  const s = (status || '').toUpperCase();
  if (s === 'B0' || s === 'BO0' || s === 'CONFIRMED' || s.includes('SUCCESS')) {
    return { tone: 'success', label: 'Confirmed' };
  }
  if (s === 'B1' || s === 'BO1' || s.includes('FAIL')) {
    return { tone: 'error', label: 'Failed' };
  }
  if (s.includes('PEND') || s.includes('PROGRESS')) {
    return { tone: 'pending', label: 'Pending' };
  }
  return { tone: 'success', label: status || 'Booked' };
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

function buildPdf(v: BookingVoucher, JsPDF: typeof jsPDF): jsPDF {
  const doc = new JsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // ── Header band ──
  doc.setFillColor(37, 99, 235); // blue-600
  doc.rect(0, 0, pageWidth, 90, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('Soul Paradise', margin, 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Hotel Booking Voucher', margin, 58);
  doc.setFontSize(9);
  const bookedAt = formatLongDate(v.bookedAt) || new Date().toLocaleDateString('en-IN');
  doc.text(`Issued: ${bookedAt}`, pageWidth - margin, 40, { align: 'right' });
  const tone = statusTone(v.status);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(tone.label.toUpperCase(), pageWidth - margin, 58, { align: 'right' });
  y = 120;

  // ── Booking IDs block ──
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Booking Details', margin, y);
  y += 18;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);
  y += 14;

  const infoRows: Array<[string, string]> = [
    ['Booking ID', v.bookingId],
    ['Confirmation ID', v.confirmationId || '-'],
    ['Supplier Ref', v.supplierConfirmationId || '-'],
    ['Transaction', v.transactionId],
    ['Status', tone.label],
  ];
  doc.setFontSize(10);
  for (const [k, val] of infoRows) {
    ensureSpace(18);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(k, margin, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(val, margin + 140, y);
    y += 16;
  }

  // ── Hotel block ──
  y += 10;
  ensureSpace(80);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Hotel', margin, y);
  y += 18;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);
  y += 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(v.hotel.name || '-', margin, y);
  y += 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  const addressParts = [
    [v.hotel.address.line1, v.hotel.address.line2].filter(Boolean).join(', '),
    [v.hotel.address.city, v.hotel.address.state, v.hotel.address.zip].filter(Boolean).join(', '),
    v.hotel.address.country,
  ].filter(Boolean);
  for (const line of addressParts) {
    const wrapped = doc.splitTextToSize(line, contentWidth);
    ensureSpace(wrapped.length * 12);
    doc.text(wrapped, margin, y);
    y += wrapped.length * 12;
  }
  if (v.hotel.phone) {
    ensureSpace(14);
    doc.text(`Phone: ${v.hotel.phone}`, margin, y);
    y += 14;
  }

  // ── Stay block ──
  y += 10;
  ensureSpace(90);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  doc.text('Your Stay', margin, y);
  y += 18;
  doc.line(margin, y, pageWidth - margin, y);
  y += 14;

  const stayBoxWidth = (contentWidth - 20) / 2;
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, stayBoxWidth, 56, 4, 4, 'FD');
  doc.roundedRect(margin + stayBoxWidth + 20, y, stayBoxWidth, 56, 4, 4, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('CHECK-IN', margin + 12, y + 16);
  doc.text('CHECK-OUT', margin + stayBoxWidth + 32, y + 16);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(formatLongDate(v.checkInDate), margin + 12, y + 34);
  doc.text(formatLongDate(v.checkOutDate), margin + stayBoxWidth + 32, y + 34);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(v.checkInTime ? `After ${v.checkInTime}` : '', margin + 12, y + 48);
  doc.text(v.checkOutTime ? `Before ${v.checkOutTime}` : '', margin + stayBoxWidth + 32, y + 48);
  y += 64;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text(`${v.nights} night${v.nights === 1 ? '' : 's'}`, margin, y + 4);
  y += 18;

  // ── Rooms ──
  for (let i = 0; i < v.rooms.length; i++) {
    const room = v.rooms[i];
    y += 6;
    ensureSpace(60);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text(`Room ${i + 1}: ${room.name || 'Room'}`, margin, y);
    y += 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const meta = [
      room.capacity && `Capacity: ${room.capacity}`,
      room.adults && `Adults: ${room.adults}`,
      room.children && `Children: ${room.children}`,
      room.refundable && `${room.refundable}`.toLowerCase().includes('true') ? 'Refundable' : '',
    ].filter(Boolean).join('  •  ');
    if (meta) {
      doc.text(meta, margin, y);
      y += 12;
    }

    for (const g of room.guests) {
      ensureSpace(14);
      doc.setTextColor(30, 41, 59);
      const ageText = g.paxType === 'C' && g.age ? ` (age ${g.age})` : '';
      doc.text(
        `• ${g.title} ${g.firstName} ${g.lastName}${ageText}`,
        margin + 10,
        y,
      );
      y += 13;
    }
  }

  // ── Fare summary ──
  y += 8;
  ensureSpace(80);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  doc.text('Fare Summary', margin, y);
  y += 18;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);
  y += 14;

  // The customer sees only the final price they paid.
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total Paid', margin, y);
  doc.text(fmt(v.totalAmount, v.currency), pageWidth - margin, y, { align: 'right' });
  y += 20;

  // ── Cancellation policies ──
  if (v.cancellationPolicies.length > 0) {
    y += 6;
    ensureSpace(40);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Cancellation Policy', margin, y);
    y += 18;
    doc.line(margin, y, pageWidth - margin, y);
    y += 12;
    if (v.freeCancellationUntil) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(21, 128, 61);
      doc.text(
        `Free cancellation until ${formatDeadline(v.freeCancellationUntil, true)}`,
        margin,
        y,
      );
      y += 16;
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    for (const policy of v.cancellationPolicies) {
      const lines = htmlToLines(policy.text);
      for (const line of lines) {
        const wrapped = doc.splitTextToSize(`• ${line}`, contentWidth);
        ensureSpace(wrapped.length * 12);
        doc.text(wrapped, margin, y);
        y += wrapped.length * 12 + 2;
      }
    }
  }

  // ── Footer ──
  const footerY = pageHeight - 30;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY - 10, pageWidth - margin, footerY - 10);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'This voucher is proof of booking. Please present it at the hotel along with a valid ID.',
    pageWidth / 2,
    footerY,
    { align: 'center' },
  );

  return doc;
}

export function BookingConfirmation({ voucher, onDone }: { voucher: BookingVoucher; onDone: () => void }) {
  const tone = statusTone(voucher.status);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  async function handleDownload() {
    setDownloading(true);
    setDownloadError(null);
    try {
      const mod = await import('jspdf');
      const JsPDF = (mod as { jsPDF?: typeof jsPDF; default?: typeof jsPDF }).jsPDF
        ?? (mod as { default?: typeof jsPDF }).default;
      if (!JsPDF) throw new Error('Could not load PDF library');
      const doc = buildPdf(voucher, JsPDF);
      doc.save(`${voucher.bookingId}.pdf`);
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
  const stars = Math.min(5, Number(voucher.hotel.starRating) || 0);

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
              {stars > 0 && <Stars count={stars} />}
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
