'use client';

import { useState, useId } from 'react';
import type { ContactInfo } from '@/lib/flights-api';

interface ContactInfoFormProps {
  contactInfo: ContactInfo;
  onChange: (updated: ContactInfo) => void;
  /** Airline accepts GST details - show the GST section. */
  gstApplicable?: boolean;
  /** GST details are compulsory for this fare. */
  gstMandatory?: boolean;
}

/** Indian GSTIN: 2-digit state + PAN + entity + 'Z' + checksum. */
export const GSTIN_PATTERN = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

/**
 * GST rules for the traveller step. Required when the fare demands it; when a
 * customer opts in, GSTIN and company name must both be present and valid
 * (the airline rejects partial GST details).
 */
export function validateGst(c: ContactInfo, mandatory: boolean): string | null {
  const tin = (c.gstTin || '').trim().toUpperCase();
  const company = (c.gstCompanyName || '').trim();
  if (!mandatory && !tin && !company) return null;
  if (!tin) return 'Please enter the company GSTIN.';
  if (!GSTIN_PATTERN.test(tin)) return 'Please enter a valid 15-character GSTIN.';
  if (!company) return 'Please enter the company name registered for GST.';
  return null;
}

export const ContactInfoForm = ({
  contactInfo,
  onChange,
  gstApplicable = false,
  gstMandatory = false,
}: ContactInfoFormProps) => {
  // Links each visible label to its control (screen readers, click-to-focus).
  const fieldId = useId();
  const update = (field: keyof ContactInfo, value: string) => {
    onChange({ ...contactInfo, [field]: value });
  };
  const [gstOpen, setGstOpen] = useState(
    gstMandatory || !!contactInfo.gstTin,
  );
  const showGstFields = gstMandatory || gstOpen;
  const gstTin = (contactInfo.gstTin || '').toUpperCase();
  const gstTinInvalid = !!gstTin && !GSTIN_PATTERN.test(gstTin);

  return (
    <div className="bg-white rounded-2xl border border-(--color-tertiary-button) shadow-sm overflow-hidden">
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
        <h2 className="text-base font-bold text-(--color-foreground)">
          Contact Information
        </h2>
      </div>
      <div className="p-4 sm:p-5 space-y-4">
        {/* Info banner */}
        <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3">
          <svg
            className="w-8 h-8 text-gray-400 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sm text-gray-700 font-medium">
            Your ticket and flight information will be sent here
          </p>
        </div>

        {/* Phone + Email row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Mobile */}
          <div>
            <label htmlFor={`${fieldId}-0`} className="block text-xs font-medium text-gray-700 mb-1">
              Mobile <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <select id={`${fieldId}-0`}
                aria-label="Mobile country code"
                value={contactInfo.mobileCountryCode}
                onChange={(e) => update('mobileCountryCode', e.target.value)}
                className="w-20 px-2 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-(--color-links) focus:border-(--color-links)"
              >
                <option value="+91">+91</option>
                <option value="+1">+1</option>
                <option value="+44">+44</option>
                <option value="+971">+971</option>
              </select>
              <input
                type="tel"
                aria-label="Mobile number"
                value={contactInfo.mobile}
                onChange={(e) => update('mobile', e.target.value)}
                placeholder="Mobile number"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-(--color-links) focus:border-(--color-links)"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor={`${fieldId}-1`} className="block text-xs font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input id={`${fieldId}-1`}
              type="email"
              value={contactInfo.email}
              onChange={(e) => update('email', e.target.value)}
              placeholder="Email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-(--color-links) focus:border-(--color-links)"
            />
          </div>
        </div>

        {/* GST details - offered when the airline accepts them, required for
            fares the airline only sells against a GSTIN (e.g. SME/corporate). */}
        {(gstApplicable || gstMandatory) && (
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  GST details for business travel{' '}
                  {gstMandatory ? (
                    <span className="text-red-500">*</span>
                  ) : (
                    <span className="font-normal text-gray-500">(Optional)</span>
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {gstMandatory
                    ? 'This fare requires your company GST details.'
                    : 'For GST credit, enter your company GST details.'}
                </p>
              </div>
              {!gstMandatory && (
                <button
                  type="button"
                  onClick={() => {
                    if (gstOpen) {
                      onChange({ ...contactInfo, gstCompanyName: '', gstTin: '', gstMobile: '' });
                    }
                    setGstOpen(!gstOpen);
                  }}
                  className="text-xs font-semibold text-(--color-links) hover:underline flex-shrink-0"
                >
                  {gstOpen ? 'Remove' : 'Add'}
                </button>
              )}
            </div>

            {showGstFields && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
                <div>
                  <label htmlFor={`${fieldId}-2`} className="block text-xs font-medium text-gray-700 mb-1">
                    GSTIN <span className="text-red-500">*</span>
                  </label>
                  <input id={`${fieldId}-2`}
                    type="text"
                    value={gstTin}
                    maxLength={15}
                    onChange={(e) => update('gstTin', e.target.value.toUpperCase().replace(/\s/g, ''))}
                    placeholder="22AAAAA0000A1Z5"
                    aria-invalid={gstTinInvalid}
                    className={`w-full px-3 py-2 border rounded-md text-sm uppercase focus:outline-none focus:ring-1 focus:ring-(--color-links) focus:border-(--color-links) ${
                      gstTinInvalid ? 'border-red-400' : 'border-gray-300'
                    }`}
                  />
                  {gstTinInvalid && (
                    <p className="text-[11px] text-red-500 mt-1">Enter a valid 15-character GSTIN.</p>
                  )}
                </div>
                <div>
                  <label htmlFor={`${fieldId}-3`} className="block text-xs font-medium text-gray-700 mb-1">
                    Company name <span className="text-red-500">*</span>
                  </label>
                  <input id={`${fieldId}-3`}
                    type="text"
                    value={contactInfo.gstCompanyName || ''}
                    maxLength={100}
                    onChange={(e) => update('gstCompanyName', e.target.value)}
                    placeholder="Registered company name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-(--color-links) focus:border-(--color-links)"
                  />
                </div>
                <div>
                  <label htmlFor={`${fieldId}-4`} className="block text-xs font-medium text-gray-700 mb-1">
                    Company mobile
                  </label>
                  <input id={`${fieldId}-4`}
                    type="tel"
                    value={contactInfo.gstMobile || ''}
                    onChange={(e) => update('gstMobile', e.target.value)}
                    placeholder="Optional"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-(--color-links) focus:border-(--color-links)"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
