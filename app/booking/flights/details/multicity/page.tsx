'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  priceMultiCityAndGetDetails,
  createBooking,
  type FlightPricingResponse,
  type MultiCityPriceLeg,
  type TravellerInfo,
  type ContactInfo,
  type SSRSelection,
  type SSROption,
  type PromoValidationResult,
} from '@/lib/flights-api';
import { useAuth, useRequireAuth } from '@/contexts/AuthContext';
import { MultiCitySegments } from '@/components/FlightBookingDetails/MultiCitySegments';
import { FareRulesAccordion } from '@/components/FlightBookingDetails/FareRulesAccordion';
import { SSRSelector } from '@/components/FlightBookingDetails/SSRSelector';
import { SeatSelector } from '@/components/FlightBookingDetails/SeatSelector';
import { PassengerForm } from '@/components/FlightBookingDetails/PassengerForm';
import { ContactInfoForm } from '@/components/FlightBookingDetails/ContactInfoForm';
import { BookingSummary } from '@/components/FlightBookingDetails/BookingSummary';
import { BookingWizardStepper } from '@/components/FlightBookingDetails/BookingWizardStepper';

const WIZARD_STEPS = [
  { key: 'travellers', label: 'Travellers' },
  { key: 'seats', label: 'Seats' },
  { key: 'addons', label: 'Add-ons' },
];

function createEmptyTraveller(paxType: 'ADT' | 'CHD' | 'INF'): TravellerInfo {
  return {
    title: '' as any,
    firstName: '',
    lastName: '',
    dob: '',
    gender: '' as any,
    paxType,
  };
}

function createEmptyContact(): ContactInfo {
  return {
    title: '' as any,
    firstName: '',
    lastName: '',
    mobile: '',
    email: '',
    countryCode: 'IN',
    mobileCountryCode: '+91',
  };
}

function parseLegs(raw: string): MultiCityPriceLeg[] {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((l) => l && typeof l.flightIndex === 'string')
      .map((l) => ({
        tui: String(l.tui || ''),
        flightIndex: l.flightIndex,
        netFare: Number(l.netFare) || 0,
      }));
  } catch {
    return [];
  }
}

