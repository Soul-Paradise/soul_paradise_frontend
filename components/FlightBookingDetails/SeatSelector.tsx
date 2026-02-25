'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type {
  SegmentSeatMap,
  SeatInfo,
  SegmentDetail,
  SSRSelection,
} from '@/lib/flights-api';

/* ─── Props ─── */
interface SeatSelectorProps {
  seatMaps: SegmentSeatMap[];
  segments: SegmentDetail[];
  passengerCount: number;
  selectedSeats: SSRSelection[];
  onSeatChange: (selections: SSRSelection[]) => void;
}

/* ─── Helpers ─── */
function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/* ─── Seat type palette ─── */
const SEAT_STYLES: Record<
  string,
  { bg: string; border: string; hoverBg: string; label: string; dot: string }
> = {
  FS:  { bg: '#bbf7d0', border: '#4ade80', hoverBg: '#86efac', label: 'Free',           dot: '#22c55e' },
  SS:  { bg: '#e0f2fe', border: '#7dd3fc', hoverBg: '#bae6fd', label: 'Standard',        dot: '#38bdf8' },
  PS:  { bg: '#dbeafe', border: '#93c5fd', hoverBg: '#bfdbfe', label: 'Preferred',       dot: '#3b82f6' },
  PRS: { bg: '#fef08a', border: '#facc15', hoverBg: '#fde047', label: 'Premium',         dot: '#eab308' },
  EES: { bg: '#fecaca', border: '#f87171', hoverBg: '#fca5a5', label: 'Emergency Exit',  dot: '#ef4444' },
  SM:  { bg: '#e9d5ff', border: '#c084fc', hoverBg: '#d8b4fe', label: 'Spicemax',        dot: '#a855f7' },
  OT:  { bg: '#e0f2fe', border: '#7dd3fc', hoverBg: '#bae6fd', label: 'Standard',        dot: '#38bdf8' },
  MR:  { bg: '#e0f2fe', border: '#7dd3fc', hoverBg: '#bae6fd', label: 'Standard',        dot: '#38bdf8' },
};

function getSeatStyle(seat: SeatInfo) {
  return SEAT_STYLES[seat.seatType] || SEAT_STYLES.OT;
}

/* ─── Passenger colors ─── */
const PAX_COLORS = [
  { ring: '#059669', bg: '#059669', light: '#d1fae5' },
  { ring: '#2563eb', bg: '#2563eb', light: '#dbeafe' },
  { ring: '#d97706', bg: '#d97706', light: '#fef3c7' },
  { ring: '#dc2626', bg: '#dc2626', light: '#fee2e2' },
  { ring: '#7c3aed', bg: '#7c3aed', light: '#ede9fe' },
  { ring: '#0891b2', bg: '#0891b2', light: '#cffafe' },
  { ring: '#be185d', bg: '#be185d', light: '#fce7f3' },
  { ring: '#4338ca', bg: '#4338ca', light: '#e0e7ff' },
  { ring: '#65a30d', bg: '#65a30d', light: '#ecfccb' },
];
const paxColor = (id: number) => PAX_COLORS[(id - 1) % PAX_COLORS.length];

