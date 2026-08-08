'use client';

import type {
  TravellerInfo,
  TravelChecklist,
  BookingRequirements,
  FnuLnuSetting,
} from '@/lib/flights-api';

interface PassengerFormProps {
  index: number;
  paxType: 'ADT' | 'CHD' | 'INF';
  traveller: TravellerInfo;
  travelChecklist: TravelChecklist;
  onChange: (updated: TravellerInfo) => void;
  bookingRequirements?: BookingRequirements;
  fnuLnuSettings?: FnuLnuSetting[];
}

const paxTypeLabels: Record<string, string> = {
  ADT: 'Adult',
  CHD: 'Child',
  INF: 'Infant',
};

/**
 * Our own cross-airline reference table (served from /public). It covers every
 * carrier and their sector-specific variants, so it stands in wherever Benzy
 * returns no FnuLnuSettings rule for the operating airline.
 */
const NAME_FORMAT_GUIDE_URL =
  '/Airline-Name-Format-Guide-Soul-Paradise-Travels.pdf';

/**
 * Benzy embeds bare URLs in the FNU/LNU prose (e.g. "[https://…name-format.html]"),
 * so render those as real links rather than making the passenger copy them out.
 * Splitting on a capturing group keeps every other character intact — the airline's
 * wording must reach the screen byte-for-byte as Benzy sent it.
 */
const renderWithLinks = (text: string) =>
  text.split(/(https?:\/\/[^\s\]]+)/g).map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="underline break-all"
      >
        {part}
      </a>
    ) : (
      part
    ),
  );

