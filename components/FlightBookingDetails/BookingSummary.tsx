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

  // Calculate base fare and taxes from the fareBreakdown items
  const baseFareItem = fareBreakdown.find(
    (item) =>
      item.label.toLowerCase().includes('base') ||
      item.label.toLowerCase().includes('fare'),
  );
  const taxItems = fareBreakdown.filter(
    (item) =>
      !item.label.toLowerCase().includes('base') &&
      !item.label.toLowerCase().includes('fare'),
  );

  const baseFareTotal = baseFareItem
    ? baseFareItem.adultAmount + baseFareItem.childAmount + baseFareItem.infantAmount
    : 0;
  const taxTotal = taxItems.reduce(
    (sum, item) => sum + item.adultAmount + item.childAmount + item.infantAmount,
    0,
  );

  // SSR add-ons total
  const ssrTotal = selectedSSR.reduce((total, sel) => {
    const option = allSSROptions.find((o) => o.id === sel.ssrId);
    return total + (option?.charge || 0);
  }, 0);

  // Promo discount
  const promoDiscount = appliedPromo?.valid ? appliedPromo.discountAmount : 0;

  // Grand total
  const grandTotal = totalFare.gross + ssrTotal - promoDiscount;

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
        {/* Base Fare */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Base Fare</span>
          <span className="text-gray-900 font-medium">
            {formatCurrency(baseFareTotal, totalFare.currency)}
          </span>
        </div>

        {/* Tax & Charges */}
        {taxTotal > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tax & Charges</span>
            <span className="text-gray-900 font-medium">
              {formatCurrency(taxTotal, totalFare.currency)}
            </span>
          </div>
        )}

        {/* Add-ons */}
        {ssrTotal > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              Add-ons ({selectedSSR.length} item{selectedSSR.length > 1 ? 's' : ''})
            </span>
            <span className="text-gray-900 font-medium">
              {formatCurrency(ssrTotal, totalFare.currency)}
            </span>
          </div>
        )}

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

        {/* Confirm & Pay button — only on last step */}
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
