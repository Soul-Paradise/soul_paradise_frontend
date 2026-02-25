'use client';

import { useState } from 'react';
import type { ContactInfo } from '@/lib/flights-api';

interface ContactInfoFormProps {
  contactInfo: ContactInfo;
  onChange: (updated: ContactInfo) => void;
}

export const ContactInfoForm = ({
  contactInfo,
  onChange,
}: ContactInfoFormProps) => {
  const [showGst, setShowGst] = useState(false);

  const update = (field: keyof ContactInfo, value: string) => {
    onChange({ ...contactInfo, [field]: value });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
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
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Mobile <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <select
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
                value={contactInfo.mobile}
                onChange={(e) => update('mobile', e.target.value)}
                placeholder="Mobile number"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-(--color-links) focus:border-(--color-links)"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={contactInfo.email}
              onChange={(e) => update('email', e.target.value)}
              placeholder="Email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-(--color-links) focus:border-(--color-links)"
            />
          </div>
        </div>

        {/* GSTIN Section */}
        <div className="border-t border-gray-200 pt-4">
          <div
            className={`flex items-center justify-between rounded-lg px-4 py-3 ${
              showGst ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-blue-700">GST</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Use GSTIN for this booking{' '}
                  <span className="text-gray-500 font-normal">(Optional)</span>
                </p>
                <p className="text-xs text-gray-500">
                  Claim credit of GST charges. Your taxes may get updated post
                  submitting your GST details
                </p>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                checked={showGst}
                onChange={(e) => {
                  setShowGst(e.target.checked);
                  if (!e.target.checked) {
                    onChange({
                      ...contactInfo,
                      gstCompanyName: undefined,
                      gstTin: undefined,
                      gstMobile: undefined,
                    });
                  }
                }}
                className="w-4 h-4 accent-(--color-links)"
              />
              <span className="text-xs text-gray-600 whitespace-nowrap">
                Include my GST number
              </span>
            </label>
          </div>

          {/* GST Fields (shown when checked) */}
          {showGst && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  GSTIN <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={contactInfo.gstTin || ''}
                  onChange={(e) =>
                    update('gstTin', e.target.value.toUpperCase())
                  }
                  placeholder="e.g. 22AAAAA0000A1Z5"
                  maxLength={15}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-(--color-links) focus:border-(--color-links)"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={contactInfo.gstCompanyName || ''}
                  onChange={(e) => update('gstCompanyName', e.target.value)}
                  placeholder="Registered company name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-(--color-links) focus:border-(--color-links)"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  GST Contact Mobile
                </label>
                <input
                  type="tel"
                  value={contactInfo.gstMobile || ''}
                  onChange={(e) => update('gstMobile', e.target.value)}
                  placeholder="Mobile number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-(--color-links) focus:border-(--color-links)"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
