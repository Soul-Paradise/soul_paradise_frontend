'use client';

import type {
  SSROption,
  SSRSelection,
  FareBreakdownItem,
  PromoValidationResult,
} from '@/lib/flights-api';
import { PromoCodeSection } from './PromoCodeSection';

interface BookingSummaryProps {
  fareBreakdown: FareBreakdownItem[];
  totalFare: { net: number; gross: number; currency: string };
  passengerCounts: { adults: number; children: number; infants: number };
  selectedSSR: SSRSelection[];
  allSSROptions: SSROption[];
  appliedPromo: PromoValidationResult | null;
  onApplyPromo: (result: PromoValidationResult | null) => void;
  isSubmitting: boolean;
  onSubmit: () => void;
  currentStep: number;
  totalSteps: number;
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency || 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export const BookingSummary = ({
  fareBreakdown,
  totalFare,
  passengerCounts,
  selectedSSR,
  allSSROptions,
  appliedPromo,
  onApplyPromo,
  isSubmitting,
  onSubmit,
  currentStep,
  totalSteps,
}: BookingSummaryProps) => {
  const totalTravellers =
    passengerCounts.adults + passengerCounts.children + passengerCounts.infants;

  // Aggregate each per-passenger breakdown line across the whole party
  // (per-pax amount × count for each type) so the rows sum exactly to the fare
  // total for any passenger mix - not just a single traveller.
  const aggregate = (item: FareBreakdownItem) =>
    item.adultAmount * passengerCounts.adults +
    item.childAmount * passengerCounts.children +
    item.infantAmount * passengerCounts.infants;

  // The backend sends a single all-inclusive ticket line - taxes, GST and
  // service charges are folded into it and are never itemised for the customer.
  const fareLines = fareBreakdown
    .map((item) => ({ label: item.label, amount: aggregate(item) }))
    .filter((line) => line.amount > 0);
  const fareLinesTotal = fareLines.reduce((sum, line) => sum + line.amount, 0);

  // Resolve each selection to its option. Match on BOTH fuid and id: multi-city
  // (and round-trip) legs can share an ssrId across segments, so an id-only
  // match would pick the wrong leg's charge. This keys exactly like the
  // backend's ssrChargeMap (`${fuid}:${id}`), so the customer total reconciles
  // with what's sent to Benzy. Charges are already tax-inclusive.
  const selectedOptions = selectedSSR
    .map((sel) =>
      allSSROptions.find((o) => o.id === sel.ssrId && o.fuid === sel.fuid),
    )
    .filter((o): o is SSROption => !!o);

  // Break the extras out the way the customer chose them - seats, extra
  // baggage, meals - so each optional fare they picked is visible on its own
  // line rather than hidden inside one lump "Add-ons" figure.
  const ADD_ON_GROUPS: Array<{ label: string; types: SSROption['type'][] }> = [
    { label: 'Seat Selection', types: ['seat'] },
    { label: 'Extra Baggage', types: ['baggage', 'sports'] },
    { label: 'Meals', types: ['meal'] },
    { label: 'Other Add-ons', types: ['priority', 'fastForward', 'other'] },
  ];

  const addOnLines = ADD_ON_GROUPS.map((group) => {
    const items = selectedOptions.filter((o) => group.types.includes(o.type));
    return {
      label: group.label,
      count: items.length,
      amount: items.reduce((sum, o) => sum + (o.charge || 0), 0),
    };
  }).filter((line) => line.amount > 0);

  const ssrTotal = selectedOptions.reduce(
    (total, o) => total + (o.charge || 0),
    0,
  );

  // Promo discount
  const promoDiscount = appliedPromo?.valid ? appliedPromo.discountAmount : 0;

  // Grand total - derived from the visible lines so the breakdown always
  // reconciles with the Total Amount shown to (and paid by) the customer.
  const grandTotal = fareLinesTotal + ssrTotal - promoDiscount;

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden sticky top-4">
      {/* Fare Details Header */}
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Fare Details
        </h2>
        <span className="text-xs text-(--color-links) font-medium">
          {totalTravellers} Traveller{totalTravellers > 1 ? 's' : ''}
        </span>
      </div>

      <div className="p-4 sm:p-5 space-y-2.5">
        {/* All-inclusive ticket fare - never split into taxes or charges */}
        {fareLines.map((line) => (
          <div key={line.label} className="flex justify-between text-sm">
            <span className="text-gray-600">{line.label}</span>
            <span className="text-gray-900 font-medium">
              {formatCurrency(line.amount, totalFare.currency)}
            </span>
          </div>
        ))}

        {/* Optional extras the customer selected, one line per category */}
        {addOnLines.map((line) => (
          <div key={line.label} className="flex justify-between text-sm">
            <span className="text-gray-600">
              {line.label}
              {line.count > 1 ? ` (${line.count})` : ''}
            </span>
            <span className="text-gray-900 font-medium">
              {formatCurrency(line.amount, totalFare.currency)}
            </span>
          </div>
        ))}

        {/* Promo Discount */}
        {appliedPromo?.valid && promoDiscount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-green-600">
              Promo Discount Applied
            </span>
            <span className="text-green-600 font-medium">
              - {formatCurrency(promoDiscount, totalFare.currency)}
            </span>
          </div>
        )}

        {/* Total */}
        <div className="pt-3 border-t border-gray-200 flex justify-between">
          <span className="text-sm font-semibold text-gray-900">
            Total Amount
          </span>
          <span className="text-lg font-bold text-gray-900">
            {formatCurrency(grandTotal, totalFare.currency)}
          </span>
        </div>

        {/* Promo Code Section */}
        <PromoCodeSection
          totalAmount={totalFare.gross + ssrTotal}
          currency={totalFare.currency}
          serviceType="FLIGHT"
          appliedPromo={appliedPromo}
          onApplyPromo={onApplyPromo}
        />

        {/* Confirm & Pay button - only on last step */}
        {currentStep === totalSteps - 1 && (
          <>
            <button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting}
              className="w-full mt-3 px-6 py-3 bg-(--color-links) text-white text-sm font-semibold rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                `Confirm & Pay ${formatCurrency(grandTotal, totalFare.currency)}`
              )}
            </button>

            <p className="text-[10px] text-gray-400 text-center">
              By clicking Confirm & Pay, you agree to the fare rules and terms of service.
            </p>
          </>
        )}
      </div>
    </div>
  );
};
