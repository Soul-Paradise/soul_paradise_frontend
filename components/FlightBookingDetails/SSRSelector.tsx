'use client';

import { useState, useMemo } from 'react';
import type { SSROption, SSRSelection, SegmentDetail } from '@/lib/flights-api';

interface SSRSelectorProps {
  segments: SegmentDetail[];
  baggageOptions: SSROption[];
  mealOptions: SSROption[];
  priorityOptions: SSROption[];
  sportsOptions: SSROption[];
  fastForwardOptions: SSROption[];
  passengerCount: number;
  selectedSSR: SSRSelection[];
  onSSRChange: (selections: SSRSelection[]) => void;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/* ─── Category Icons (inline SVG) ─── */

const BaggageIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="6" y="7" width="12" height="14" rx="2" />
    <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    <line x1="6" y1="12" x2="18" y2="12" />
  </svg>
);

const MealIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
    <line x1="6" y1="1" x2="6" y2="4" />
    <line x1="10" y1="1" x2="10" y2="4" />
    <line x1="14" y1="1" x2="14" y2="4" />
  </svg>
);

const PriorityIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const SportsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20M2 12h20" />
  </svg>
);

const FastForwardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 4 15 12 5 20 5 4" />
    <line x1="19" y1="5" x2="19" y2="19" />
  </svg>
);

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

type CategoryConfig = {
  key: string;
  label: string;
  subtitle: string;
  icon: React.ReactNode;
  options: SSROption[];
  singleSelect: boolean;
  color: string;
  bgColor: string;
  borderColor: string;
};

