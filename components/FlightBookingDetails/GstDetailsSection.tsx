'use client';

import { useId, useState } from 'react';

/** Indian GSTIN: 2-digit state + PAN + entity + 'Z' + checksum. */
export const GSTIN_PATTERN = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export interface GstDetails {
  gstTin?: string;
  gstCompanyName?: string;
  gstMobile?: string;
}

/**
 * GST rules for a booking. Required when the supplier demands it; when a
 * customer opts in, GSTIN and company name must both be present and valid
 * (suppliers reject partial GST details).
 */
export function validateGst(c: GstDetails, mandatory: boolean): string | null {
  const tin = (c.gstTin || '').trim().toUpperCase();
  const company = (c.gstCompanyName || '').trim();
  if (!mandatory && !tin && !company) return null;
  if (!tin) return 'Please enter the company GSTIN.';
  if (!GSTIN_PATTERN.test(tin)) return 'Please enter a valid 15-character GSTIN.';
  if (!company) return 'Please enter the company name registered for GST.';
  return null;
}

/**
 * "GST details for business travel" - the same block on flight and hotel
 * bookings: optional (Add/Remove) when the supplier accepts GST, required
 * when it demands it.
 */
export function GstDetailsSection({
  value,
  onChange,
  mandatory = false,
  requiredHint = 'This fare requires your company GST details.',
}: {
  value: GstDetails;
  onChange: (patch: GstDetails) => void;
  mandatory?: boolean;
  requiredHint?: string;
}) {
  const fieldId = useId();
  const [open, setOpen] = useState(mandatory || !!value.gstTin);
  const showFields = mandatory || open;
  const gstTin = (value.gstTin || '').toUpperCase();
  const gstTinInvalid = !!gstTin && !GSTIN_PATTERN.test(gstTin);

  return (
    <div className="border-t border-gray-100 pt-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-800">
            GST details for business travel{' '}
            {mandatory ? (
              <span className="text-red-500">*</span>
            ) : (
              <span className="font-normal text-gray-500">(Optional)</span>
            )}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {mandatory ? requiredHint : 'For GST credit, enter your company GST details.'}
          </p>
        </div>
        {!mandatory && (
          <button
            type="button"
            onClick={() => {
              if (open) onChange({ gstCompanyName: '', gstTin: '', gstMobile: '' });
              setOpen(!open);
            }}
            className="text-xs font-semibold text-(--color-links) hover:underline flex-shrink-0"
          >
            {open ? 'Remove' : 'Add'}
          </button>
        )}
      </div>

      {showFields && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
          <div>
            <label htmlFor={`${fieldId}-tin`} className="block text-xs font-medium text-gray-700 mb-1">
              GSTIN <span className="text-red-500">*</span>
            </label>
            <input
              id={`${fieldId}-tin`}
              type="text"
              value={gstTin}
              maxLength={15}
              onChange={(e) => onChange({ gstTin: e.target.value.toUpperCase().replace(/\s/g, '') })}
              placeholder="22AAAAA0000A1Z5"
              aria-invalid={gstTinInvalid}
              className={`w-full px-3 py-2 border rounded-md text-sm uppercase focus:outline-none focus:ring-1 focus:ring-(--color-links) focus:border-(--color-links) ${
                gstTinInvalid ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {gstTinInvalid && <p className="text-[11px] text-red-500 mt-1">Enter a valid 15-character GSTIN.</p>}
          </div>
          <div>
            <label htmlFor={`${fieldId}-company`} className="block text-xs font-medium text-gray-700 mb-1">
              Company name <span className="text-red-500">*</span>
            </label>
            <input
              id={`${fieldId}-company`}
              type="text"
              value={value.gstCompanyName || ''}
              maxLength={100}
              onChange={(e) => onChange({ gstCompanyName: e.target.value })}
              placeholder="Registered company name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-(--color-links) focus:border-(--color-links)"
            />
          </div>
          <div>
            <label htmlFor={`${fieldId}-mobile`} className="block text-xs font-medium text-gray-700 mb-1">
              Company mobile
            </label>
            <input
              id={`${fieldId}-mobile`}
              type="tel"
              value={value.gstMobile || ''}
              onChange={(e) => onChange({ gstMobile: e.target.value })}
              placeholder="Optional"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-(--color-links) focus:border-(--color-links)"
            />
          </div>
        </div>
      )}
    </div>
  );
}
