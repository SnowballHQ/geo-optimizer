import React from 'react';
import { motion } from 'framer-motion';
import { Building2, FolderKanban, Target, MessageSquare, Check, Clock } from 'lucide-react';

const VerticalProgress = ({ currentStep }) => {
  const steps = [
    {
      number: 1,
      title: 'Business Details',
      icon: Building2,
      time: '2 min',
      tips: ['Your brand name and domain', 'AI will help autocomplete details']
    },
    {
      number: 2,
      title: 'Content Categories',
      icon: FolderKanban,
      time: '3 min',
      tips: ['Topics you create content about', 'Select 3-5 categories']
    },
    {
      number: 3,
      title: 'Competitors',
      icon: Target,
      time: '2 min',
      tips: ['Brands in your niche', 'We\'ll analyze their strategies']
    },
    {
      number: 4,
      title: 'AI Prompts',
      icon: MessageSquare,
      time: '3 min',
      tips: ['Configure AI responses', 'Customize analysis depth']
    }
  ];

  const currentStepData = steps[currentStep - 1];

  return (
    <div className="space-y-8">
      {/* Steps List */}
      <div className="relative">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.number;
          const isCurrent = currentStep === step.number;
          const Icon = step.icon;

          return (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: step.number * 0.1 }}
              className="relative flex items-start mb-8 last:mb-0"
            >
              {/* Circle Column - Fixed Width */}
              <div className="relative flex-shrink-0 w-10">
                {/* Connecting Line */}
                {step.number < steps.length && (
                  <div className="absolute left-[19.5px] top-10 w-0.5 h-[calc(100%+16px)] bg-white/20" />
                )}

                {/* Step Circle */}
                <div
                  className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isCompleted
                      ? 'bg-white text-primary-600'
                      : isCurrent
                      ? 'bg-primary-500 text-white'
                      : 'bg-white/10 text-white/50'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" strokeWidth={3} />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
              </div>

              {/* Text Column */}
              <div className="flex-1 ml-3 min-h-[40px] flex flex-col justify-center">
                <div className="flex items-center justify-between">
                  <h3
                    className={`text-sm font-semibold transition-colors ${
                      isCurrent ? 'text-white' : isCompleted ? 'text-white/90' : 'text-white/50'
                    }`}
                  >
                    {step.title}
                  </h3>
                  <div className="flex items-center space-x-1 text-white/70 text-xs">
                    <Clock className="w-3 h-3" />
                    <span>{step.time}</span>
                  </div>
                </div>
                <p className={`text-xs mt-0.5 transition-colors ${
                  isCompleted ? 'text-white/60' : 'text-white/40'
                }`}>
                  {isCompleted ? 'Completed' : isCurrent ? 'In progress' : 'Pending'}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Current Step Tips */}
      {currentStepData && (
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-sm rounded-lg p-5 border border-white/20"
        >
          <h4 className="text-sm font-semibold text-white mb-2">Why we need this</h4>
          <ul className="space-y-1.5">
            {currentStepData.tips.map((tip, index) => (
              <li key={index} className="text-xs text-white/80 flex items-start">
                <span className="text-white/60 mr-2">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Overall Progress */}
      <div className="pt-4 border-t border-white/20">
        <div className="flex items-center justify-between text-xs text-white/70 mb-2">
          <span>Overall Progress</span>
          <span className="font-semibold text-white">{Math.round((currentStep / steps.length) * 100)}%</span>
        </div>
        <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-white rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${(currentStep / steps.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <p className="text-xs text-white/60 mt-2">
          {steps.length - currentStep} {steps.length - currentStep === 1 ? 'step' : 'steps'} remaining
        </p>
      </div>
    </div>
  );
};

export default VerticalProgress;