function MultiCityDetailsContent() {
  useRequireAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const tripType = (searchParams.get('tripType') === 'IM' ? 'IM' : 'DM') as 'DM' | 'IM';
  const legsRaw = searchParams.get('legs') || '';

  const [pricing, setPricing] = useState<FlightPricingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState('');

  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const [travellers, setTravellers] = useState<TravellerInfo[]>([]);
  const [contactInfo, setContactInfo] = useState<ContactInfo>(createEmptyContact());

  useEffect(() => {
    if (user && user.role === 'USER') {
      setContactInfo((prev) => ({ ...prev, email: prev.email || user.email }));
    }
  }, [user]);

  const [selectedSSR, setSelectedSSR] = useState<SSRSelection[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<SSRSelection[]>([]);
  const [appliedPromo, setAppliedPromo] = useState<PromoValidationResult | null>(null);

  const pricingLoadedRef = useRef(false);

  useEffect(() => {
    if (pricingLoadedRef.current) return;

    const legs = parseLegs(legsRaw);
    if (legs.length < 2 || legs.some((l) => !l.tui)) {
      setError('Missing itinerary. Please go back and search again.');
      setLoading(false);
      return;
    }

    pricingLoadedRef.current = true;
    setLoading(true);
    setError('');

    priceMultiCityAndGetDetails(tripType, legs)
      .then((data) => {
        setPricing(data);
        const paxList: TravellerInfo[] = [];
        for (let i = 0; i < data.passengerCounts.adults; i++) paxList.push(createEmptyTraveller('ADT'));
        for (let i = 0; i < data.passengerCounts.children; i++) paxList.push(createEmptyTraveller('CHD'));
        for (let i = 0; i < data.passengerCounts.infants; i++) paxList.push(createEmptyTraveller('INF'));
        setTravellers(paxList);
      })
      .catch((err: any) => {
        setError(err.message || 'Failed to load flight pricing.');
      })
      .finally(() => setLoading(false));
  }, [tripType, legsRaw]);

  const updateTraveller = (index: number, updated: TravellerInfo) => {
    setTravellers((prev) => prev.map((t, i) => (i === index ? updated : t)));
  };

  const validateTravellerForms = (): string | null => {
    if (!contactInfo.email) return 'Contact email is required.';
    if (!contactInfo.mobile) return 'Contact mobile number is required.';

    for (let i = 0; i < travellers.length; i++) {
      const t = travellers[i];
      if (!t.title || !t.firstName || !t.lastName || !t.gender || !t.dob) {
        return `Please fill in all required fields for ${t.paxType === 'ADT' ? 'Adult' : t.paxType === 'CHD' ? 'Child' : 'Infant'} ${i + 1}.`;
      }
      if (pricing?.travelChecklist) {
        const cl = pricing.travelChecklist;
        if (cl.nationality && !t.nationality) return `Nationality is required for ${t.firstName || `Passenger ${i + 1}`}.`;
        if (cl.passportNo && !t.passportNo) return `Passport number is required for ${t.firstName || `Passenger ${i + 1}`}.`;
        if (cl.passportExpiry && !t.passportExpiry) return `Passport expiry is required for ${t.firstName || `Passenger ${i + 1}`}.`;
      }
    }
    return null;
  };

  const allSSROptions: SSROption[] = pricing
    ? [
        ...pricing.ssrOptions.baggage,
        ...pricing.ssrOptions.meals,
        ...pricing.ssrOptions.priority,
        ...pricing.ssrOptions.sports,
        ...pricing.ssrOptions.fastForward,
        ...pricing.seatMaps.flatMap((sm) =>
          sm.seats
            .filter((s) => s.available)
            .map((s) => ({
              id: s.ssid,
              code: s.seatNumber,
              description: `Seat ${s.seatNumber}`,
              charge: s.fare + s.tax,
              type: 'seat' as const,
              fuid: sm.fuid,
            })),
        ),
      ]
    : [];

  const allSelections = [...selectedSSR, ...selectedSeats];

  const totalPaxCount =
    (pricing?.passengerCounts.adults || 0) + (pricing?.passengerCounts.children || 0);

  const handleContinue = () => {
    setBookingError('');
    if (currentStep === 0) {
      const validationError = validateTravellerForms();
      if (validationError) {
        setBookingError(validationError);
        return;
      }
    }
    setCompletedSteps((prev) => new Set([...prev, currentStep]));
    setCurrentStep((prev) => Math.min(prev + 1, WIZARD_STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setBookingError('');
    setCurrentStep((prev) => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStepClick = (step: number) => {
    if (step < currentStep || completedSteps.has(step)) {
      setBookingError('');
      setCurrentStep(step);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    const validationError = validateTravellerForms();
    if (validationError) {
      setBookingError(validationError);
      return;
    }
    if (!pricing) return;

    setIsSubmitting(true);
    setBookingError('');

    try {
      const firstAdult = travellers.find((t) => t.paxType === 'ADT');
      const finalContactInfo = {
        ...contactInfo,
        title: firstAdult?.title || contactInfo.title || ('Mr' as const),
        firstName: firstAdult?.firstName || contactInfo.firstName || 'Guest',
        lastName: firstAdult?.lastName || contactInfo.lastName || 'User',
      };

      const ssrTotal = allSelections.reduce((sum, sel) => {
        const option = allSSROptions.find((o) => o.id === sel.ssrId);
        return sum + (option?.charge || 0);
      }, 0);
      const promoDiscount = appliedPromo?.valid ? appliedPromo.discountAmount : 0;
      const payableAmount = Math.max(0, pricing.totalFare.gross + ssrTotal - promoDiscount);

      const result = await createBooking({
        tui: pricing.tui,
        netAmount: pricing.netAmount,
        payableAmount,
        contactInfo: finalContactInfo,
        travellers,
        selectedSSR: allSelections,
        ssrChargeMap: pricing.ssrChargeMap,
        freeSSRs: pricing.freeSSRs,
        // DM: one { tui, netAmount } per leg — the backend splits the flat SSR
        // selections per leg by FUID namespace and tickets each leg separately.
        multiCitySessions: pricing.multiCitySessions,
        tripSummary: {
          fromCode: pricing.segments[0]?.from || '',
          toCode: pricing.segments[pricing.segments.length - 1]?.to || '',
          departureDate: pricing.segments[0]?.departureTime || '',
          airline: pricing.segments[0]?.airline || '',
        },
      });

      window.location.href = result.redirectUrl;
    } catch (err: any) {
      setBookingError(err.message || 'Booking failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  const sidebarProps = {
    fareBreakdown: pricing?.fareBreakdown || [],
    totalFare: pricing?.totalFare || { net: 0, gross: 0, currency: 'INR' },
    passengerCounts: pricing?.passengerCounts || { adults: 0, children: 0, infants: 0 },
    selectedSSR: allSelections,
    allSSROptions,
    appliedPromo,
    onApplyPromo: setAppliedPromo,
    isSubmitting,
    onSubmit: handleSubmit,
    currentStep,
    totalSteps: WIZARD_STEPS.length,
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg p-8 text-center mb-6">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-(--color-links) mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading flight details...</h3>
            <p className="text-sm text-gray-500">
              Fetching live pricing, fare rules, and available add-ons for your multi-city trip.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg p-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to load pricing</h3>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <button
              onClick={() => router.back()}
              className="px-6 py-2 bg-(--color-links) text-white text-sm font-semibold rounded-md hover:opacity-90"
            >
              Go Back
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!pricing) return null;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Complete Your Multi-City Booking</h1>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <BookingWizardStepper
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={handleStepClick}
        />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-6">
            {currentStep === 0 && (
              <>
                <MultiCitySegments segments={pricing.segments} />

                <div>
                  <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
                    Traveller Details
                  </h2>
                  <div className="space-y-4">
                    {travellers.map((traveller, i) => (
                      <PassengerForm
                        key={i}
                        index={i}
                        paxType={traveller.paxType}
                        traveller={traveller}
                        travelChecklist={pricing.travelChecklist}
                        onChange={(updated) => updateTraveller(i, updated)}
                      />
                    ))}
                  </div>
                </div>

                <ContactInfoForm contactInfo={contactInfo} onChange={setContactInfo} />
              </>
            )}

            {currentStep === 1 && (
              <>
                {pricing.seatMaps.length > 0 ? (
                  <SeatSelector
                    seatMaps={pricing.seatMaps}
                    segments={pricing.segments}
                    passengerCount={totalPaxCount}
                    selectedSeats={selectedSeats}
                    onSeatChange={setSelectedSeats}
                  />
                ) : (
                  <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">
                      Seat selection not available
                    </h3>
                    <p className="text-xs text-gray-500">
                      Seats will be assigned at check-in.
                    </p>
                  </div>
                )}
              </>
            )}

            {currentStep === 2 && (
              <>
                <SSRSelector
                  segments={pricing.segments}
                  baggageOptions={pricing.ssrOptions.baggage}
                  mealOptions={pricing.ssrOptions.meals}
                  priorityOptions={pricing.ssrOptions.priority}
                  sportsOptions={pricing.ssrOptions.sports}
                  fastForwardOptions={pricing.ssrOptions.fastForward}
                  passengerCount={totalPaxCount}
                  selectedSSR={selectedSSR}
                  onSSRChange={setSelectedSSR}
                />

                {!pricing.ssrOptions.baggage.length &&
                  !pricing.ssrOptions.meals.length &&
                  !pricing.ssrOptions.priority.length &&
                  !pricing.ssrOptions.sports.length &&
                  !pricing.ssrOptions.fastForward.length && (
                    <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">No add-ons available</h3>
                      <p className="text-xs text-gray-500">
                        You can proceed to confirm your booking.
                      </p>
                    </div>
                  )}
              </>
            )}

            {bookingError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                {bookingError}
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              {currentStep > 0 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50"
                >
                  Back
                </button>
              ) : (
                <div />
              )}

              {currentStep < WIZARD_STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={handleContinue}
                  className="px-8 py-2.5 bg-(--color-links) text-white text-sm font-semibold rounded-md hover:opacity-90"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-8 py-2.5 bg-(--color-links) text-white text-sm font-semibold rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    'Confirm & Pay'
                  )}
                </button>
              )}
            </div>

            <div className="lg:hidden">
              <div className="space-y-4">
                <FareRulesAccordion fareRules={pricing.fareRules} />
                <BookingSummary {...sidebarProps} />
              </div>
            </div>
          </div>

          <div className="hidden lg:block w-80 flex-shrink-0">
            <BookingSummary {...sidebarProps} />
          </div>
        </div>
      </div>
    </main>
  );
}

export default function MultiCityDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-(--color-links) mb-4" />
            <p className="text-gray-500">Loading...</p>
          </div>
        </div>
      }
    >
      <MultiCityDetailsContent />
    </Suspense>
  );
}
