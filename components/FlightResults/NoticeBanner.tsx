'use client';

interface NoticeBannerProps {
  notices: Array<{ notice: string; link: string }>;
  onDismiss: () => void;
}

export const NoticeBanner = ({ notices, onDismiss }: NoticeBannerProps) => {
  if (!notices || notices.length === 0) return null;

  return (
    <div className="bg-cyan-50 border border-cyan-200 rounded-lg px-4 py-3 flex items-start gap-3">
      {/* Airport icon */}
      <div className="flex-shrink-0 mt-0.5">
        <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
          />
        </svg>
      </div>

      {/* Notices */}
      <div className="flex-1 min-w-0">
        {notices.map((n, i) => (
          <p key={i} className="text-sm text-teal-800">
            {n.notice}
          </p>
        ))}
      </div>

      {/* Dismiss */}
      <button
        type="button"
        onClick={onDismiss}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 p-1"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};
