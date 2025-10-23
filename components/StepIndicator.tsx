'use client';

interface Step {
  id: string;
  label: string;
  description: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: string;
  completed: Record<string, boolean>;
}

export default function StepIndicator({ steps, currentStep, completed }: StepIndicatorProps) {
  return (
    <div className="space-y-3">
      {steps.map((step, index) => {
        const isActive = step.id === currentStep;
        const isCompleted = completed[step.id];

        return (
          <div key={step.id} className="flex items-start space-x-3">
            {/* Step Circle */}
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                isCompleted
                  ? 'bg-green-500 text-white'
                  : isActive
                    ? 'bg-blue-500 text-white ring-4 ring-blue-200 dark:ring-blue-900/50'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              {isCompleted ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : isActive ? (
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              ) : (
                index + 1
              )}
            </div>

            {/* Step Content */}
            <div className="flex-1 pt-1">
              <p
                className={`text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : isCompleted
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {step.label}
              </p>
              <p
                className={`text-xs transition-colors ${
                  isActive
                    ? 'text-blue-500 dark:text-blue-300'
                    : isCompleted
                      ? 'text-green-500 dark:text-green-300'
                      : 'text-gray-500 dark:text-gray-500'
                }`}
              >
                {step.description}
              </p>
            </div>

            {/* Animated Spinner for Active Step */}
            {isActive && (
              <div className="flex-shrink-0 pt-1">
                <div className="relative w-4 h-4">
                  <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-400 dark:border-t-blue-300 animate-spin"></div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
