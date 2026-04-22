'use client';

import { CalendarDays } from 'lucide-react';

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
        className={`w-full text-left px-4 py-3 transition-all min-h-[80px] cursor-pointer ${active ? 'bg-blue-50' : ''}`}
      >
        <div className="flex items-center gap-1.5 mb-1">
          <CalendarDays className={`w-3.5 h-3.5 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
          <span className={`text-[11px] font-medium uppercase tracking-wider ${active ? 'text-blue-600' : 'text-gray-400'}`}>
            {label}
          </span>
        </div>
        {parsed ? (
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-gray-900 leading-tight">
                {parsed.day}
              </span>
              <span className="text-sm font-medium text-gray-600">
                {parsed.month}&apos;{parsed.year}
              </span>
            </div>
            <div className="text-xs text-gray-500">{parsed.dayOfWeek}</div>
          </div>
        ) : (
          <div className="text-xs text-gray-400 mt-1 leading-relaxed">
            {disabled ? emptyText : 'Select date'}
          </div>
        )}
      </button>
    </div>
  );
};
