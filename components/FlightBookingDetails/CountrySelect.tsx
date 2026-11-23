'use client';

import { countryOptions } from '@/lib/countries';

interface CountrySelectProps {
  id: string;
  value: string;
  onChange: (code: string) => void;
  placeholder?: string;
}

/** Country picker whose value is the ISO 2-letter code Benzy expects. */
export function CountrySelect({ id, value, onChange, placeholder = 'Select country' }: CountrySelectProps) {
  const options = countryOptions();
  return (
    <select
      id={id}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-1 focus:ring-(--color-links) focus:border-(--color-links)"
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((c) => (
        <option key={c.code} value={c.code}>
          {c.name}
        </option>
      ))}
    </select>
  );
}
