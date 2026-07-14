'use client';

import { useEffect, useRef, useState } from 'react';

interface FileUploadProps {
  id: string;
  label: string;
  value?: File;
  onChange: (file: File | undefined) => void;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
}

const ACCEPT = 'image/jpeg,image/png,application/pdf';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Document picker for KYC uploads, with a thumbnail preview.
 *
 * The preview is the point: an agent photographing an Aadhaar card has no other
 * way to notice they attached the wrong image or an unreadable one, and every
 * such mistake costs a full rejection-and-resubmission round trip.
 */
export default function FileUpload({
  id,
  label,
  value,
  onChange,
  error,
  helperText,
  disabled,
  required,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!value || !value.type.startsWith('image/')) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(value);
    setPreviewUrl(url);

    // Object URLs pin the file in memory until revoked. These are multi-megabyte
    // scans, so leaking them across a multi-step form adds up.
    return () => URL.revokeObjectURL(url);
  }, [value]);

  const handleSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.files?.[0]);
  };

  const handleClear = () => {
    onChange(undefined);
    // Without this, re-picking the same file fires no change event.
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium mb-1.5 text-(--color-foreground)"
      >
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={ACCEPT}
        disabled={disabled}
        onChange={handleSelect}
        className="sr-only"
      />

      {!value ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className={`w-full flex flex-col items-center justify-center gap-1.5 px-4 py-6 rounded-lg border-2 border-dashed transition-colors duration-200 disabled:cursor-not-allowed ${
            error
              ? 'border-red-400'
              : 'border-(--color-tertiary-button) hover:border-(--color-primary-button)'
          }`}
        >
          <svg
            className="w-6 h-6 text-(--color-foreground) opacity-50"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
            />
          </svg>
          <span className="text-sm font-medium text-(--color-foreground)">
            Click to upload
          </span>
          <span className="text-xs text-(--color-foreground) opacity-60">
            JPG, PNG or PDF · max 5MB
          </span>
        </button>
      ) : (
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-(--color-tertiary-button)">
          {previewUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element -- blob: URL of a
               local file the user just picked; next/image cannot optimise it. */
            <img
              src={previewUrl}
              alt={`Preview of ${label}`}
              className="w-12 h-12 rounded object-cover shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded shrink-0 flex items-center justify-center bg-(--color-tertiary-button)/30 text-xs font-semibold text-(--color-foreground)">
              PDF
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate text-(--color-foreground)">
              {value.name}
            </p>
            <p className="text-xs text-(--color-foreground) opacity-60">
              {formatSize(value.size)}
            </p>
          </div>

          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            aria-label={`Remove ${label}`}
            className="text-xs font-semibold shrink-0 px-2 py-1 rounded text-red-500 hover:bg-red-500/10 disabled:cursor-not-allowed"
          >
            Remove
          </button>
        </div>
      )}

      {error ? (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-(--color-foreground) opacity-60">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
