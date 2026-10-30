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
import { AlertTriangle } from 'lucide-react';
import { BookButton, ResultsEmpty, ResultsLoader, StepHeader, StepState } from '@/components/Results/ui';
import { useAuth, useRequireAuth } from '@/contexts/AuthContext';
import { FlightSegments } from '@/components/FlightBookingDetails/FlightSegments';
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
  useRequireAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const tui = searchParams.get('tui') || '';
  const flightIndex = searchParams.get('index') || '';
  const returnFlightIndex = searchParams.get('returnIndex') || undefined;
  const tripType = (searchParams.get('tripType') === 'roundtrip' ? 'roundtrip' : 'oneway') as
    | 'oneway'
    | 'roundtrip';

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

    if (!tui || !flightIndex) {
      setError('Missing search parameters. Please go back and search again.');
      setLoading(false);
      return;
    }

    pricingLoadedRef.current = true;
    setLoading(true);
    setError('');

    priceAndGetDetails(tui, flightIndex, tripType, returnFlightIndex)
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
  }, [tui, flightIndex, returnFlightIndex, tripType]);

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

    // Fare-level booking requirements (from Benzy pricing).
    const req = pricing?.bookingRequirements;

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

      // PAN required by fare-level booking requirements.
      if (req?.panMandatory && !t.panNo) {
        return `PAN number is required for ${t.firstName || `Passenger ${i + 1}`}.`;
      }
    }

    // Baggage mandatory: at least one baggage SSR must be selected.
    if (req?.baggageMandatory && pricing) {
      const baggageSelected = selectedSSR.some((sel) =>
        pricing.ssrOptions.baggage.some(
          (b) => b.id === sel.ssrId && b.fuid === sel.fuid,
        ),
      );
      if (!baggageSelected) {
        return 'This fare requires baggage. Please add a baggage option in the Add-ons step.';
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
              charge: s.fare,
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

      // Customer-facing grand total - must match the BookingSummary figure
      // (gross fare + paid SSRs/seats − promo discount). This is what we charge.
      // Match on BOTH fuid and id (keyed like the backend's ssrChargeMap) so a
      // shared ssrId across segments can't pick the wrong charge.
      const ssrTotal = allSelections.reduce((sum, sel) => {
        const option = allSSROptions.find(
          (o) => o.id === sel.ssrId && o.fuid === sel.fuid,
        );
        return sum + (option?.charge || 0);
      }, 0);
      const promoDiscount = appliedPromo?.valid ? appliedPromo.discountAmount : 0;
      const payableAmount = Math.max(
        0,
        pricing.totalFare.gross + ssrTotal - promoDiscount,
      );

      const result = await createBooking({
        tui: pricing.tui,
        payableAmount,
        promoCode: appliedPromo?.valid ? appliedPromo.code : undefined,
        contactInfo: finalContactInfo,
        travellers,
        selectedSSR: allSelections,
        ssrChargeMap: pricing.ssrChargeMap,
        freeSSRs: pricing.freeSSRs,
        enableFareMasking: pricing.bookingRequirements?.fareMaskingRequired ?? false,
        tripSummary: {
          fromCode: pricing.segments[0]?.from || '',
          toCode:
            pricing.segments[pricing.segments.length - 1]?.to || '',
          departureDate: pricing.segments[0]?.departureTime || '',
          airline: pricing.segments[0]?.airline || '',
        },
      });

      // Hand off to the ICICI payment gateway. The ticket is issued by the
      // backend only after payment succeeds; the gateway will redirect the
      // customer to /booking/payment/result when done.
      window.location.href = result.redirectUrl;
    } catch (err: any) {
      setBookingError(err.message || 'Booking failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Shared sidebar props
  const sidebarProps = {
    fareBreakdown: pricing?.fareBreakdown || [],
    totalFare: pricing?.totalFare || { gross: 0, currency: 'INR' },
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
      <StepState>
        <ResultsLoader
          title="Loading flight details..."
          subtitle="Fetching live pricing, fare rules, and available add-ons. This may take a few seconds."
          rows={2}
        />
      </StepState>
    );
  }

  // Error state
  if (error) {
    return (
      <StepState>
        <ResultsEmpty
          icon={AlertTriangle}
          title="Unable to load pricing"
          message={error}
          action={{ label: 'Go Back', onClick: () => router.back() }}
        />
      </StepState>
    );
  }

  if (!pricing) return null;

  const first = pricing.segments[0];
  const last = pricing.segments[pricing.segments.length - 1];

  return (
    <main className="min-h-screen bg-(--color-background)">
      <StepHeader
        title="Complete Your Booking"
        subtitle={first ? `${tripType === 'roundtrip' ? `${first.from} · Round trip` : `${first.from} → ${last.to}`} · ${formatStepDate(first.departureTime)}` : undefined}
        onBack={() => router.back()}
      />

      {/* Wizard Stepper */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6">
        <BookingWizardStepper
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={handleStepClick}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {/* Fare notices (airline / fare-level advisories from Benzy) */}
            {!!pricing.fareNotices?.length && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5"
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
                <div className="flex-1 min-w-0 space-y-1">
                  {pricing.fareNotices.map((notice, i) => (
                    <p key={i} className="text-sm text-amber-800">
                      {notice}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* ========== Step 0: Traveller Details ========== */}
            {currentStep === 0 && (
              <>
                {/* Flight Segments */}
                <FlightSegments segments={pricing.segments} />

{/* Passenger Forms */}
                <div>
                  <h2 className="text-base font-bold text-(--color-foreground) mb-3">
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
                        bookingRequirements={pricing.bookingRequirements}
                        fnuLnuSettings={pricing.fnuLnuSettings}
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
                  <div className="bg-white rounded-2xl border border-(--color-tertiary-button) shadow-sm p-8 text-center">
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
                    <div className="bg-white rounded-2xl border border-(--color-tertiary-button) shadow-sm p-8 text-center">
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
                  className="px-6 py-2.5 border border-(--color-tertiary-button) text-(--color-foreground) text-sm font-bold rounded-full hover:border-(--color-links) hover:text-(--color-links) transition-colors"
                >
                  Back
                </button>
              ) : (
                <div />
              )}

              {currentStep < WIZARD_STEPS.length - 1 ? (
                <BookButton onClick={handleContinue}>Continue</BookButton>
              ) : (
                <BookButton onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? 'Processing...' : 'Confirm & Pay'}
                </BookButton>
              )}
            </div>

            {/* Mobile-only sidebar */}
            <div className="lg:hidden">
              <div className="space-y-4">
                <FareRulesAccordion fareRules={pricing.fareRules} />
                <BookingSummary {...sidebarProps} />
              </div>
            </div>
          </div>

          {/* Sidebar - Desktop Only */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            {/* Summary + fare rules travel together: the rules have to stay
                readable on the traveller step, not just on mobile. The column
                scrolls on its own so a long rules table is never cut off. */}
            <div className="sticky top-4 space-y-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
              <BookingSummary {...sidebarProps} />
              <FareRulesAccordion fareRules={pricing.fareRules} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

/** "Thu, 19 Nov" for the step header. */
function formatStepDate(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function FlightDetailsPage() {
  return (
    <Suspense
      fallback={
        <StepState>
          <ResultsLoader title="Loading..." rows={2} />
        </StepState>
      }
    >
      <FlightDetailsContent />
    </Suspense>
  );
}
