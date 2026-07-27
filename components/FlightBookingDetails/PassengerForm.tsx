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

  // FNU/LNU guidance: when an airline on this itinerary mandates a title, show
  // the airline's single-name (first-name-unknown / last-name-unknown) guidance
  // under the name fields. We only display guidance + keep Title required —
  // names are NOT auto-transformed (backend FNU transform not implemented yet).
  const fnuLnuActive = !!fnuLnuSettings && fnuLnuSettings.length > 0;
  const fnuNote = fnuLnuSettings?.find((s) => s.fnuMessage)?.fnuMessage;
  const lnuNote = fnuLnuSettings?.find((s) => s.lnuMessage)?.lnuMessage;

  // PAN can be required by fare-level booking requirements even if the
  // per-passenger travel checklist doesn't flag it.
  const panRequired = travelChecklist.panNo || !!bookingRequirements?.panMandatory;

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
            {fnuLnuActive && fnuNote && (
              <p className="mt-1 text-[11px] text-amber-700">{fnuNote}</p>
            )}
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
            {fnuLnuActive && lnuNote && (
              <p className="mt-1 text-[11px] text-amber-700">{lnuNote}</p>
            )}
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
          {panRequired && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                PAN Number <span className="text-red-500">*</span>
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
