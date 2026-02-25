'use client';

import type { FareBreakdownItem } from '@/lib/flights-api';

interface FareBreakdownProps {
  fareBreakdown: FareBreakdownItem[];
  totalFare: { net: number; gross: number; currency: string };
  passengerCounts: { adults: number; children: number; infants: number };
}

function formatCurrency(amount: number, currency: string) {
  if (!amount) return '-';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency || 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export const FareBreakdown = ({
  fareBreakdown,
  totalFare,
  passengerCounts,
}: FareBreakdownProps) => {
  const hasChildren = passengerCounts.children > 0;
  const hasInfants = passengerCounts.infants > 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Fare Breakdown
        </h2>
      </div>
      <div className="p-4 sm:p-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 uppercase">
              <th className="text-left pb-2 font-medium">Component</th>
              <th className="text-right pb-2 font-medium">
                Adult{passengerCounts.adults > 1 ? ` x${passengerCounts.adults}` : ''}
              </th>
              {hasChildren && (
                <th className="text-right pb-2 font-medium">
                  Child{passengerCounts.children > 1 ? ` x${passengerCounts.children}` : ''}
                </th>
              )}
              {hasInfants && (
                <th className="text-right pb-2 font-medium">
                  Infant{passengerCounts.infants > 1 ? ` x${passengerCounts.infants}` : ''}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {fareBreakdown.map((item, i) => (
              <tr key={i}>
                <td className="py-2 text-gray-700">{item.label}</td>
                <td className="py-2 text-right text-gray-900">
                  {formatCurrency(item.adultAmount, item.currency)}
                </td>
                {hasChildren && (
                  <td className="py-2 text-right text-gray-900">
                    {formatCurrency(item.childAmount, item.currency)}
                  </td>
                )}
                {hasInfants && (
                  <td className="py-2 text-right text-gray-900">
                    {formatCurrency(item.infantAmount, item.currency)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-3 pt-3 border-t-2 border-gray-200 flex justify-between items-center">
          <span className="text-sm font-semibold text-gray-900">
            Total Fare
          </span>
          <span className="text-lg font-bold text-gray-900">
            {formatCurrency(totalFare.gross, totalFare.currency)}
          </span>
        </div>
      </div>
    </div>
  );
};
