'use client';

import { ShieldCheck, Star, Wallet } from 'lucide-react';
import { SortTabs } from '@/components/Results/ui';

export type InsuranceSortOption = 'bestValue' | 'cheapest' | 'highestCover';

interface SortTabsProps {
  activeSort: InsuranceSortOption;
  onSortChange: (sort: InsuranceSortOption) => void;
  totalResults: number;
  filteredCount: number;
}

const OPTIONS = [
  { key: 'bestValue', label: 'Best Value', icon: Star },
  { key: 'cheapest', label: 'Cheapest', icon: Wallet },
  { key: 'highestCover', label: 'Highest Cover', icon: ShieldCheck },
] as const;

export const InsuranceSortTabs = ({ activeSort, onSortChange, totalResults, filteredCount }: SortTabsProps) => (
  <SortTabs
    options={OPTIONS}
    active={activeSort}
    onChange={onSortChange}
    shown={filteredCount}
    total={totalResults}
    noun="Plans"
  />
);
