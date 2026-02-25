'use client';

import { useState } from 'react';
import type { FareRule } from '@/lib/flights-api';

interface FareRulesAccordionProps {
  fareRules: FareRule[];
}

function formatAmount(amount: number): string {
  if (!amount) return 'N/A';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export const FareRulesAccordion = ({ fareRules }: FareRulesAccordionProps) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!fareRules || fareRules.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Fare Rules
        </h2>
      </div>
      <div className="divide-y divide-gray-100">
        {fareRules.map((rule, i) => (
          <div key={i}>
            <button
              type="button"
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-medium text-gray-800">
                {rule.category}
              </span>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform ${
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
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-500 uppercase">
                      <th className="text-left pb-1 font-medium">Time Frame</th>
                      <th className="text-right pb-1 font-medium">Adult</th>
                      <th className="text-right pb-1 font-medium">Child</th>
                      <th className="text-right pb-1 font-medium">Infant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {rule.charges.map((charge, j) => (
                      <tr key={j}>
                        <td className="py-1.5 text-gray-700">
                          {charge.description}
                        </td>
                        <td className="py-1.5 text-right text-gray-900">
                          {formatAmount(charge.adultAmount)}
                        </td>
                        <td className="py-1.5 text-right text-gray-900">
                          {formatAmount(charge.childAmount)}
                        </td>
                        <td className="py-1.5 text-right text-gray-900">
                          {formatAmount(charge.infantAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
