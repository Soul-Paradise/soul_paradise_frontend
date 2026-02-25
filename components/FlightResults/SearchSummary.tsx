'use client';

import Link from 'next/link';

interface SearchSummaryProps {
  from: string;
  to: string;
  fromName: string;
  toName: string;
  departDate: string;
  returnDate?: string;
  tripType: string;
  totalPax: number;
  cabin: string;
  totalResults: number;
}

const CABIN_LABELS: Record<string, string> = {
  E: 'Economy',
  PE: 'Premium Economy',
  B: 'Business',
  F: 'First Class',
};

function formatHeaderDate(dateStr: string) {
  const date = new Date(dateStr + 'T00:00:00');
  const day = date.getDate().toString().padStart(2, '0');
  const month = date.toLocaleDateString('en-IN', { month: 'short' });
  const year = date.getFullYear().toString().slice(-2);
  const weekday = date.toLocaleDateString('en-IN', { weekday: 'long' });
  return { formatted: `${day} ${month}'${year}`, weekday };
}

export const SearchSummary = ({
  from,
  to,
  fromName,
  toName,
  departDate,
  returnDate,
  tripType,
  totalPax,
  cabin,
  totalResults,
}: SearchSummaryProps) => {
  const depDate = formatHeaderDate(departDate);
  const retDate = returnDate ? formatHeaderDate(returnDate) : null;

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Search fields */}
          <div className="flex items-center gap-0 flex-1 min-w-0 overflow-x-auto">
            {/* From */}
            <div className="border border-gray-200 rounded-l-lg px-4 py-2 min-w-[140px]">
              <div className="text-[10px] text-gray-400 font-medium uppercase">From</div>
              <div className="text-sm font-bold text-gray-900 truncate">{fromName}</div>
              <div className="text-xs text-gray-500 truncate">
                {from}, {fromName?.split(' ').slice(-1)[0] || ''}...
              </div>
            </div>

            {/* To */}
            <div className="border border-gray-200 border-l-0 px-4 py-2 min-w-[140px]">
              <div className="text-[10px] text-gray-400 font-medium uppercase">To</div>
              <div className="text-sm font-bold text-gray-900 truncate">{toName}</div>
              <div className="text-xs text-gray-500 truncate">
                {to}, {toName?.split(' ').slice(-1)[0] || ''}...
              </div>
            </div>

            {/* Departure */}
            <div className="border border-gray-200 border-l-0 px-4 py-2 min-w-[120px]">
              <div className="text-[10px] text-gray-400 font-medium uppercase">Departure</div>
              <div className="text-sm font-bold text-gray-900">{depDate.formatted}</div>
              <div className="text-xs text-gray-500">{depDate.weekday}</div>
            </div>

            {/* Return (if roundtrip) */}
            {tripType === 'roundtrip' && retDate && (
              <div className="border border-gray-200 border-l-0 px-4 py-2 min-w-[120px]">
                <div className="text-[10px] text-gray-400 font-medium uppercase">Return</div>
                <div className="text-sm font-bold text-gray-900">{retDate.formatted}</div>
                <div className="text-xs text-gray-500">{retDate.weekday}</div>
              </div>
            )}

            {/* Travellers & Class */}
            <div className="border border-gray-200 border-l-0 rounded-r-lg px-4 py-2 min-w-[140px]">
              <div className="text-[10px] text-gray-400 font-medium uppercase">Travellers & Class</div>
              <div className="text-sm font-bold text-gray-900">
                {totalPax.toString().padStart(2, '0')} {totalPax === 1 ? 'Traveller' : 'Travellers'}
              </div>
              <div className="text-xs text-gray-500">{CABIN_LABELS[cabin] || 'Economy'}</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href="/"
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
