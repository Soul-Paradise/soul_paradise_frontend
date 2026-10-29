'use client';

import { CalendarDays, MapPin, Users } from 'lucide-react';
import { POLICY_TYPE_LABELS, type InsuranceSearch } from '@/lib/insurance-api';
import { SummaryBar } from '@/components/Results/ui';

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
    <SummaryBar
      backHref={backHref}
      modifyHref="/?tab=insurance#booking"
      fields={[
        {
          label: 'Destination',
          icon: MapPin,
          value: first,
          sub: rest.length > 0 ? `+ ${rest.join(', ')}` : search.countryCodes[0],
        },
        { label: 'Start Date', icon: CalendarDays, value: start.formatted, sub: start.weekday },
        { label: 'End Date', icon: CalendarDays, value: end.formatted, sub: end.weekday },
        {
          label: 'Travellers',
          icon: Users,
          value: `${pax.toString().padStart(2, '0')} ${pax === 1 ? 'Traveller' : 'Travellers'}`,
          sub: POLICY_TYPE_LABELS[search.policyType],
        },
      ]}
    />
  );
};
