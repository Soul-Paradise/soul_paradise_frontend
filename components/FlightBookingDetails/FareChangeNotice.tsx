'use client';

import { useId } from 'react';

interface FareChangeNoticeProps {
  /** The new all-inclusive total the customer will pay. */
  total: number;
  currency?: string;
  accepted: boolean;
  onAcceptedChange: (accepted: boolean) => void;
}

/**
 * Shown when the airline repriced the fare after the search. The customer must
 * confirm the new total before payment; the server refuses checkout without
 * that confirmation (acceptFareChange).
 */
export function FareChangeNotice({
  total,
  currency = 'INR',
  accepted,
  onAcceptedChange,
}: FareChangeNoticeProps) {
  const id = useId();
  const price = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(total);

  return (
    <div
      role="alert"
      className="bg-amber-50 border border-amber-300 rounded-lg px-4 py-3 text-sm text-amber-900 space-y-2"
    >
      <p>
        <span className="font-semibold">The airline has changed this fare since your search.</span>{' '}
        The new total is <span className="font-semibold">{price}</span>.
      </p>
      <label htmlFor={id} className="flex items-start gap-2 cursor-pointer">
        <input
          id={id}
          type="checkbox"
          checked={accepted}
          onChange={(e) => onAcceptedChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-(--color-links)"
        />
        <span>I accept the new price of {price} and want to continue.</span>
      </label>
    </div>
  );
}
