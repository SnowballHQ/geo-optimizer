import React from 'react';

const ProgressBar = ({ currentStep }) => {
  const steps = [
    { number: 1, title: 'Business' },
    { number: 2, title: 'Categories' },
    { number: 3, title: 'Competitors' },
    { number: 4, title: 'Prompts' }
  ];

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.number;
          const isCurrent = currentStep === step.number;

          return (
            <div key={step.number} className="flex flex-col items-center flex-1">
              {/* Step Circle */}
              <div className="relative">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all duration-300 ${
                    isCompleted
                      ? 'bg-primary-500 border-primary-500 text-white'
                      : isCurrent
                      ? 'bg-primary-50 border-primary-500 text-primary-500'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}
                >
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.number
                  )}
                </div>

                {/* Connecting Line - Only show between steps, not after the last step */}
                {index < steps.length - 1 && (
                  <div
                    className={`absolute top-5 left-9 w-full h-0.5 transition-all duration-300 ${
                      isCompleted ? 'bg-primary-500' : 'bg-gray-300'
                    }`}
                    style={{ width: 'calc(100vw / 4 - 2.5rem)' }}
                  />
                )}
              </div>

              {/* Step Title - Only the title, no subtitle */}
              <div className="mt-3 text-center">
                <h3
                  className={`text-sm font-medium transition-colors duration-300 ${
                    isCompleted || isCurrent
                      ? 'text-gray-900'
                      : 'text-gray-500'
                  }`}
                >
                  {step.title}
                </h3>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressBar;
