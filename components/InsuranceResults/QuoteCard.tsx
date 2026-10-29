'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatCoverage, type InsuranceQuote } from '@/lib/insurance-api';

// Visual twin of components/FlightResults/FlightCard.tsx (+ its FlightDetails
// tab panel) - keep the two in step.

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

function InsurerLogo({ src, label }: { src: string; label: string }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) {
    return (
      <div className="w-9 h-9 rounded bg-blue-50 border-blue-200 border flex items-center justify-center flex-shrink-0">
        <span className="text-[10px] font-bold text-(--color-secondary-button)">{label.slice(0, 2).toUpperCase()}</span>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- insurer logos come from Benzy's CDN
    <img
      src={src}
      alt={label}
      onError={() => setBroken(true)}
      className="w-14 h-9 rounded border border-gray-200 bg-white object-contain p-0.5 flex-shrink-0"
    />
  );
}

type Tab = 'highlights' | 'documents';

function QuoteDetails({ quote }: { quote: InsuranceQuote }) {
  const [activeTab, setActiveTab] = useState<Tab>('highlights');
  const tabs: { key: Tab; label: string }[] = [
    { key: 'highlights', label: 'Plan Highlights' },
    { key: 'documents', label: 'Policy Documents' },
  ];
  const highlights = [...quote.specialHighlights, ...quote.highlights];

  return (
    <div className="border-t border-gray-200 bg-white">
      <div role="tablist" className="flex border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-3 text-sm font-medium transition-colors relative focus:outline-none focus-visible:bg-gray-50 ${
              activeTab === tab.key ? 'text-red-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {activeTab === tab.key && <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-red-500 rounded-t" />}
          </button>
        ))}
      </div>

      <div className="p-5 bg-gray-50/60">
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              {activeTab === 'highlights' ? quote.planName : 'Documents'}
            </h2>
            <p className="mt-0.5 text-[11px] text-gray-500">{quote.providerLabel}</p>
          </div>

          {activeTab === 'highlights' && (
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="px-5 py-2.5 text-gray-500 align-top">Medical cover</td>
                  <td className="px-5 py-2.5 text-right font-medium text-gray-700">{formatCoverage(quote.coverage)}</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="px-5 py-2.5 text-gray-500 align-top">Claim limits</td>
                  <td className="px-5 py-2.5 text-right font-medium text-gray-700">
                    {quote.isWithSubLimits ? 'Sub-limits apply' : 'No sub-limits'}
                  </td>
                </tr>
                {highlights.map((h, i) => (
                  <tr key={i} className="border-b border-gray-100 last:border-b-0">
                    <td colSpan={2} className="px-5 py-2.5 text-gray-700">
                      <span className="inline-flex items-start gap-2">
                        <svg className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        {h}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'documents' && (
            <div className="px-5 py-4 text-sm">
              {quote.policyWordingURL ? (
                <a
                  href={quote.policyWordingURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-(--color-links) font-medium hover:underline"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Policy wording (PDF)
                </a>
              ) : (
                <span className="text-gray-500">The full benefit list and terms are on the next step.</span>
              )}
            </div>
          )}

          <div className="px-5 py-2.5 bg-gray-50 border-t border-gray-100 text-[11px] text-gray-500">
            Full benefits, deductibles and terms are shown when you view the plan.
          </div>
        </div>
      </div>
    </div>
  );
}

export const InsuranceQuoteCard = ({ quote, href, days }: { quote: InsuranceQuote; href: string; days: number }) => {
  const router = useRouter();
  const [showDetails, setShowDetails] = useState(false);
  const note = quote.highlights[0] ?? quote.specialHighlights[0] ?? '';

  return (
    <div className="bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all relative">
      {quote.isRecommended && (
        <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg tracking-wide z-10">
          RECOMMENDED
        </div>
      )}

      <div className="px-4 py-3">
        <div className="flex items-center min-w-0 gap-3 sm:gap-4">
          {/* Insurer */}
          <div className="flex items-center gap-2 min-w-0 flex-shrink basis-[170px] sm:basis-[220px]">
            <InsurerLogo src={quote.providerLogo} label={quote.providerLabel} />
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-gray-900 truncate leading-tight">{quote.planName}</div>
              <div className="text-[11px] text-gray-400 leading-tight truncate">{quote.providerLabel}</div>
            </div>
          </div>

          {/* Cover */}
          <div className="text-center flex-shrink-0 min-w-0">
            <div className="text-lg font-bold text-gray-900 leading-tight whitespace-nowrap">
              {formatCoverage(quote.coverage)}
            </div>
            <div className="text-[11px] text-gray-500 leading-tight">Medical cover</div>
          </div>

          {/* Trip line */}
          <div className="hidden sm:flex flex-1 flex-col items-center px-1 min-w-0 basis-[90px]">
            <div className="text-[11px] text-gray-500 font-medium leading-tight whitespace-nowrap">
              {days} day{days === 1 ? '' : 's'} cover
            </div>
            <div className="w-full flex items-center my-0.5">
              <div className="h-[1px] flex-1 border-t border-dashed border-gray-300" />
              <svg className="w-3.5 h-3.5 text-gray-500 flex-shrink-0 mx-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
              </svg>
              <div className="h-[1px] flex-1 border-t border-dashed border-gray-300" />
            </div>
            <div className="text-[11px] text-gray-500 leading-tight text-center truncate w-full">
              {quote.isWithSubLimits ? 'Sub-limits apply' : 'No sub-limits'}
              {quote.category ? `, ${quote.category}` : ''}
            </div>
          </div>

          {/* Price */}
          <div className="text-right flex-shrink-0 ml-auto sm:ml-0">
            <div className="text-lg font-bold text-gray-900 leading-tight whitespace-nowrap">
              {formatCurrency(quote.price)}
            </div>
          </div>

          {/* Action */}
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={() => router.push(href)}
              className="px-4 py-1.5 bg-red-500 text-white text-sm font-bold rounded hover:bg-red-600 transition-colors whitespace-nowrap"
            >
              View Plan
            </button>
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="text-[11px] text-(--color-links) hover:underline font-medium"
            >
              {showDetails ? '− Details' : '+ Details'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-1 text-[11px] text-gray-400 min-w-0">
            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="truncate">
              {note || 'Total price for all travellers, taxes included.'}{' '}
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="text-blue-500 hover:underline font-medium"
              >
                (More)
              </button>
            </span>
          </div>
          {quote.policyWordingURL && (
            <a
              href={quote.policyWordingURL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 ml-2 text-[11px] font-semibold text-(--color-links) hover:underline"
            >
              Policy Wording
            </a>
          )}
        </div>
      </div>
      {showDetails && <QuoteDetails quote={quote} />}
    </div>
  );
};
