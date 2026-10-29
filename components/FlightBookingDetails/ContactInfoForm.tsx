'use client';

import type { ContactInfo } from '@/lib/flights-api';

interface ContactInfoFormProps {
  contactInfo: ContactInfo;
  onChange: (updated: ContactInfo) => void;
}

export const ContactInfoForm = ({
  contactInfo,
  onChange,
}: ContactInfoFormProps) => {
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
      </div>
    </div>
  );
};
