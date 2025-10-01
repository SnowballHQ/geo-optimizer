import React from 'react';
import { motion } from 'framer-motion';
import { Building2, FolderKanban, Target, MessageSquare, Check } from 'lucide-react';

const ProgressBar = ({ currentStep }) => {
  const steps = [
    { number: 1, title: 'Business', icon: Building2, description: 'Your brand details' },
    { number: 2, title: 'Categories', icon: FolderKanban, description: 'Content topics' },
    { number: 3, title: 'Competitors', icon: Target, description: 'Market analysis' },
    { number: 4, title: 'Prompts', icon: MessageSquare, description: 'AI configuration' }
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between max-w-2xl mx-auto relative">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.number;
          const isCurrent = currentStep === step.number;
          const Icon = step.icon;

          return (
            <React.Fragment key={step.number}>
              {/* Step Item */}
              <div className="flex flex-col items-center flex-1 relative z-10">
                {/* Step Circle */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all duration-300 ${
                      isCompleted
                        ? 'bg-gradient-to-br from-primary-500 to-primary-600 border-primary-500 text-white shadow-md'
                        : isCurrent
                        ? 'bg-white border-primary-500 text-primary-600 shadow-md ring-2 ring-primary-100'
                        : 'bg-white border-gray-300 text-gray-400'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4" strokeWidth={3} />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                </motion.div>

                {/* Step Title */}
                <div className="mt-2 text-center">
                  <h3
                    className={`text-xs font-medium transition-colors duration-300 ${
                      isCompleted || isCurrent
                        ? 'text-gray-900'
                        : 'text-gray-500'
                    }`}
                  >
                    {step.title}
                  </h3>
                </div>
              </div>

              {/* Connecting Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-3 -mt-10 relative z-0">
                  <div className="h-full bg-gray-200 rounded-full" />
                  <motion.div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{
                      width: isCompleted ? '100%' : '0%'
                    }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Progress Percentage */}
      <div className="text-center mt-4">
        <div className="inline-flex items-center space-x-2 bg-primary-50 px-3 py-1.5 rounded-full">
          <div className="text-xs font-medium text-primary-700">
            Step {currentStep} of {steps.length}
          </div>
          <div className="w-px h-3 bg-primary-200" />
          <div className="text-xs font-semibold text-primary-600">
            {Math.round((currentStep / steps.length) * 25)}% Complete
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