/* ═══════════════════════════════════════════ */
/*             SEAT SELECTOR                   */
/* ═══════════════════════════════════════════ */
export const SeatSelector = ({
  seatMaps,
  segments,
  passengerCount,
  selectedSeats,
  onSeatChange,
}: SeatSelectorProps) => {
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);
  const [activePaxId, setActivePaxId] = useState(1);
  const [hoveredSeat, setHoveredSeat] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentSeatMap = seatMaps[activeSegmentIndex];

  /* Auto-advance to next unseated pax */
  const prevSelCount = useRef(selectedSeats.length);
  useEffect(() => {
    if (selectedSeats.length > prevSelCount.current && currentSeatMap) {
      const fuid = currentSeatMap.fuid;
      for (let p = 1; p <= passengerCount; p++) {
        if (!selectedSeats.some((s) => s.paxId === p && s.fuid === fuid)) {
          setActivePaxId(p);
          break;
        }
      }
    }
    prevSelCount.current = selectedSeats.length;
  }, [selectedSeats, passengerCount, currentSeatMap]);

  /* Row computation */
  const seatRows = useMemo(() => {
    if (!currentSeatMap) return [];
    const byRow = new Map<number, SeatInfo[]>();
    for (const seat of currentSeatMap.seats) {
      if (!byRow.has(seat.y)) byRow.set(seat.y, []);
      byRow.get(seat.y)!.push(seat);
    }
    return Array.from(byRow.entries())
      .sort(([a], [b]) => a - b)
      .map(([y, seats]) => ({
        y,
        seats: seats.sort((a, b) => a.x - b.x),
        rowLabel: seats[0]?.seatNumber.replace(/[A-Z]/g, '') || '',
      }));
  }, [currentSeatMap]);

  /* Aisle detection */
  const aisleGapX = useMemo(() => {
    if (!currentSeatMap || seatRows.length === 0) return -1;
    const uniqueX = Array.from(new Set(currentSeatMap.seats.map((s) => s.x))).sort((a, b) => a - b);
    let maxGap = 0;
    let gapAfterX = -1;
    for (let i = 1; i < uniqueX.length; i++) {
      const gap = uniqueX[i] - uniqueX[i - 1];
      if (gap > maxGap) { maxGap = gap; gapAfterX = uniqueX[i - 1]; }
    }
    return maxGap > 1 ? gapAfterX : -1;
  }, [currentSeatMap, seatRows]);

  /* Legend types */
  const presentTypes = useMemo(() => {
    if (!currentSeatMap) return [];
    const seen = new Set<string>();
    const result: { key: string; label: string; dot: string; bg: string; border: string }[] = [];
    for (const seat of currentSeatMap.seats) {
      const k = seat.seatType;
      if (!seen.has(k) && SEAT_STYLES[k]) {
        seen.add(k);
        result.push({ key: k, label: SEAT_STYLES[k].label, dot: SEAT_STYLES[k].dot, bg: SEAT_STYLES[k].bg, border: SEAT_STYLES[k].border });
      }
    }
    return result;
  }, [currentSeatMap]);

  /* Seat owner lookup */
  const getSeatOwner = useCallback(
    (ssid: number, fuid: number): number | null => {
      const sel = selectedSeats.find((s) => s.ssrId === ssid && s.fuid === fuid);
      return sel ? sel.paxId : null;
    },
    [selectedSeats],
  );

  /* Click handler */
  const handleSeatClick = useCallback(
    (seat: SeatInfo) => {
      if (!seat.available || !currentSeatMap) return;
      const fuid = currentSeatMap.fuid;
      const owner = getSeatOwner(seat.ssid, fuid);
      if (owner === activePaxId) {
        onSeatChange(selectedSeats.filter((s) => !(s.fuid === fuid && s.ssrId === seat.ssid && s.paxId === activePaxId)));
        return;
      }
      if (owner !== null) return;
      const updated = selectedSeats.filter((s) => !(s.fuid === fuid && s.paxId === activePaxId));
      updated.push({ fuid, paxId: activePaxId, ssrId: seat.ssid });
      onSeatChange(updated);
    },
    [currentSeatMap, activePaxId, selectedSeats, onSeatChange, getSeatOwner],
  );

  if (!seatMaps || seatMaps.length === 0) return null;

  const matchingSegment = segments.find((s) => s.fuid === currentSeatMap?.fuid);

  /* ─── Layout constants ─── */
  const SEAT_SIZE = 34;
  const SEAT_GAP = 4;
  const AISLE_W = 30;
  const ROW_LBL_W = 24;
  const cols = seatRows.length > 0 ? seatRows[0].seats.length : 6;
  const seatGridW = ROW_LBL_W + cols * (SEAT_SIZE + SEAT_GAP) + (aisleGapX > 0 ? AISLE_W : 0);
  const SIDE_PADDING = 18;
  const WALL_T = 3;
  const fuselageInnerW = seatGridW + SIDE_PADDING * 2;
  const fuselageW = fuselageInnerW + WALL_T * 2;
  const cx = fuselageW / 2;

  /* Summary */
  const segSeats = selectedSeats.filter((s) => s.fuid === currentSeatMap?.fuid);
  const totalCost = segSeats.reduce((sum, sel) => {
    const seat = currentSeatMap?.seats.find((s) => s.ssid === sel.ssrId);
    return sum + (seat ? seat.fare + seat.tax : 0);
  }, 0);

  /* Wing placement near exit rows or mid-fuselage */
  const exitRowIndices = seatRows.map((r, i) => (r.seats.some((s) => s.seatType === 'EES') ? i : -1)).filter((i) => i >= 0);
  const wingRowCenter = exitRowIndices.length > 0 ? exitRowIndices[0] : Math.floor(seatRows.length / 2);
  const ROW_H = SEAT_SIZE + SEAT_GAP;
  const SERVICE_H = 46;
  const COL_HEADER_H = 28;
  const wingTopInBody = COL_HEADER_H + wingRowCenter * ROW_H - 20;
  const NOSE_H = 180;
  const wingTopOffset = NOSE_H + wingTopInBody;
  const WING_H = 90;
  const WING_EXTEND = 48;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      {/* ═══ Header ═══ */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-bold text-gray-900 tracking-tight">Choose Your Seats</h2>
          <p className="text-[11px] text-gray-400 mt-0.5">Tap a seat to assign · Optional</p>
        </div>
        {totalCost > 0 && (
          <div className="text-right">
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Total</div>
            <div className="text-sm font-bold text-gray-900">{formatCurrency(totalCost)}</div>
          </div>
        )}
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* ═══ Segment tabs ═══ */}
        {seatMaps.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {seatMaps.map((sm, idx) => {
              const seg = segments.find((s) => s.fuid === sm.fuid);
              const isActive = idx === activeSegmentIndex;
              return (
                <button key={idx} type="button" onClick={() => setActiveSegmentIndex(idx)}
                  className="shrink-0 transition-all"
                  style={{
                    padding: '8px 16px', fontSize: 12, fontWeight: isActive ? 700 : 500, borderRadius: 10,
                    border: `1.5px solid ${isActive ? '#3b82f6' : '#e5e7eb'}`,
                    background: isActive ? '#eff6ff' : '#fafafa',
                    color: isActive ? '#1d4ed8' : '#6b7280',
                  }}
                >
                  {seg ? `${seg.from} → ${seg.to}` : sm.flightNo}
                </button>
              );
            })}
          </div>
        )}

        {/* ═══ Flight info ═══ */}
        {matchingSegment && (
          <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#e0f2fe' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
              </svg>
            </div>
            <div className="text-xs">
              <span className="font-bold text-gray-800">{matchingSegment.from} → {matchingSegment.to}</span>
              <span className="text-gray-400 mx-1.5">·</span>
              <span className="text-gray-500">{matchingSegment.flightNo} · {currentSeatMap.airlineName}</span>
            </div>
          </div>
        )}

        {/* ═══ Passenger selector ═══ */}
        <div>
          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Selecting for</div>
          <div className="flex gap-2 flex-wrap">
            {Array.from({ length: passengerCount }, (_, i) => {
              const paxId = i + 1;
              const hasSeat = selectedSeats.some((s) => s.paxId === paxId && s.fuid === currentSeatMap?.fuid);
              const isActive = paxId === activePaxId;
              const c = paxColor(paxId);
              const seatInfo = hasSeat
                ? currentSeatMap?.seats.find((seat) =>
                    selectedSeats.find((s) => s.paxId === paxId && s.fuid === currentSeatMap?.fuid)?.ssrId === seat.ssid
                  )
                : null;
              return (
                <button key={paxId} type="button" onClick={() => setActivePaxId(paxId)}
                  className="transition-all"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '6px 14px 6px 6px', fontSize: 12,
                    fontWeight: isActive ? 700 : 500, borderRadius: 50,
                    border: `2px solid ${isActive ? c.ring : hasSeat ? c.ring + '60' : '#e5e7eb'}`,
                    background: isActive ? c.light : hasSeat ? c.light + '80' : '#fff',
                    color: isActive ? c.bg : hasSeat ? c.bg : '#6b7280',
                    boxShadow: isActive ? `0 0 0 3px ${c.ring}20` : 'none',
                  }}
                >
                  <span className="flex items-center justify-center shrink-0"
                    style={{ width: 26, height: 26, borderRadius: '50%', background: isActive || hasSeat ? c.bg : '#d1d5db', color: '#fff', fontSize: 11, fontWeight: 700 }}
                  >
                    {hasSeat ? '✓' : paxId}
                  </span>
                  <span className="flex flex-col items-start leading-tight">
                    <span>Pax {paxId}</span>
                    {seatInfo && <span style={{ fontSize: 10, opacity: 0.7 }}>Seat {seatInfo.seatNumber}</span>}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ═══ Legend ═══ */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-gray-500">
          {presentTypes.map((t) => (
            <span key={t.key} className="inline-flex items-center gap-1.5">
              <span className="shrink-0 rounded-[4px]" style={{ width: 14, height: 14, background: t.bg, border: `1.5px solid ${t.dot}` }} />
              {t.label}
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5">
            <span className="shrink-0 rounded-[4px] flex items-center justify-center" style={{ width: 14, height: 14, background: '#e5e7eb', border: '1.5px solid #d1d5db' }}>
              <svg width="8" height="8" viewBox="0 0 14 14"><path d="M3 3l8 8M11 3l-8 8" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" /></svg>
            </span>
            Booked
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="shrink-0 rounded-[4px] flex items-center justify-center" style={{ width: 14, height: 14, background: '#059669' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
            Selected
          </span>
        </div>

        {/* ═══════════════════════════════════════════ */}
        {/*          AIRPLANE FUSELAGE                  */}
        {/* ═══════════════════════════════════════════ */}
        <div ref={scrollRef} className="rounded-2xl py-6 px-2 sm:px-4 flex justify-center overflow-x-auto"
          style={{ background: 'linear-gradient(180deg, #e9edf4 0%, #dfe4ed 100%)' }}
        >
          {/* Outer wrapper: room for wings to extend */}
          <div style={{ width: fuselageW + WING_EXTEND * 2, position: 'relative' }} className="shrink-0">

            {/* ── LEFT WING ── */}
            <svg style={{ position: 'absolute', left: 0, top: wingTopOffset, width: WING_EXTEND + WALL_T + 2, height: WING_H, zIndex: 1 }}
              viewBox={`0 0 ${WING_EXTEND + WALL_T + 2} ${WING_H}`} xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="lwG" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#b4bcc8" />
                  <stop offset="100%" stopColor="#d0d6de" />
                </linearGradient>
              </defs>
              <path
                d={`M ${WING_EXTEND + WALL_T + 2} 12 L 10 0 L 0 ${WING_H * 0.45} L ${WING_EXTEND - 4} ${WING_H} L ${WING_EXTEND + WALL_T + 2} ${WING_H - 8} Z`}
                fill="url(#lwG)" stroke="#a0a8b4" strokeWidth="1.5" strokeLinejoin="round"
              />
              {/* Engine */}
              <ellipse cx={WING_EXTEND * 0.38} cy={WING_H * 0.4} rx="7" ry="11" fill="#a8b0bc" stroke="#909aa6" strokeWidth="1" />
            </svg>

            {/* ── RIGHT WING ── */}
            <svg style={{ position: 'absolute', right: 0, top: wingTopOffset, width: WING_EXTEND + WALL_T + 2, height: WING_H, zIndex: 1 }}
              viewBox={`0 0 ${WING_EXTEND + WALL_T + 2} ${WING_H}`} xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="rwG" x1="1" y1="0" x2="0" y2="0">
                  <stop offset="0%" stopColor="#b4bcc8" />
                  <stop offset="100%" stopColor="#d0d6de" />
                </linearGradient>
              </defs>
              <path
                d={`M 0 12 L ${WING_EXTEND + WALL_T - 8} 0 L ${WING_EXTEND + WALL_T + 2} ${WING_H * 0.45} L ${6} ${WING_H} L 0 ${WING_H - 8} Z`}
                fill="url(#rwG)" stroke="#a0a8b4" strokeWidth="1.5" strokeLinejoin="round"
              />
              <ellipse cx={WING_EXTEND * 0.62 + WALL_T} cy={WING_H * 0.4} rx="7" ry="11" fill="#a8b0bc" stroke="#909aa6" strokeWidth="1" />
            </svg>

            {/* ── FUSELAGE (centered between wings) ── */}
            <div style={{ marginLeft: WING_EXTEND, marginRight: WING_EXTEND, position: 'relative', zIndex: 2 }}>

              {/* ═══ NOSE ═══ */}
              <svg viewBox={`0 0 ${fuselageW} ${NOSE_H}`} className="w-full block" style={{ marginBottom: -1 }} xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="noseG" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#dde1e8" />
                    <stop offset="15%" stopColor="#f2f4f7" />
                    <stop offset="50%" stopColor="#ffffff" />
                    <stop offset="85%" stopColor="#f2f4f7" />
                    <stop offset="100%" stopColor="#dde1e8" />
                  </linearGradient>
                  <linearGradient id="radomeG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c0c8d4" />
                    <stop offset="100%" stopColor="#dde3ea" />
                  </linearGradient>
                </defs>

                {/* Main nose shape */}
                <path
                  d={`M ${cx} 4 C ${cx - 5} 4, ${WALL_T + 8} 65, ${WALL_T} 115 L ${WALL_T} ${NOSE_H} L ${fuselageW - WALL_T} ${NOSE_H} L ${fuselageW - WALL_T} 115 C ${fuselageW - WALL_T - 8} 65, ${cx + 5} 4, ${cx} 4 Z`}
                  fill="url(#noseG)" stroke="#9ca3af" strokeWidth={WALL_T} strokeLinejoin="round"
                />

                {/* Radome cap */}
                <path d={`M ${cx} 4 C ${cx - 3} 4, ${cx - 22} 28, ${cx - 28} 50 L ${cx + 28} 50 C ${cx + 22} 28, ${cx + 3} 4, ${cx} 4 Z`}
                  fill="url(#radomeG)" stroke="none"
                />

                {/* Cockpit windshield left */}
                <path d={`M ${cx - 24} 56 Q ${cx - 18} 40, ${cx - 5} 34 L ${cx - 3} 56 Z`}
                  fill="#a5d8ff" stroke="#6fb0dc" strokeWidth="1.2" strokeLinejoin="round" opacity="0.85"
                />
                {/* Cockpit windshield right */}
                <path d={`M ${cx + 24} 56 Q ${cx + 18} 40, ${cx + 5} 34 L ${cx + 3} 56 Z`}
                  fill="#a5d8ff" stroke="#6fb0dc" strokeWidth="1.2" strokeLinejoin="round" opacity="0.85"
                />
                {/* Center divider */}
                <line x1={cx} y1="32" x2={cx} y2="58" stroke="#6fb0dc" strokeWidth="1.5" />

                {/* Blue accent stripe */}
                <rect x={WALL_T + 2} y="66" width={fuselageW - WALL_T * 2 - 4} height="2.5" rx="1" fill="#38bdf8" opacity="0.3" />

                {/* Nose windows */}
                {Array.from({ length: 5 }, (_, i) => {
                  const wy = 78 + i * 15;
                  return (
                    <g key={`nw-${i}`}>
                      <rect x={WALL_T + 5} y={wy} width={8} height={11} rx={3} fill="#dce6f0" stroke="#b4c0cc" strokeWidth="1" />
                      <rect x={fuselageW - WALL_T - 13} y={wy} width={8} height={11} rx={3} fill="#dce6f0" stroke="#b4c0cc" strokeWidth="1" />
                    </g>
                  );
                })}

                {/* ── Front service area (galley / lavatory) ── */}
                <rect x={WALL_T} y={NOSE_H - SERVICE_H} width={fuselageW - WALL_T * 2} height={SERVICE_H} fill="#3b7ea1" opacity="0.12" />
                <rect x={WALL_T} y={NOSE_H - SERVICE_H} width={fuselageW - WALL_T * 2} height="2" fill="#3b7ea1" opacity="0.25" />
                <rect x={WALL_T} y={NOSE_H - 2} width={fuselageW - WALL_T * 2} height="2" fill="#3b7ea1" opacity="0.18" />

                {/* Lavatory icon left */}
                <g transform={`translate(${WALL_T + SIDE_PADDING + 4}, ${NOSE_H - SERVICE_H + 10})`} opacity="0.4">
                  <circle cx="8" cy="5" r="4" fill="#1e3a5f" />
                  <path d="M3.5 12 C3.5 9.5 5.5 8.5 8 8.5 C10.5 8.5 12.5 9.5 12.5 12 L12.5 22 L3.5 22 Z" fill="#1e3a5f" />
                </g>
                {/* Lavatory icon right */}
                <g transform={`translate(${fuselageW - WALL_T - SIDE_PADDING - 20}, ${NOSE_H - SERVICE_H + 10})`} opacity="0.4">
                  <circle cx="8" cy="5" r="4" fill="#1e3a5f" />
                  <path d="M3.5 12 C3.5 9.5 5.5 8.5 8 8.5 C10.5 8.5 12.5 9.5 12.5 12 L12.5 22 L3.5 22 Z" fill="#1e3a5f" />
                </g>
                {/* Galley / cart icon center */}
                <g transform={`translate(${cx - 10}, ${NOSE_H - SERVICE_H + 10})`} opacity="0.3">
                  <rect x="1" y="5" width="18" height="16" rx="2.5" fill="none" stroke="#1e3a5f" strokeWidth="1.8" />
                  <line x1="5" y1="0" x2="5" y2="5" stroke="#1e3a5f" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="10" y1="1" x2="10" y2="5" stroke="#1e3a5f" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="15" y1="0" x2="15" y2="5" stroke="#1e3a5f" strokeWidth="1.5" strokeLinecap="round" />
                </g>
              </svg>

              {/* ═══ FUSELAGE BODY ═══ */}
              <div className="relative" style={{
                background: 'linear-gradient(90deg, #e8ebf0 0%, #ffffff 6%, #ffffff 94%, #e8ebf0 100%)',
                borderLeft: `${WALL_T}px solid #9ca3af`,
                borderRight: `${WALL_T}px solid #9ca3af`,
              }}>
                <div style={{ paddingLeft: SIDE_PADDING, paddingRight: SIDE_PADDING, paddingTop: 6, paddingBottom: 10 }}>

                  {/* Column letters */}
                  {seatRows.length > 0 && (
                    <div className="flex items-center" style={{ gap: SEAT_GAP, marginBottom: 8, height: COL_HEADER_H - 8 }}>
                      <span style={{ width: ROW_LBL_W }} className="shrink-0" />
                      {seatRows[0].seats.map((seat, idx) => {
                        const showAisle = aisleGapX > 0 && idx > 0 && seatRows[0].seats[idx - 1]?.x <= aisleGapX && seat.x > aisleGapX;
                        return (
                          <span key={seat.x} className="flex items-center">
                            {showAisle && <span style={{ width: AISLE_W }} />}
                            <span style={{ width: SEAT_SIZE }} className="text-center text-[11px] text-gray-400 font-bold select-none">
                              {seat.seatNumber.replace(/[0-9]/g, '')}
                            </span>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* SEAT ROWS */}
                  {seatRows.map(({ y, seats, rowLabel }) => {
                    const isExitRow = seats.some((s) => s.seatType === 'EES');
                    return (
                      <div key={y}>
                        {isExitRow && (
                          <div className="flex items-center my-2" style={{ marginLeft: -SIDE_PADDING, marginRight: -SIDE_PADDING }}>
                            <div className="flex items-center justify-center" style={{ width: SIDE_PADDING }}>
                              <svg width="16" height="12" viewBox="0 0 16 12"><path d="M14 6H2M2 6L6 2M2 6L6 10" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </div>
                            <div className="flex-1 flex items-center gap-2">
                              <div className="flex-1 border-t border-dashed" style={{ borderColor: '#fca5a5' }} />
                              <span className="text-[8px] font-bold uppercase tracking-[0.15em] whitespace-nowrap" style={{ color: '#ef4444' }}>EXIT</span>
                              <div className="flex-1 border-t border-dashed" style={{ borderColor: '#fca5a5' }} />
                            </div>
                            <div className="flex items-center justify-center" style={{ width: SIDE_PADDING }}>
                              <svg width="16" height="12" viewBox="0 0 16 12"><path d="M2 6H14M14 6L10 2M14 6L10 10" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </div>
                          </div>
                        )}

                        <div className="relative flex items-center" style={{ gap: SEAT_GAP, marginBottom: SEAT_GAP }}>
                          {/* Windows */}
                          <div className="absolute" style={{ left: -SIDE_PADDING + 4, top: '50%', transform: 'translateY(-50%)' }}>
                            <div className="rounded-[4px]" style={{ width: 10, height: 14, border: '1.5px solid #b4c0cc', background: 'linear-gradient(180deg, #dce6f0 0%, #cad4e0 100%)' }} />
                          </div>
                          <div className="absolute" style={{ right: -SIDE_PADDING + 4, top: '50%', transform: 'translateY(-50%)' }}>
                            <div className="rounded-[4px]" style={{ width: 10, height: 14, border: '1.5px solid #b4c0cc', background: 'linear-gradient(180deg, #dce6f0 0%, #cad4e0 100%)' }} />
                          </div>

                          {/* Row number */}
                          <span style={{ width: ROW_LBL_W }} className="shrink-0 text-[10px] text-gray-400 text-center font-bold tabular-nums select-none">{rowLabel}</span>

                          {/* Seats */}
                          {seats.map((seat, idx) => {
                            const owner = getSeatOwner(seat.ssid, currentSeatMap.fuid);
                            const isMySelection = owner === activePaxId;
                            const isOtherPax = owner !== null && owner !== activePaxId;
                            const isHovered = hoveredSeat === seat.ssid;
                            const color = getSeatStyle(seat);
                            const showAisle = aisleGapX > 0 && idx > 0 && seats[idx - 1]?.x <= aisleGapX && seat.x > aisleGapX;

                            let seatBg: string, seatBorder: string, textColor: string;
                            let cursor = 'pointer', shadow = '', transform = '';

                            if (!seat.available) {
                              seatBg = '#e8ebef'; seatBorder = '#d0d5dc'; textColor = '#a0a8b4'; cursor = 'not-allowed';
                            } else if (isMySelection) {
                              const c = paxColor(activePaxId);
                              seatBg = c.bg; seatBorder = c.ring; textColor = '#fff';
                              shadow = `0 0 0 2.5px ${c.ring}35, 0 3px 10px ${c.ring}30`; transform = 'scale(1.1)';
                            } else if (isOtherPax) {
                              const c = paxColor(owner);
                              seatBg = c.light; seatBorder = c.ring + '70'; textColor = c.bg; cursor = 'not-allowed';
                            } else if (isHovered) {
                              seatBg = color.hoverBg; seatBorder = color.border; textColor = '#1f2937';
                              shadow = '0 2px 6px rgba(0,0,0,0.12)'; transform = 'scale(1.05)';
                            } else {
                              seatBg = color.bg; seatBorder = color.border; textColor = '#4b5563';
                            }

                            return (
                              <span key={seat.ssid} className="flex items-center">
                                {showAisle && (
                                  <span style={{ width: AISLE_W }} className="flex items-center justify-center">
                                    <span className="block" style={{ width: 1, height: SEAT_SIZE - 6, background: '#d5dae0' }} />
                                  </span>
                                )}
                                <button type="button" disabled={!seat.available || isOtherPax}
                                  onClick={() => handleSeatClick(seat)}
                                  onMouseEnter={() => seat.available && !isOtherPax && setHoveredSeat(seat.ssid)}
                                  onMouseLeave={() => setHoveredSeat(null)}
                                  title={!seat.available ? 'Booked' : isOtherPax ? `Passenger ${owner}` : `${seat.seatNumber} · ${color.label}${seat.fare > 0 ? ` · ${formatCurrency(seat.fare + seat.tax)}` : ' · Free'}`}
                                  style={{
                                    width: SEAT_SIZE, height: SEAT_SIZE, backgroundColor: seatBg, borderColor: seatBorder,
                                    color: textColor, cursor, boxShadow: shadow, transform,
                                    zIndex: isMySelection || isHovered ? 10 : 1, position: 'relative',
                                    transition: 'all 150ms cubic-bezier(.4,0,.2,1)',
                                  }}
                                  className="text-[10px] flex items-center justify-center font-bold rounded-t-[6px] rounded-b-[3px] border-2 select-none"
                                >
                                  {!seat.available ? (
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  ) : isMySelection ? (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.5}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  ) : isOtherPax ? (
                                    <span style={{ fontSize: 9, fontWeight: 800 }}>P{owner}</span>
                                  ) : (
                                    <span>{seat.seatNumber.replace(/[0-9]/g, '')}</span>
                                  )}

                                  {/* Hover tooltip */}
                                  {seat.available && !isOtherPax && !isMySelection && isHovered && (
                                    <span className="absolute pointer-events-none whitespace-nowrap"
                                      style={{
                                        bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 6,
                                        padding: '3px 8px', borderRadius: 6, background: '#1e293b', color: '#fff',
                                        fontSize: 10, fontWeight: 600, zIndex: 50, boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                      }}
                                    >
                                      {seat.seatNumber} · {seat.fare > 0 ? formatCurrency(seat.fare + seat.tax) : 'Free'}
                                      <span style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '4px solid #1e293b' }} />
                                    </span>
                                  )}
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ═══ TAIL ═══ */}
              <svg viewBox={`0 0 ${fuselageW} 160`} className="w-full block" style={{ marginTop: -1 }} xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="tailG" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#dde1e8" />
                    <stop offset="15%" stopColor="#f2f4f7" />
                    <stop offset="50%" stopColor="#ffffff" />
                    <stop offset="85%" stopColor="#f2f4f7" />
                    <stop offset="100%" stopColor="#dde1e8" />
                  </linearGradient>
                </defs>

                {/* Rear service band */}
                <rect x={WALL_T} y="0" width={fuselageW - WALL_T * 2} height={SERVICE_H - 14} fill="#3b7ea1" opacity="0.12" />
                <rect x={WALL_T} y={SERVICE_H - 16} width={fuselageW - WALL_T * 2} height="2" fill="#3b7ea1" opacity="0.2" />

                {/* Rear lavatory icons */}
                <g transform={`translate(${WALL_T + SIDE_PADDING + 4}, 6)`} opacity="0.35">
                  <circle cx="8" cy="5" r="4" fill="#1e3a5f" />
                  <path d="M3.5 12 C3.5 9.5 5.5 8.5 8 8.5 C10.5 8.5 12.5 9.5 12.5 12 L12.5 22 L3.5 22 Z" fill="#1e3a5f" />
                </g>
                <g transform={`translate(${fuselageW - WALL_T - SIDE_PADDING - 20}, 6)`} opacity="0.35">
                  <circle cx="8" cy="5" r="4" fill="#1e3a5f" />
                  <path d="M3.5 12 C3.5 9.5 5.5 8.5 8 8.5 C10.5 8.5 12.5 9.5 12.5 12 L12.5 22 L3.5 22 Z" fill="#1e3a5f" />
                </g>

                {/* Tail taper body */}
                <path
                  d={`M ${WALL_T} ${SERVICE_H - 14} L ${WALL_T} ${SERVICE_H + 10} C ${WALL_T} 130, ${cx} 156, ${cx} 156 C ${cx} 156, ${fuselageW - WALL_T} 130, ${fuselageW - WALL_T} ${SERVICE_H + 10} L ${fuselageW - WALL_T} ${SERVICE_H - 14}`}
                  fill="url(#tailG)" stroke="#9ca3af" strokeWidth={WALL_T} strokeLinejoin="round"
                />

                {/* Vertical stabilizer */}
                <path d={`M ${cx - 14} ${SERVICE_H + 32} L ${cx} 150 L ${cx + 14} ${SERVICE_H + 32}`}
                  fill="#d1d5db" stroke="#9ca3af" strokeWidth="1.5" strokeLinejoin="round"
                />
                {/* Horizontal stabilizer */}
                <line x1={cx - 36} y1={SERVICE_H + 52} x2={cx + 36} y2={SERVICE_H + 52} stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" />

                {/* Tail windows */}
                {Array.from({ length: 2 }, (_, i) => {
                  const wy = SERVICE_H - 8 + i * 15;
                  return (
                    <g key={`tw-${i}`}>
                      <rect x={WALL_T + 5} y={wy} width={8} height={11} rx={3} fill="#dce6f0" stroke="#b4c0cc" strokeWidth="1" />
                      <rect x={fuselageW - WALL_T - 13} y={wy} width={8} height={11} rx={3} fill="#dce6f0" stroke="#b4c0cc" strokeWidth="1" />
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </div>

        {/* ═══ Selected seats summary ═══ */}
        {segSeats.length > 0 && (
          <div className="rounded-xl p-4 space-y-3" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Selected Seats</span>
              {totalCost > 0 && <span className="text-xs font-bold text-emerald-800">{formatCurrency(totalCost)}</span>}
            </div>
            {segSeats.map((sel) => {
              const seat = currentSeatMap.seats.find((s) => s.ssid === sel.ssrId);
              if (!seat) return null;
              const c = paxColor(sel.paxId);
              const style = getSeatStyle(seat);
              return (
                <div key={`${sel.paxId}-${sel.ssrId}`} className="flex justify-between items-center">
                  <span className="flex items-center gap-2.5 text-xs text-gray-600">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ background: c.bg }}>{sel.paxId}</span>
                    Pax {sel.paxId} <span className="text-gray-400">·</span> <strong className="text-gray-800">{seat.seatNumber}</strong>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: style.bg, color: style.dot, border: `1px solid ${style.border}50` }}>{style.label}</span>
                  </span>
                  <span className="text-xs font-semibold text-gray-800 tabular-nums">{seat.fare > 0 ? formatCurrency(seat.fare + seat.tax) : 'Free'}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};