'use client';

import { useState } from 'react';
import type { FareRule, FareRuleAmount } from '@/lib/flights-api';

interface FareRulesAccordionProps {
  fareRules: FareRule[];
}

/**
 * Render one penalty amount.
 *
 * Benzy sends three distinct things through these fields and the customer needs
 * to be able to tell them apart:
 *   580              → a real penalty, formatted as currency
 *   "Non Refundable" → a textual condition, shown verbatim (never as "N/A")
 *   0                → genuinely free
 *   null             → airline defined no separate amount for this pax type
 */
function renderAmount(amount: FareRuleAmount, currency?: string) {
  if (amount === null || amount === undefined) {
    return <span className="text-gray-300">-</span>;
  }
  if (typeof amount === 'string') {
    return <span className="font-medium text-amber-700">{amount}</span>;
  }
  if (amount === 0) {
    return <span className="font-medium text-emerald-700">Free</span>;
  }
  return (
    <span className="text-gray-900">
      {new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currency || 'INR',
        maximumFractionDigits: 0,
      }).format(amount)}
    </span>
  );
}

const hasValue = (a: FareRuleAmount) => a !== null && a !== undefined;

export const FareRulesAccordion = ({ fareRules }: FareRulesAccordionProps) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (!fareRules || fareRules.length === 0) return null;

  // Only show the Child/Infant columns when at least one rule actually carries
  // a value for them. Most LCC fares define adult amounts only, and rendering
  // two permanently-empty columns is what made this table look broken.
  const allCharges = fareRules.flatMap((r) => r.charges);
  const showChild = allCharges.some((c) => hasValue(c.childAmount));
  const showInfant = allCharges.some((c) => hasValue(c.infantAmount));
  const anyOmitted = allCharges.some(
    (c) =>
      !hasValue(c.childAmount) || !hasValue(c.infantAmount) || !hasValue(c.adultAmount),
  );

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Fare Rules
        </h2>
        <p className="mt-0.5 text-[11px] text-gray-500">
          Charges below are levied by the airline per passenger, per journey.
        </p>
      </div>
      <div className="divide-y divide-gray-100">
        {fareRules.map((rule, i) => (
          <div key={i}>
            <button
              type="button"
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-medium text-gray-800 flex items-center gap-2 text-left">
                {rule.category}
                {rule.sector && (
                  <span className="text-[11px] font-normal text-gray-400">
                    {rule.sector}
                  </span>
                )}
              </span>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${
                  openIndex === i ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {openIndex === i && (
              <div className="px-5 pb-4">
                {rule.charges.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-gray-500 uppercase">
                          <th className="text-left pb-1 font-medium">Condition</th>
                          <th className="text-right pb-1 font-medium">Adult</th>
                          {showChild && (
                            <th className="text-right pb-1 font-medium">Child</th>
                          )}
                          {showInfant && (
                            <th className="text-right pb-1 font-medium">Infant</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {rule.charges.map((charge, j) => (
                          <tr key={j}>
                            <td className="py-1.5 pr-3 text-gray-700">
                              {charge.description}
                            </td>
                            <td className="py-1.5 text-right whitespace-nowrap">
                              {renderAmount(charge.adultAmount, charge.currency)}
                            </td>
                            {showChild && (
                              <td className="py-1.5 text-right whitespace-nowrap">
                                {renderAmount(charge.childAmount, charge.currency)}
                              </td>
                            )}
                            {showInfant && (
                              <td className="py-1.5 text-right whitespace-nowrap">
                                {renderAmount(charge.infantAmount, charge.currency)}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {rule.text && (
                  <p className="mt-3 text-xs text-gray-600 leading-relaxed whitespace-pre-line">
                    {rule.text}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      {anyOmitted && (
        <div className="px-5 py-2.5 bg-gray-50 border-t border-gray-100 text-[11px] text-gray-500">
          - the airline has not published a separate amount for that
          passenger type; the adult charge normally applies.
        </div>
      )}
    </div>
  );
};
