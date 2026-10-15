'use client';

// Visual twin of components/FlightResults/SortTabs.tsx - keep the two in step.

export type InsuranceSortOption = 'bestValue' | 'cheapest' | 'highestCover';

interface SortTabsProps {
  activeSort: InsuranceSortOption;
  onSortChange: (sort: InsuranceSortOption) => void;
  totalResults: number;
  filteredCount: number;
}

export const InsuranceSortTabs = ({ activeSort, onSortChange, totalResults, filteredCount }: SortTabsProps) => {
  const tabs: { key: InsuranceSortOption; label: string; icon: React.ReactNode; activeClass: string }[] = [
    {
      key: 'bestValue',
      label: 'Best Value',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
      activeClass: 'bg-orange-50 border-orange-300 text-orange-700',
    },
    {
      key: 'cheapest',
      label: 'Cheapest',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      activeClass: 'bg-green-500 border-green-500 text-white',
    },
    {
      key: 'highestCover',
      label: 'Highest Cover',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      activeClass: 'bg-blue-50 border-blue-300 text-blue-700',
    },
  ];

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-2">
        {tabs.map((tab) => {
          const isActive = activeSort === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onSortChange(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-full border transition-colors ${
                isActive ? tab.activeClass : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="text-sm text-gray-500">
        Showing <span className="font-semibold text-gray-700">{filteredCount}</span> of{' '}
        <span className="font-semibold text-gray-700">{totalResults}</span> Plans found
      </div>
    </div>
  );
};
