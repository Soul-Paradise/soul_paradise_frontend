'use client';

import { CalendarDays, PlaneLanding, PlaneTakeoff, Users } from 'lucide-react';
import { SummaryBar, type SummaryField } from '@/components/Results/ui';

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
}: SearchSummaryProps) => {
  const depDate = formatHeaderDate(departDate);
  const retDate = returnDate ? formatHeaderDate(returnDate) : null;

  const fields: SummaryField[] = [
    { label: 'From', icon: PlaneTakeoff, value: fromName, sub: from },
    { label: 'To', icon: PlaneLanding, value: toName, sub: to },
    { label: 'Departure', icon: CalendarDays, value: depDate.formatted, sub: depDate.weekday },
  ];
  if (tripType === 'roundtrip' && retDate) {
    fields.push({ label: 'Return', icon: CalendarDays, value: retDate.formatted, sub: retDate.weekday });
  }
  fields.push({
    label: 'Travellers',
    icon: Users,
    value: `${totalPax.toString().padStart(2, '0')} ${totalPax === 1 ? 'Traveller' : 'Travellers'}`,
    sub: CABIN_LABELS[cabin] || 'Economy',
  });

  return <SummaryBar fields={fields} modifyHref="/?tab=flights#booking" />;
};
