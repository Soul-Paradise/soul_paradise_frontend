'use client';

import { useRef } from 'react';
import { CalendarDays } from 'lucide-react';

interface DateDisplayProps {
  label: string;
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  minDate?: string;
  disabled?: boolean;
  emptyText?: string;
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
  onChange,
  minDate,
  disabled = false,
  emptyText = 'Select date',
  onClickWhenEmpty,
}: DateDisplayProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (disabled && onClickWhenEmpty) {
      onClickWhenEmpty();
      return;
    }
    if (!disabled && inputRef.current) {
      // showPicker() opens the native calendar popup
      try {
        inputRef.current.showPicker();
      } catch {
        // Fallback: focus the input so the user can interact with it
        inputRef.current.focus();
      }
    }
  };

  const parsed = value ? formatDateDisplay(value) : null;

  return (
    <div className="relative flex-1 min-w-0">
      <button
        type="button"
        onClick={handleClick}
        className={`w-full text-left px-4 py-3 transition-all min-h-[80px] cursor-pointer`}
      >
        <div className="flex items-center gap-1.5 mb-1">
          <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
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

      {/* Native date input - positioned off-screen so it doesn't intercept clicks */}
      {!disabled && (
        <input
          ref={inputRef}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={minDate || new Date().toISOString().split('T')[0]}
          className="absolute top-0 left-0 w-0 h-0 opacity-0 overflow-hidden"
          tabIndex={-1}
          aria-hidden="true"
        />
      )}
    </div>
  );
};
