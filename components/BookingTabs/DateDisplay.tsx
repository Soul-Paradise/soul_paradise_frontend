'use client';

import { CalendarDays } from 'lucide-react';
import { DateValue, FieldLabel, fieldCell } from './ui';

interface DateDisplayProps {
  label: string;
  value: string; // YYYY-MM-DD
  disabled?: boolean;
  emptyText?: string;
  active?: boolean;
  onClick?: () => void;
  onClickWhenEmpty?: () => void;
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const DAYS = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday',
  'Thursday', 'Friday', 'Saturday',
];

function formatDateDisplay(dateStr: string) {
  const date = new Date(dateStr + 'T00:00:00');
  const day = date.getDate();
  const month = MONTHS[date.getMonth()];
  const year = date.getFullYear().toString().slice(-2);
  const dayOfWeek = DAYS[date.getDay()];
  return { day, month, year, dayOfWeek };
}

export const DateDisplay = ({
  label,
  value,
  disabled = false,
  emptyText = 'Select date',
  active = false,
  onClick,
  onClickWhenEmpty,
}: DateDisplayProps) => {
  const handleClick = () => {
    if (disabled) {
      onClickWhenEmpty?.();
      return;
    }
    onClick?.();
  };

  const parsed = value ? formatDateDisplay(value) : null;

  return (
    <div className="relative flex-1 min-w-0">
      <button
        type="button"
        onClick={handleClick}
        className={`w-full h-full cursor-pointer ${fieldCell(active)}`}
      >
        <FieldLabel icon={CalendarDays} active={active}>
          {label}
        </FieldLabel>
        {parsed ? (
          <DateValue day={parsed.day} monthYear={`${parsed.month}'${parsed.year}`} weekday={parsed.dayOfWeek} />
        ) : (
          <div className="text-xs text-gray-400 leading-relaxed">
            {disabled ? emptyText : 'Select date'}
          </div>
        )}
      </button>
    </div>
  );
};
