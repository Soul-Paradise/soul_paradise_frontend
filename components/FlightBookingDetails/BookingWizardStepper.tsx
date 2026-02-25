'use client';

interface BookingWizardStepperProps {
  currentStep: number;
  completedSteps: Set<number>;
  onStepClick: (step: number) => void;
}

const STEPS = [
  { label: 'Travellers', shortLabel: 'Details' },
  { label: 'Seats', shortLabel: 'Seats' },
  { label: 'Add-ons', shortLabel: 'Add-ons' },
];

export const BookingWizardStepper = ({
  currentStep,
  completedSteps,
  onStepClick,
}: BookingWizardStepperProps) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-4 sm:px-6 py-4 mb-2">
      <div className="flex items-center justify-between max-w-md mx-auto">
        {STEPS.map((step, i) => {
          const isCompleted = completedSteps.has(i);
          const isCurrent = i === currentStep;
          const isClickable = isCompleted || i < currentStep;

          return (
            <div key={i} className="flex items-center flex-1 last:flex-initial">
              {/* Step circle + label */}
              <button
                type="button"
                onClick={() => isClickable && onStepClick(i)}
                disabled={!isClickable && !isCurrent}
                className={`flex flex-col items-center gap-1.5 group ${
                  isClickable ? 'cursor-pointer' : isCurrent ? 'cursor-default' : 'cursor-not-allowed'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                    isCurrent
                      ? 'bg-(--color-links) text-white'
                      : isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {isCompleted && !isCurrent ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  className={`text-xs font-medium ${
                    isCurrent
                      ? 'text-(--color-links)'
                      : isCompleted
                        ? 'text-green-600'
                        : 'text-gray-400'
                  }`}
                >
                  <span className="hidden sm:inline">{step.label}</span>
                  <span className="sm:hidden">{step.shortLabel}</span>
                </span>
              </button>

              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div className="flex-1 mx-3 mt-[-1rem]">
                  <div
                    className={`h-0.5 w-full ${
                      completedSteps.has(i) ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
