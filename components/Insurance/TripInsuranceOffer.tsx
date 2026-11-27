'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { getTripInsuranceOffer, tripOfferHref, type TripInsuranceOffer } from '@/lib/insurance-api';

/**
 * "Travelling abroad? Cover this trip" - shown on the flight / hotel
 * confirmation once the booking is confirmed, only when the trip leaves India
 * (Benzy insurance covers trips abroad). Opens the insurance search pre-filled
 * from the booking; the policy is bought separately. Renders nothing otherwise.
 */
export function TripInsuranceOfferCard({ service, bookingId }: { service: 'FLIGHT' | 'HOTEL'; bookingId: string }) {
  const [offer, setOffer] = useState<Extract<TripInsuranceOffer, { eligible: true }> | null>(null);

  useEffect(() => {
    let cancelled = false;
    getTripInsuranceOffer(service, bookingId)
      .then((o) => !cancelled && o.eligible && setOffer(o))
      .catch(() => undefined); // an offer is optional - never break the confirmation
    return () => {
      cancelled = true;
    };
  }, [service, bookingId]);

  if (!offer) return null;
  const n = offer.travellers.length;
  return (
    <section className="rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-50 to-white p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <div>
            <h2 className="text-base font-bold text-(--color-foreground)">
              Travelling to {offer.countryNames.join(', ')}? Cover this trip too
            </h2>
            <p className="mt-0.5 text-sm text-(--color-inactive)">
              Travel insurance for {n} traveller{n === 1 ? '' : 's'} - medical emergencies, lost baggage, delays and
              more. Your trip details are already filled in.
            </p>
          </div>
        </div>
        <Link
          href={tripOfferHref(service, bookingId)}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-purple-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-purple-700"
        >
          Get travel insurance <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
