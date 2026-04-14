'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  priceAndGetDetails,
  createBooking,
  type FlightPricingResponse,
  type TravellerInfo,
  type ContactInfo,
  type SSRSelection,
  type SSROption,
  type PromoValidationResult,
} from '@/lib/flights-api';
import { useAuth } from '@/contexts/AuthContext';
import { FlightSegments } from '@/components/FlightBookingDetails/FlightSegments';
import { FareBreakdown } from '@/components/FlightBookingDetails/FareBreakdown';
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

function FlightDetailsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const searchId = searchParams.get('searchId') || '';
  const flightIndex = searchParams.get('index') || '';
  const tripType = searchParams.get('tripType') || 'oneway';

  const [pricing, setPricing] = useState<FlightPricingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Wizard state
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(
    new Set(),
  );

  // Form state
  const [travellers, setTravellers] = useState<TravellerInfo[]>([]);
  const [contactInfo, setContactInfo] = useState<ContactInfo>(
    createEmptyContact(),
  );

  // Auto-fill contact info for USER role (customers)
  useEffect(() => {
    if (user && user.role === 'USER') {
      setContactInfo((prev) => ({
        ...prev,
        email: prev.email || user.email,
      }));
    }
  }, [user]);
  const [selectedSSR, setSelectedSSR] = useState<SSRSelection[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<SSRSelection[]>([]);
  const [appliedPromo, setAppliedPromo] =
    useState<PromoValidationResult | null>(null);

  const pricingLoadedRef = useRef(false);

  useEffect(() => {
    // Prevent duplicate pricing calls from React StrictMode double-render
    if (pricingLoadedRef.current) return;

    if (!searchId || !flightIndex) {
      setError('Missing search parameters. Please go back and search again.');
      setLoading(false);
      return;
    }

    pricingLoadedRef.current = true;
    setLoading(true);
    setError('');

    priceAndGetDetails(searchId, flightIndex, tripType)
      .then((data) => {
        setPricing(data);

        // Initialize travellers from passenger counts
        const paxList: TravellerInfo[] = [];
        for (let i = 0; i < data.passengerCounts.adults; i++) {
          paxList.push(createEmptyTraveller('ADT'));
        }
        for (let i = 0; i < data.passengerCounts.children; i++) {
          paxList.push(createEmptyTraveller('CHD'));
        }
        for (let i = 0; i < data.passengerCounts.infants; i++) {
          paxList.push(createEmptyTraveller('INF'));
        }
        setTravellers(paxList);
      })
      .catch((err: any) => {
        setError(err.message || 'Failed to load flight pricing.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [searchId, flightIndex, tripType]);

  const updateTraveller = (index: number, updated: TravellerInfo) => {
    setTravellers((prev) => prev.map((t, i) => (i === index ? updated : t)));
  };

  // Validate traveller + contact forms (Step 0)
  const validateTravellerForms = (): string | null => {
    // Validate contact (only email + mobile required now)
    if (!contactInfo.email) {
      return 'Contact email is required.';
    }
    if (!contactInfo.mobile) {
      return 'Contact mobile number is required.';
    }

    // Validate travellers
    for (let i = 0; i < travellers.length; i++) {
      const t = travellers[i];
      if (!t.title || !t.firstName || !t.lastName || !t.gender || !t.dob) {
        return `Please fill in all required fields for ${t.paxType === 'ADT' ? 'Adult' : t.paxType === 'CHD' ? 'Child' : 'Infant'} ${i + 1}.`;
      }

      // Validate travel checklist fields
      if (pricing?.travelChecklist) {
        const cl = pricing.travelChecklist;
        if (cl.nationality && !t.nationality) {
          return `Nationality is required for ${t.firstName || `Passenger ${i + 1}`}.`;
        }
        if (cl.passportNo && !t.passportNo) {
          return `Passport number is required for ${t.firstName || `Passenger ${i + 1}`}.`;
        }
        if (cl.passportExpiry && !t.passportExpiry) {
          return `Passport expiry is required for ${t.firstName || `Passenger ${i + 1}`}.`;
        }
      }
    }

    return null;
  };

  // All SSR options combined for price calculation
  const allSSROptions: SSROption[] = pricing
    ? [
        ...pricing.ssrOptions.baggage,
        ...pricing.ssrOptions.meals,
        ...pricing.ssrOptions.priority,
        ...pricing.ssrOptions.sports,
        ...pricing.ssrOptions.fastForward,
        // Synthetic SSROption entries for seat selections
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
    (pricing?.passengerCounts.adults || 0) +
    (pricing?.passengerCounts.children || 0);

  // Navigation handlers
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
    // Re-validate everything before submitting
    const validationError = validateTravellerForms();
    if (validationError) {
      setBookingError(validationError);
      return;
    }

    if (!pricing) return;

    setIsSubmitting(true);
    setBookingError('');

    try {
      // Auto-populate contact name from first adult traveller (backend requires it)
      const firstAdult = travellers.find((t) => t.paxType === 'ADT');
      const finalContactInfo = {
        ...contactInfo,
        title: firstAdult?.title || contactInfo.title || ('Mr' as const),
        firstName: firstAdult?.firstName || contactInfo.firstName || 'Guest',
        lastName: firstAdult?.lastName || contactInfo.lastName || 'User',
      };

      const result = await createBooking({
        pricingId: pricing.pricingId,
        contactInfo: finalContactInfo,
        travellers,
        selectedSSR: allSelections,
      });

      // Navigate to confirmation page
      router.push(
        `/booking/flights/confirmation?transactionId=${result.transactionId}`,
      );
    } catch (err: any) {
      setBookingError(err.message || 'Booking failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Shared sidebar props
  const sidebarProps = {
    fareBreakdown: pricing?.fareBreakdown || [],
    totalFare: pricing?.totalFare || { net: 0, gross: 0, currency: 'INR' },
    passengerCounts: pricing?.passengerCounts || {
      adults: 0,
      children: 0,
      infants: 0,
    },
    selectedSSR: allSelections,
    allSSROptions,
    appliedPromo,
    onApplyPromo: setAppliedPromo,
    isSubmitting,
    onSubmit: handleSubmit,
    currentStep,
    totalSteps: WIZARD_STEPS.length,
  };

  // Loading state
  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg p-8 text-center mb-6">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-(--color-links) mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Loading flight details...
            </h3>
            <p className="text-sm text-gray-500">
              Fetching live pricing, fare rules, and available add-ons. This may
              take a few seconds.
            </p>
          </div>
          {/* Skeleton */}
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white border border-gray-200 rounded-lg p-5 animate-pulse"
              >
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                <div className="h-3 bg-gray-200 rounded w-2/3 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  // Error state
  if (error) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg p-8 text-center">
            <svg
              className="w-16 h-16 text-red-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Unable to load pricing
            </h3>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <button
              onClick={() => router.back()}
              className="px-6 py-2 bg-(--color-links) text-white text-sm font-semibold rounded-md hover:opacity-90 transition-opacity"
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
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-gray-900">
              Complete Your Booking
            </h1>
          </div>
        </div>
      </div>

      {/* Wizard Stepper */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <BookingWizardStepper
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={handleStepClick}
        />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {/* ========== Step 0: Traveller Details ========== */}
            {currentStep === 0 && (
              <>
                {/* Flight Segments */}
                <FlightSegments segments={pricing.segments} />

                {/* Fare Breakdown */}
                <FareBreakdown
                  fareBreakdown={pricing.fareBreakdown}
                  totalFare={pricing.totalFare}
                  passengerCounts={pricing.passengerCounts}
                />

                {/* Fare Rules */}
                <FareRulesAccordion fareRules={pricing.fareRules} />

                {/* Passenger Forms */}
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

                {/* Contact Info */}
                <ContactInfoForm
                  contactInfo={contactInfo}
                  onChange={setContactInfo}
                />
              </>
            )}

            {/* ========== Step 1: Seat Selection ========== */}
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
                    <svg
                      className="w-12 h-12 text-gray-300 mx-auto mb-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 6h16M4 10h16M4 14h16M4 18h16"
                      />
                    </svg>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">
                      Seat selection not available
                    </h3>
                    <p className="text-xs text-gray-500">
                      Seat selection is not available for this flight. Seats
                      will be assigned at check-in.
                    </p>
                  </div>
                )}
              </>
            )}

            {/* ========== Step 2: Meals & Add-ons ========== */}
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

                {/* If no SSR options available at all */}
                {!pricing.ssrOptions.baggage.length &&
                  !pricing.ssrOptions.meals.length &&
                  !pricing.ssrOptions.priority.length &&
                  !pricing.ssrOptions.sports.length &&
                  !pricing.ssrOptions.fastForward.length && (
                    <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                      <svg
                        className="w-12 h-12 text-gray-300 mx-auto mb-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                        />
                      </svg>
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">
                        No add-ons available
                      </h3>
                      <p className="text-xs text-gray-500">
                        No extra services are available for this flight. You
                        can proceed to confirm your booking.
                      </p>
                    </div>
                  )}
              </>
            )}

            {/* Booking Error */}
            {bookingError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                {bookingError}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center pt-2">
              {currentStep > 0 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
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
                  className="px-8 py-2.5 bg-(--color-links) text-white text-sm font-semibold rounded-md hover:opacity-90 transition-opacity"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-8 py-2.5 bg-(--color-links) text-white text-sm font-semibold rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
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

            {/* Mobile-only sidebar */}
            <div className="lg:hidden">
              <BookingSummary {...sidebarProps} />
            </div>
          </div>

          {/* Sidebar - Desktop Only */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <BookingSummary {...sidebarProps} />
          </div>
        </div>
      </div>
    </main>
  );
}

export default function FlightDetailsPage() {
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
      <FlightDetailsContent />
    </Suspense>
  );
}