export const SSRSelector = ({
  segments,
  baggageOptions,
  mealOptions,
  priorityOptions,
  sportsOptions,
  fastForwardOptions,
  passengerCount,
  selectedSSR,
  onSSRChange,
}: SSRSelectorProps) => {
  const categories: CategoryConfig[] = useMemo(
    () =>
      [
        {
          key: 'baggage',
          label: 'Extra Baggage',
          subtitle: 'Add extra checked baggage to your trip',
          icon: <BaggageIcon />,
          options: baggageOptions,
          singleSelect: true,
          color: '#7c3aed',
          bgColor: '#f5f3ff',
          borderColor: '#c4b5fd',
        },
        {
          key: 'meals',
          label: 'Meals',
          subtitle: 'Pre-order your in-flight meal',
          icon: <MealIcon />,
          options: mealOptions,
          singleSelect: false,
          color: '#ea580c',
          bgColor: '#fff7ed',
          borderColor: '#fdba74',
        },
        {
          key: 'priority',
          label: 'Priority Services',
          subtitle: 'Skip the queue with priority check-in & boarding',
          icon: <PriorityIcon />,
          options: priorityOptions,
          singleSelect: true,
          color: '#0284c7',
          bgColor: '#f0f9ff',
          borderColor: '#7dd3fc',
        },
        {
          key: 'sports',
          label: 'Sports Equipment',
          subtitle: 'Carry your sports gear on board',
          icon: <SportsIcon />,
          options: sportsOptions,
          singleSelect: false,
          color: '#059669',
          bgColor: '#ecfdf5',
          borderColor: '#6ee7b7',
        },
        {
          key: 'fastForward',
          label: 'Fast Forward',
          subtitle: 'Priority baggage delivery at arrival',
          icon: <FastForwardIcon />,
          options: fastForwardOptions,
          singleSelect: true,
          color: '#d97706',
          bgColor: '#fffbeb',
          borderColor: '#fcd34d',
        },
      ].filter((c) => c.options.length > 0),
    [baggageOptions, mealOptions, priorityOptions, sportsOptions, fastForwardOptions],
  );

  const allOptions = categories.flatMap((c) => c.options);
  const uniqueFuids = Array.from(new Set(allOptions.map((o) => o.fuid)));

  const [activeSegmentIdx, setActiveSegmentIdx] = useState(0);
  const [activePaxId, setActivePaxId] = useState(1);

  const activeFuid = uniqueFuids[activeSegmentIdx] ?? uniqueFuids[0];

  const handleSelect = (fuid: number, paxId: number, ssrId: number) => {
    const existing = selectedSSR.findIndex(
      (s) => s.fuid === fuid && s.paxId === paxId && s.ssrId === ssrId,
    );

    if (existing >= 0) {
      onSSRChange(selectedSSR.filter((_, i) => i !== existing));
      return;
    }

    let updated = [...selectedSSR];

    const category = categories.find((c) =>
      c.options.some((o) => o.id === ssrId),
    );
    if (category?.singleSelect) {
      const categoryIds = new Set(category.options.map((o) => o.id));
      updated = updated.filter(
        (s) =>
          !(s.fuid === fuid && s.paxId === paxId && categoryIds.has(s.ssrId)),
      );
    }

    updated.push({ fuid, paxId, ssrId });
    onSSRChange(updated);
  };

  const isSelected = (fuid: number, paxId: number, ssrId: number) =>
    selectedSSR.some(
      (s) => s.fuid === fuid && s.paxId === paxId && s.ssrId === ssrId,
    );

  // Total selected cost
  const totalAddOnCost = selectedSSR.reduce((sum, sel) => {
    const opt = allOptions.find((o) => o.id === sel.ssrId && o.fuid === sel.fuid);
    return sum + (opt?.charge || 0);
  }, 0);

  if (allOptions.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-bold text-gray-900 tracking-tight">
            Enhance Your Trip
          </h2>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Add meals, baggage & more · All optional
          </p>
        </div>
        {totalAddOnCost > 0 && (
          <div className="text-right">
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
              Add-ons
            </div>
            <div className="text-sm font-bold text-gray-900">
              {formatCurrency(totalAddOnCost)}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 sm:p-5 space-y-5">
        {/* Segment tabs (only if multi-segment) */}
        {uniqueFuids.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {uniqueFuids.map((fuid, idx) => {
              const seg = segments.find((s) => s.fuid === fuid);
              const isActive = idx === activeSegmentIdx;
              return (
                <button
                  key={fuid}
                  type="button"
                  onClick={() => setActiveSegmentIdx(idx)}
                  className="shrink-0 transition-all"
                  style={{
                    padding: '8px 16px',
                    fontSize: 12,
                    fontWeight: isActive ? 700 : 500,
                    borderRadius: 10,
                    border: `1.5px solid ${isActive ? '#3b82f6' : '#e5e7eb'}`,
                    background: isActive ? '#eff6ff' : '#fafafa',
                    color: isActive ? '#1d4ed8' : '#6b7280',
                  }}
                >
                  {seg ? `${seg.from} → ${seg.to}` : `Segment ${idx + 1}`}
                </button>
              );
            })}
          </div>
        )}

        {/* Flight info */}
        {segments.find((s) => s.fuid === activeFuid) && (
          <div
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl"
            style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: '#e0f2fe' }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#0284c7"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
              </svg>
            </div>
            <div className="text-xs">
              <span className="font-bold text-gray-800">
                {segments.find((s) => s.fuid === activeFuid)!.from} →{' '}
                {segments.find((s) => s.fuid === activeFuid)!.to}
              </span>
              <span className="text-gray-400 mx-1.5">·</span>
              <span className="text-gray-500">
                {segments.find((s) => s.fuid === activeFuid)!.flightNo} ·{' '}
                {segments.find((s) => s.fuid === activeFuid)!.airline}
              </span>
            </div>
          </div>
        )}

        {/* Passenger selector (only if multiple passengers) */}
        {passengerCount > 1 && (
          <div>
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Selecting for
            </div>
            <div className="flex gap-2 flex-wrap">
              {Array.from({ length: passengerCount }, (_, i) => {
                const paxId = i + 1;
                const isActive = paxId === activePaxId;
                const paxSelections = selectedSSR.filter(
                  (s) => s.paxId === paxId && s.fuid === activeFuid,
                );
                return (
                  <button
                    key={paxId}
                    type="button"
                    onClick={() => setActivePaxId(paxId)}
                    className="transition-all"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 14px 6px 6px',
                      fontSize: 12,
                      fontWeight: isActive ? 700 : 500,
                      borderRadius: 50,
                      border: `2px solid ${isActive ? '#3b82f6' : '#e5e7eb'}`,
                      background: isActive ? '#eff6ff' : '#fff',
                      color: isActive ? '#1d4ed8' : '#6b7280',
                      boxShadow: isActive ? '0 0 0 3px #3b82f620' : 'none',
                    }}
                  >
                    <span
                      className="flex items-center justify-center shrink-0"
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        background: isActive ? '#3b82f6' : '#d1d5db',
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {paxSelections.length > 0 ? '✓' : paxId}
                    </span>
                    <span>Passenger {paxId}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Category sections */}
        {categories.map((cat) => {
          const segOptions = cat.options.filter((o) => o.fuid === activeFuid);
          if (segOptions.length === 0) return null;

          return (
            <CategorySection
              key={cat.key}
              category={cat}
              options={segOptions}
              paxId={activePaxId}
              passengerCount={passengerCount}
              fuid={activeFuid}
              isSelected={isSelected}
              onSelect={handleSelect}
            />
          );
        })}

        {/* Selected summary */}
        {selectedSSR.length > 0 && (
          <div
            className="rounded-xl p-4 space-y-2"
            style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                Selected Add-ons
              </span>
              <span className="text-xs font-bold text-emerald-800">
                {formatCurrency(totalAddOnCost)}
              </span>
            </div>
            {selectedSSR.map((sel) => {
              const opt = allOptions.find(
                (o) => o.id === sel.ssrId && o.fuid === sel.fuid,
              );
              if (!opt) return null;
              return (
                <div
                  key={`${sel.fuid}-${sel.paxId}-${sel.ssrId}`}
                  className="flex justify-between items-center text-xs text-gray-600"
                >
                  <span className="flex items-center gap-2">
                    {passengerCount > 1 && (
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0"
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          background: '#3b82f6',
                        }}
                      >
                        {sel.paxId}
                      </span>
                    )}
                    <span className="text-gray-800 font-medium">
                      {opt.description}
                    </span>
                  </span>
                  <span className="font-semibold text-gray-800 tabular-nums">
                    {opt.charge > 0 ? formatCurrency(opt.charge) : 'Free'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════ */
/*          CATEGORY SECTION                   */
/* ═══════════════════════════════════════════ */

function CategorySection({
  category,
  options,
  paxId,
  passengerCount,
  fuid,
  isSelected,
  onSelect,
}: {
  category: CategoryConfig;
  options: SSROption[];
  paxId: number;
  passengerCount: number;
  fuid: number;
  isSelected: (fuid: number, paxId: number, ssrId: number) => boolean;
  onSelect: (fuid: number, paxId: number, ssrId: number) => void;
}) {
  const isMeals = category.key === 'meals';
  const isBaggage = category.key === 'baggage';

  // For single-passenger, show inline; for multi, show for active pax
  const paxIds =
    passengerCount === 1 ? [1] : [paxId];

  return (
    <div>
      {/* Category header */}
      <div className="flex items-center gap-2.5 mb-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: category.bgColor, color: category.color }}
        >
          {category.icon}
        </div>
        <div>
          <h3
            className="text-[13px] font-bold"
            style={{ color: category.color }}
          >
            {category.label}
          </h3>
          <p className="text-[10px] text-gray-400">{category.subtitle}</p>
        </div>
      </div>

      {/* Options */}
      {paxIds.map((pid) => (
        <div key={pid}>
          {isMeals ? (
            <MealGrid
              options={options}
              fuid={fuid}
              paxId={pid}
              isSelected={isSelected}
              onSelect={onSelect}
              color={category.color}
              borderColor={category.borderColor}
            />
          ) : isBaggage ? (
            <BaggageList
              options={options}
              fuid={fuid}
              paxId={pid}
              isSelected={isSelected}
              onSelect={onSelect}
              color={category.color}
              bgColor={category.bgColor}
              borderColor={category.borderColor}
            />
          ) : (
            <GenericOptions
              options={options}
              fuid={fuid}
              paxId={pid}
              isSelected={isSelected}
              onSelect={onSelect}
              color={category.color}
              bgColor={category.bgColor}
              borderColor={category.borderColor}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════ */
/*          MEAL GRID                          */
/* ═══════════════════════════════════════════ */

function MealGrid({
  options,
  fuid,
  paxId,
  isSelected,
  onSelect,
  color,
  borderColor,
}: {
  options: SSROption[];
  fuid: number;
  paxId: number;
  isSelected: (fuid: number, paxId: number, ssrId: number) => boolean;
  onSelect: (fuid: number, paxId: number, ssrId: number) => void;
  color: string;
  borderColor: string;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
      {options.map((opt) => {
        const selected = isSelected(fuid, paxId, opt.id);
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onSelect(fuid, paxId, opt.id)}
            className="text-left rounded-xl border-2 transition-all relative overflow-hidden group"
            style={{
              borderColor: selected ? color : '#e5e7eb',
              background: selected ? `${color}08` : '#fff',
              boxShadow: selected ? `0 0 0 1px ${color}30` : 'none',
            }}
          >
            {/* Meal image placeholder */}
            <div
              className="h-20 flex items-center justify-center"
              style={{
                background: selected
                  ? `linear-gradient(135deg, ${color}15, ${color}08)`
                  : 'linear-gradient(135deg, #fef3c7 0%, #ffedd5 100%)',
              }}
            >
              {opt.mealImage ? (
                <img
                  src={`https://b2bapiutils.benzyinfotech.com/images/meals/${opt.mealImage}`}
                  alt={opt.description}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (
                      e.target as HTMLImageElement
                    ).nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={opt.mealImage ? 'hidden' : ''}>
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={selected ? color : '#d97706'}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.5}
                >
                  <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                  <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                  <line x1="6" y1="1" x2="6" y2="4" />
                  <line x1="10" y1="1" x2="10" y2="4" />
                  <line x1="14" y1="1" x2="14" y2="4" />
                </svg>
              </div>
            </div>

            <div className="px-2.5 py-2">
              <p
                className="text-[11px] font-semibold leading-tight line-clamp-2"
                style={{ color: selected ? color : '#374151' }}
              >
                {opt.description}
              </p>
              <p
                className="text-[11px] font-bold mt-1"
                style={{ color: selected ? color : '#6b7280' }}
              >
                {opt.charge > 0 ? formatCurrency(opt.charge) : 'Free'}
              </p>
            </div>

            {/* Selected checkmark badge */}
            {selected && (
              <div
                className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: color, color: '#fff' }}
              >
                <CheckIcon />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════ */
/*          BAGGAGE LIST                       */
/* ═══════════════════════════════════════════ */

function BaggageList({
  options,
  fuid,
  paxId,
  isSelected,
  onSelect,
  color,
  bgColor,
  borderColor,
}: {
  options: SSROption[];
  fuid: number;
  paxId: number;
  isSelected: (fuid: number, paxId: number, ssrId: number) => boolean;
  onSelect: (fuid: number, paxId: number, ssrId: number) => void;
  color: string;
  bgColor: string;
  borderColor: string;
}) {
  return (
    <div className="space-y-2">
      {options.map((opt) => {
        const selected = isSelected(fuid, paxId, opt.id);
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onSelect(fuid, paxId, opt.id)}
            className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border-2 transition-all text-left"
            style={{
              borderColor: selected ? color : '#e5e7eb',
              background: selected ? bgColor : '#fff',
              boxShadow: selected ? `0 0 0 1px ${color}30` : 'none',
            }}
          >
            {/* Icon */}
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{
                background: selected ? `${color}20` : '#f3f4f6',
                color: selected ? color : '#9ca3af',
              }}
            >
              <BaggageIcon />
            </div>

            {/* Description */}
            <div className="flex-1 min-w-0">
              <p
                className="text-[12px] font-semibold truncate"
                style={{ color: selected ? color : '#374151' }}
              >
                {opt.description}
              </p>
              <p className="text-[10px] text-gray-400">{opt.code}</p>
            </div>

            {/* Price + check */}
            <div className="flex items-center gap-2 shrink-0">
              <span
                className="text-[12px] font-bold tabular-nums"
                style={{ color: selected ? color : '#374151' }}
              >
                {opt.charge > 0 ? formatCurrency(opt.charge) : 'Free'}
              </span>
              <div
                className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
                style={{
                  borderColor: selected ? color : '#d1d5db',
                  background: selected ? color : 'transparent',
                  color: '#fff',
                }}
              >
                {selected && <CheckIcon />}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════ */
/*          GENERIC OPTIONS (Priority, etc.)   */
/* ═══════════════════════════════════════════ */

function GenericOptions({
  options,
  fuid,
  paxId,
  isSelected,
  onSelect,
  color,
  bgColor,
  borderColor,
}: {
  options: SSROption[];
  fuid: number;
  paxId: number;
  isSelected: (fuid: number, paxId: number, ssrId: number) => boolean;
  onSelect: (fuid: number, paxId: number, ssrId: number) => void;
  color: string;
  bgColor: string;
  borderColor: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const selected = isSelected(fuid, paxId, opt.id);
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onSelect(fuid, paxId, opt.id)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all"
            style={{
              borderColor: selected ? color : '#e5e7eb',
              background: selected ? bgColor : '#fff',
              boxShadow: selected ? `0 0 0 1px ${color}30` : 'none',
            }}
          >
            {selected && (
              <span
                className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                style={{ background: color, color: '#fff' }}
              >
                <CheckIcon />
              </span>
            )}
            <span
              className="text-[12px] font-semibold"
              style={{ color: selected ? color : '#374151' }}
            >
              {opt.description}
            </span>
            <span
              className="text-[11px] font-bold tabular-nums"
              style={{ color: selected ? color : '#9ca3af' }}
            >
              {opt.charge > 0 ? formatCurrency(opt.charge) : 'Free'}
            </span>
          </button>
        );
      })}
    </div>
  );
}
