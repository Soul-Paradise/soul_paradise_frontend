'use client';

import { Clock, Star, Wallet } from 'lucide-react';
import { SortTabs as ResultsSortTabs } from '@/components/Results/ui';

export type SortOption = 'bestValue' | 'cheapest' | 'fastest';

interface SortTabsProps {
  activeSort: SortOption;
  onSortChange: (sort: SortOption) => void;
  totalResults: number;
  filteredCount: number;
}

const OPTIONS = [
  { key: 'bestValue', label: 'Best Value', icon: Star },
  { key: 'cheapest', label: 'Cheapest', icon: Wallet },
  { key: 'fastest', label: 'Fastest', icon: Clock },
] as const;

export const SortTabs = ({ activeSort, onSortChange, totalResults, filteredCount }: SortTabsProps) => (
  <ResultsSortTabs
    options={OPTIONS}
    active={activeSort}
    onChange={onSortChange}
    shown={filteredCount}
    total={totalResults}
    noun="Flights"
  />
);