export const PassengerForm = ({
  index,
  paxType,
  traveller,
  travelChecklist,
  onChange,
  bookingRequirements,
  fnuLnuSettings,
}: PassengerFormProps) => {
  const update = (field: keyof TravellerInfo, value: string) => {
    onChange({ ...traveller, [field]: value });
  };

  // Per-airline rules for passengers whose ID carries only one name, already
  // scoped by the backend to the carriers on this itinerary. Benzy returns them
  // as free-text prose keyed by airline with no structured form we can apply
  // automatically, so they are offered on demand — only a single-name passenger
  // needs them, and they do not apply to the name as printed on a normal ID.
  const nameRules = (fnuLnuSettings || []).filter(
    (s) => s.fnuMessage?.trim() || s.lnuMessage?.trim(),
  );

  // PAN is only *mandatory* on journeys arriving into India from abroad — the
  // backend has already applied that direction check to panMandatory. Whenever
  // PAN is merely applicable (fare-level flag or the per-passenger checklist),
  // the field is still offered, just optional.
  const panMandatory = !!bookingRequirements?.panMandatory;
  const panVisible =
    panMandatory || travelChecklist.panNo || !!bookingRequirements?.panApplicable;

  const titleOptions =
    paxType === 'CHD' || paxType === 'INF'
      ? ['Mstr', 'Ms']
      : ['Mr', 'Mrs', 'Ms'];

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">
          {paxTypeLabels[paxType] || 'Passenger'} {index + 1}
        </h3>
      </div>
      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <select
              value={traveller.title}
              onChange={(e) => update('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-(--color-links) focus:border-(--color-links)"
            >
              <option value="">Select</option>
              {titleOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* First Name */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={traveller.firstName}
              onChange={(e) => update('firstName', e.target.value)}
              placeholder="As per ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-(--color-links) focus:border-(--color-links)"
            />
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={traveller.lastName}
              onChange={(e) => update('lastName', e.target.value)}
              placeholder="As per ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-(--color-links) focus:border-(--color-links)"
            />
          </div>

          {/* Single-name (FNU/LNU) guidance. Shown expanded directly under the
              name fields (per user, 2026-08-08): the airline's exact rule must be
              on screen, not behind a toggle. Rendered once as a full-width block
              rather than duplicated under each name input. */}
          <div className="sm:col-span-2 lg:col-span-3">
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5">
              <p className="text-[11px] font-semibold text-amber-800">
                If the ID shows only one name (no separate first and last name)
              </p>
              <p className="mt-1 text-[11px] text-amber-900">
                Enter the name exactly as printed on the ID. If only one name is
                shown, follow the operating airline&apos;s rule — a mismatch can
                stop the passenger boarding.
              </p>
              {/* Verbatim airline wording from Benzy's GetTravelCheckList, scoped
                  by the backend to this itinerary's carriers. Shown in full and
                  never reworded, trimmed or summarised. */}
              {nameRules.map((rule) => (
                <div
                  key={rule.airlineCode}
                  className="mt-2 border-l-2 border-amber-300 pl-2.5 text-[11px] text-amber-900"
                >
                  <p className="font-semibold">
                    {rule.airlineCode}
                    {rule.titleMandatory && (
                      <span className="ml-1 font-normal text-amber-700">
                        (title required)
                      </span>
                    )}
                  </p>
                  {rule.fnuMessage?.trim() && (
                    <p className="mt-0.5 whitespace-pre-line">
                      {renderWithLinks(rule.fnuMessage)}
                    </p>
                  )}
                  {rule.lnuMessage?.trim() && (
                    <p className="mt-0.5 whitespace-pre-line">
                      {renderWithLinks(rule.lnuMessage)}
                    </p>
                  )}
                </div>
              ))}
              <p className="mt-2 text-[11px] text-amber-900">
                <a
                  href={NAME_FORMAT_GUIDE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline"
                >
                  Airline name format guide (PDF)
                </a>{' '}
                — the format for every airline, including sector-specific rules
                for the UAE, USA and other regions.
              </p>
            </div>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Gender <span className="text-red-500">*</span>
            </label>
            <select
              value={traveller.gender}
              onChange={(e) => update('gender', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-(--color-links) focus:border-(--color-links)"
            >
              <option value="">Select</option>
              <option value="M">Male</option>
              <option value="F">Female</option>
            </select>
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Date of Birth <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={traveller.dob}
              onChange={(e) => update('dob', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-(--color-links) focus:border-(--color-links)"
            />
          </div>

          {/* Email (required for first adult) */}
          {paxType === 'ADT' && index === 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={traveller.email || ''}
                onChange={(e) => update('email', e.target.value)}
                placeholder="email@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-(--color-links) focus:border-(--color-links)"
              />
            </div>
          )}

          {/* Nationality */}
          {travelChecklist.nationality && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Nationality <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={traveller.nationality || ''}
                onChange={(e) => update('nationality', e.target.value)}
                placeholder="e.g. Indian"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-(--color-links) focus:border-(--color-links)"
              />
            </div>
          )}

          {/* Passport Number */}
          {travelChecklist.passportNo && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Passport Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={traveller.passportNo || ''}
                onChange={(e) => update('passportNo', e.target.value)}
                placeholder="Passport number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-(--color-links) focus:border-(--color-links)"
              />
            </div>
          )}

          {/* Passport Expiry */}
          {travelChecklist.passportExpiry && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Passport Expiry <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={traveller.passportExpiry || ''}
                onChange={(e) => update('passportExpiry', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-(--color-links) focus:border-(--color-links)"
              />
            </div>
          )}

          {/* Passport Place of Issue */}
          {travelChecklist.passportPlaceOfIssue && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Place of Issue <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={traveller.passportPlaceOfIssue || ''}
                onChange={(e) => update('passportPlaceOfIssue', e.target.value)}
                placeholder="City of issue"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-(--color-links) focus:border-(--color-links)"
              />
            </div>
          )}

          {/* Passport Date of Issue */}
          {travelChecklist.passportDateOfIssue && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Date of Issue <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={traveller.passportDateOfIssue || ''}
                onChange={(e) => update('passportDateOfIssue', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-(--color-links) focus:border-(--color-links)"
              />
            </div>
          )}

          {/* Visa Type */}
          {travelChecklist.visaType && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Visa Type <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={traveller.visaType || ''}
                onChange={(e) => update('visaType', e.target.value)}
                placeholder="e.g. Tourist"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-(--color-links) focus:border-(--color-links)"
              />
            </div>
          )}

          {/* PAN Number */}
          {panVisible && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                PAN Number{' '}
                {panMandatory ? (
                  <span className="text-red-500">*</span>
                ) : (
                  <span className="text-gray-400 font-normal">(Optional)</span>
                )}
              </label>
              <input
                type="text"
                value={traveller.panNo || ''}
                onChange={(e) => update('panNo', e.target.value)}
                placeholder="ABCDE1234F"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-(--color-links) focus:border-(--color-links)"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
