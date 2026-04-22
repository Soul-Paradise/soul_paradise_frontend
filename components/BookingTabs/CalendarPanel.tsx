'use client';

import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MONTH_NAMES = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
];
const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

interface CalendarMonthProps {
  year: number;
  month: number;
  selectedStart: Date | null;
  selectedEnd: Date | null;
  hoverDate: Date | null;
  minDate: Date;
  onSelect: (d: Date) => void;
  onHover: (d: Date | null) => void;
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
}

function CalendarMonth({
  year, month, selectedStart, selectedEnd, hoverDate, minDate, onSelect, onHover, leftSlot, rightSlot,
}: CalendarMonthProps) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const rangeEnd = selectedEnd || hoverDate;
  const hasRange = !!(selectedStart && rangeEnd && rangeEnd > selectedStart);

  const cells: (Date | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  return (
    <div className="flex-1 min-w-[240px]">
      <div className="flex items-center justify-between mb-2 h-6">
        <div className="w-7 flex justify-start">{leftSlot}</div>
        <div className="font-semibold text-gray-700 text-[11px] tracking-[0.15em] uppercase">
          {MONTH_NAMES[month]} {year}
        </div>
        <div className="w-7 flex justify-end">{rightSlot}</div>
      </div>
      <div className="grid grid-cols-7">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-center text-[10px] text-gray-400 font-semibold uppercase tracking-wider py-1.5">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((date, i) => {
          if (!date) return <div key={i} className="h-9" />;
          const isPast = date < minDate && !isSameDay(date, minDate);
          const isStart = !!(selectedStart && isSameDay(date, selectedStart));
          const isEnd = !!(selectedEnd && isSameDay(date, selectedEnd));
          const inRange =
            hasRange && !isStart && !isEnd &&
            !!(selectedStart && rangeEnd) && date > selectedStart! && date < rangeEnd!;
          const showRangeRight = hasRange && isStart;
          const showRangeLeft = hasRange && !!selectedEnd && isEnd;

          return (
            <div key={i} className="h-9 relative flex items-center justify-center">
              {inRange && <div className="absolute inset-y-0.5 inset-x-0 bg-blue-50" />}
              {showRangeRight && <div className="absolute inset-y-0.5 left-1/2 right-0 bg-blue-50" />}
              {showRangeLeft && <div className="absolute inset-y-0.5 right-1/2 left-0 bg-blue-50" />}
              <button
                type="button"
                disabled={isPast}
                onMouseEnter={() => !isPast && onHover(date)}
                onMouseLeave={() => onHover(null)}
                onClick={() => !isPast && onSelect(date)}
                className={[
                  'relative h-8 w-8 text-[13px] font-medium transition-colors rounded-full z-10',
                  isPast ? 'text-gray-300 cursor-not-allowed' : 'cursor-pointer',
                  isStart || isEnd
                    ? 'bg-[#1a2b6b] text-white shadow-sm'
                    : inRange
                    ? 'text-[#1a2b6b] hover:bg-blue-100'
                    : !isPast
                    ? 'text-gray-700 hover:bg-gray-100'
                    : '',
                ].join(' ')}
              >
                {date.getDate()}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export interface CalendarPanelProps {
  isOpen: boolean;
  mode: 'single' | 'range';
  startDate: Date | null;
  endDate: Date | null;
  activeTab?: 'start' | 'end';
  onActiveTabChange?: (tab: 'start' | 'end') => void;
  startLabel?: string;
  endLabel?: string;
  minDate: Date;
  onChange: (start: Date, end: Date | null) => void;
  onClose: () => void;
  className?: string;
}

export function CalendarPanel({
  isOpen, mode, startDate, endDate,
  activeTab = 'start', onActiveTabChange,
  startLabel = 'Start', endLabel = 'End',
  minDate, onChange, onClose, className,
}: CalendarPanelProps) {
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [calMonth, setCalMonth] = useState(() => {
    const ref = startDate || minDate;
    return { year: ref.getFullYear(), month: ref.getMonth() };
  });

  useEffect(() => {
    if (isOpen) {
      const ref = (activeTab === 'end' ? endDate : startDate) || startDate || minDate;
      setCalMonth({ year: ref.getFullYear(), month: ref.getMonth() });
      setHoverDate(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const isRange = mode === 'range';

  function handleSelect(date: Date) {
    if (!isRange) {
      onChange(date, null);
      onClose();
      return;
    }
    if (activeTab === 'start') {
      let newEnd = endDate;
      if (!newEnd || newEnd <= date) {
        newEnd = new Date(date);
        newEnd.setDate(date.getDate() + 1);
      }
      onChange(date, newEnd);
      onActiveTabChange?.('end');
    } else {
      if (!startDate || date <= startDate) {
        const newEnd = new Date(date);
        newEnd.setDate(date.getDate() + 1);
        onChange(date, newEnd);
      } else {
        onChange(startDate, date);
        onClose();
      }
    }
  }

  function prevMonth() {
    setCalMonth(({ year, month }) =>
      month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 }
    );
  }
  function nextMonth() {
    setCalMonth(({ year, month }) =>
      month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 }
    );
  }

  const nextCalMonth = calMonth.month === 11
    ? { year: calMonth.year + 1, month: 0 }
    : { year: calMonth.year, month: calMonth.month + 1 };

  const displayHover = isRange ? hoverDate : null;
  const displayEnd = isRange ? endDate : null;

  function formatTab(d: Date | null) {
    if (!d) return '—';
    return `${d.toLocaleString('default', { month: 'short' })} ${d.getDate()}, ${d.getFullYear()}`;
  }

  const prevBtn = (
    <button type="button" onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded-full text-gray-500" aria-label="Previous month">
      <ChevronLeft className="w-4 h-4" />
    </button>
  );
  const nextBtn = (extra = '') => (
    <button type="button" onClick={nextMonth} className={`p-1 hover:bg-gray-100 rounded-full text-gray-500 ${extra}`} aria-label="Next month">
      <ChevronRight className="w-4 h-4" />
    </button>
  );

  return (
    <div className={`absolute top-full left-0 z-50 bg-white rounded-xl shadow-2xl border border-gray-100 mt-1 p-4 w-full sm:w-[560px] sm:max-w-[calc(100vw-2rem)] ${className || ''}`}>
      {isRange && (
        <div className="flex gap-6 mb-3 border-b border-gray-100">
          <button
            type="button"
            onClick={() => onActiveTabChange?.('start')}
            className={`pb-2 text-left border-b-2 transition-colors ${activeTab === 'start' ? 'border-[#1a2b6b]' : 'border-transparent'}`}
          >
            <div className={`text-[10px] font-semibold tracking-widest uppercase ${activeTab === 'start' ? 'text-[#1a2b6b]' : 'text-gray-400'}`}>
              {startLabel}
            </div>
            <div className={`text-[13px] font-semibold ${activeTab === 'start' ? 'text-[#1a2b6b]' : 'text-gray-400'}`}>
              {formatTab(startDate)}
            </div>
          </button>
          <button
            type="button"
            onClick={() => onActiveTabChange?.('end')}
            className={`pb-2 text-left border-b-2 transition-colors ${activeTab === 'end' ? 'border-[#1a2b6b]' : 'border-transparent'}`}
          >
            <div className={`text-[10px] font-semibold tracking-widest uppercase ${activeTab === 'end' ? 'text-[#1a2b6b]' : 'text-gray-400'}`}>
              {endLabel}
            </div>
            <div className={`text-[13px] font-semibold ${activeTab === 'end' ? 'text-[#1a2b6b]' : 'text-gray-400'}`}>
              {formatTab(endDate)}
            </div>
          </button>
        </div>
      )}
      <div className="flex gap-4 items-start">
        <CalendarMonth
          year={calMonth.year} month={calMonth.month}
          selectedStart={startDate} selectedEnd={displayEnd} hoverDate={displayHover}
          minDate={minDate}
          onSelect={handleSelect}
          onHover={isRange ? setHoverDate : () => {}}
          leftSlot={prevBtn}
          rightSlot={nextBtn('sm:hidden')}
        />
        <div className="hidden sm:flex flex-1">
          <CalendarMonth
            year={nextCalMonth.year} month={nextCalMonth.month}
            selectedStart={startDate} selectedEnd={displayEnd} hoverDate={displayHover}
            minDate={minDate}
            onSelect={handleSelect}
            onHover={isRange ? setHoverDate : () => {}}
            rightSlot={nextBtn()}
          />
        </div>
      </div>
    </div>
  );
}
