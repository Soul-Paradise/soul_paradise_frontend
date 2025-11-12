'use client';

import { useState } from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';

interface FormInputProps {
  id: string;
  label: string;
  type: string;
  placeholder: string;
  autoComplete?: string;
  register: UseFormRegisterReturn;
  error?: string;
  disabled?: boolean;
  helperText?: string;
}

export default function FormInput({
  id,
  label,
  type,
  placeholder,
  autoComplete,
  register,
  error,
  disabled = false,
  helperText,
}: FormInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [hasValue, setHasValue] = useState(false);
  const isPasswordField = type === 'password';
  const inputType = isPasswordField && showPassword ? 'text' : type;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-gray-700 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={inputType}
          autoComplete={autoComplete}
          {...register}
          disabled={disabled}
          onChange={(e) => {
            register.onChange(e);
            setHasValue(e.target.value.length > 0);
          }}
          className={`block w-full px-3.5 py-2.5 border rounded-lg placeholder-gray-400 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed ${
            isPasswordField && hasValue ? 'pr-10' : ''
          } ${
            error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
          }`}
          placeholder={placeholder}
        />
        {isPasswordField && hasValue && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={disabled}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <img src="/hide.svg" alt="Google" className="w-5 h-5" />

            ) : (
              <img src="/eye.svg" alt="Google" className="w-5 h-5" />

            )}
          </button>
        )}
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-xs text-gray-500">{helperText}</p>
      )}
    </div>
  );
}
