'use client';

import Link from 'next/link';
import { POLICY_TYPE_LABELS, type InsuranceSearch } from '@/lib/insurance-api';

// Visual twin of components/FlightResults/SearchSummary.tsx - keep the two in step.

function formatHeaderDate(dateStr: string) {
  const date = new Date(dateStr + 'T00:00:00');
  const day = date.getDate().toString().padStart(2, '0');
  const month = date.toLocaleDateString('en-IN', { month: 'short' });
  const year = date.getFullYear().toString().slice(-2);
  const weekday = date.toLocaleDateString('en-IN', { weekday: 'long' });
  return { formatted: `${day} ${month}'${year}`, weekday };
}

export const InsuranceSearchSummary = ({
  search,
  backHref,
}: {
  search: InsuranceSearch;
  /** Plan/booking steps show a back arrow; the results page doesn't need one. */
  backHref?: string;
}) => {
  const start = formatHeaderDate(search.startDate);
  const end = formatHeaderDate(search.endDate);
  const pax = search.travellers.length;
  const [first, ...rest] = search.countryNames;

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          {backHref && (
            <Link href={backHref} aria-label="Back" className="p-2 -mr-2 rounded-md text-gray-500 hover:bg-gray-100 flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
          )}
          <div className="flex items-center gap-0 flex-1 min-w-0 overflow-x-auto">
            {/* Destination */}
            <div className="border border-gray-200 rounded-l-lg px-4 py-2 min-w-[160px] max-w-[260px]">
              <div className="text-[10px] text-gray-400 font-medium uppercase">Destination</div>
              <div className="text-sm font-bold text-gray-900 truncate">{first}</div>
              <div className="text-xs text-gray-500 truncate">
                {rest.length > 0 ? `+ ${rest.join(', ')}` : search.countryCodes[0]}
              </div>
            </div>

            {/* Start */}
            <div className="border border-gray-200 border-l-0 px-4 py-2 min-w-[120px]">
              <div className="text-[10px] text-gray-400 font-medium uppercase">Start Date</div>
              <div className="text-sm font-bold text-gray-900">{start.formatted}</div>
              <div className="text-xs text-gray-500">{start.weekday}</div>
            </div>

            {/* End */}
            <div className="border border-gray-200 border-l-0 px-4 py-2 min-w-[120px]">
              <div className="text-[10px] text-gray-400 font-medium uppercase">End Date</div>
              <div className="text-sm font-bold text-gray-900">{end.formatted}</div>
              <div className="text-xs text-gray-500">{end.weekday}</div>
            </div>

            {/* Travellers & Policy */}
            <div className="border border-gray-200 border-l-0 rounded-r-lg px-4 py-2 min-w-[140px]">
              <div className="text-[10px] text-gray-400 font-medium uppercase">Travellers & Policy</div>
              <div className="text-sm font-bold text-gray-900">
                {pax.toString().padStart(2, '0')} {pax === 1 ? 'Traveller' : 'Travellers'}
              </div>
              <div className="text-xs text-gray-500">{POLICY_TYPE_LABELS[search.policyType]}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href="/?tab=insurance"
              className="px-4 py-2 border-2 border-red-500 text-red-500 text-xs font-bold rounded-md hover:bg-red-50 transition-colors uppercase tracking-wide whitespace-nowrap"
            >
              Modify Search
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
