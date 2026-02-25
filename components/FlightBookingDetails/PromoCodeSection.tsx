'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  getPromoCodes,
  validatePromoCode,
  type PromoCodeListItem,
  type PromoValidationResult,
} from '@/lib/flights-api';

interface PromoCodeSectionProps {
  totalAmount: number;
  currency: string;
  serviceType: string;
  appliedPromo: PromoValidationResult | null;
  onApplyPromo: (result: PromoValidationResult | null) => void;
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency || 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export const PromoCodeSection = ({
  totalAmount,
  currency,
  serviceType,
  appliedPromo,
  onApplyPromo,
}: PromoCodeSectionProps) => {
  const [promoCodes, setPromoCodes] = useState<PromoCodeListItem[]>([]);
  const [manualCode, setManualCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const fetchPromos = useCallback(async () => {
    try {
      const codes = await getPromoCodes(serviceType);
      setPromoCodes(codes);
    } catch {
      // Silently fail - promo codes are optional
    }
  }, [serviceType]);

  useEffect(() => {
    fetchPromos();
  }, [fetchPromos]);

  const handleApplyCode = async (code: string) => {
    if (!code.trim()) return;

    setIsValidating(true);
    setErrorMessage('');

    try {
      const result = await validatePromoCode(
        code.trim(),
        totalAmount,
        serviceType,
      );
      if (result.valid) {
        onApplyPromo(result);
        setManualCode('');
        setErrorMessage('');
      } else {
        setErrorMessage(result.message || 'Invalid promo code.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to validate promo code.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemovePromo = () => {
    onApplyPromo(null);
    setErrorMessage('');
  };

  const estimateSavings = (promo: PromoCodeListItem): string => {
    if (promo.discountType === 'PERCENTAGE') {
      let discount = Math.round(totalAmount * (promo.discountValue / 100));
      if (promo.maxDiscount) discount = Math.min(discount, promo.maxDiscount);
      return formatCurrency(discount, currency);
    }
    return formatCurrency(promo.discountValue, currency);
  };

  return (
    <div className="border-t border-gray-200 pt-4">
      {/* Header toggle */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-sm font-semibold text-gray-900 uppercase tracking-wide"
      >
        <span>Promo Code</span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Applied promo badge (always visible) */}
      {appliedPromo?.valid && (
        <div className="mt-2 flex items-center justify-between bg-green-50 border border-green-200 rounded-md px-3 py-2">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <span className="text-xs font-bold text-green-800">{appliedPromo.code}</span>
              <span className="text-xs text-green-700 ml-1">
                applied &middot; Save {formatCurrency(appliedPromo.discountAmount, currency)}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemovePromo}
            className="text-green-600 hover:text-green-800 p-0.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Expandable content */}
      {isExpanded && (
        <div className="mt-3 space-y-3">
          {/* Manual input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => {
                setManualCode(e.target.value.toUpperCase());
                setErrorMessage('');
              }}
              placeholder="Enter promo code"
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-(--color-links) focus:border-(--color-links)"
            />
            <button
              type="button"
              onClick={() => handleApplyCode(manualCode)}
              disabled={isValidating || !manualCode.trim()}
              className="px-4 py-2 text-sm font-medium bg-(--color-links) text-white rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isValidating ? '...' : 'Apply'}
            </button>
          </div>

          {/* Error message */}
          {errorMessage && (
            <p className="text-xs text-red-600">{errorMessage}</p>
          )}

          {/* Available promos list */}
          {promoCodes.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Choose from the offers below</p>
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {promoCodes.map((promo) => {
                  const isApplied = appliedPromo?.code === promo.code;
                  return (
                    <label
                      key={promo.id}
                      className={`flex items-start gap-2.5 p-2.5 rounded-md border cursor-pointer transition-colors ${
                        isApplied
                          ? 'border-green-300 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="promoCode"
                        checked={isApplied}
                        onChange={() => handleApplyCode(promo.code)}
                        className="mt-0.5 accent-(--color-links)"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-900">{promo.code}</span>
                          <span className="text-xs font-semibold text-green-600">
                            Save {estimateSavings(promo)}
                          </span>
                        </div>
                        {promo.description && (
                          <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                            {promo.description}
                          </p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
