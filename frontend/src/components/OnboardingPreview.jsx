import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye } from 'lucide-react';
import Step1Business from './onboarding/Step1Business';
import Step2Categories from './onboarding/Step2Categories';
import Step3Competitors from './onboarding/Step3Competitors';
import Step4Prompts from './onboarding/Step4Prompts';
import VerticalProgress from './onboarding/VerticalProgress';

const OnboardingPreview = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [progress, setProgress] = useState({});

  const handleStepComplete = (stepData, nextStep) => {
    // In preview mode, just update local state and move to next step
    setProgress(prev => ({ ...prev, ...stepData }));

    if (nextStep <= 4) {
      setCurrentStep(nextStep);
    } else {
      // Simulate completion - just reset to step 1
      alert('Onboarding flow complete! (Preview mode - no data saved)');
      setCurrentStep(1);
      setProgress({});
    }
  };

  const renderCurrentStep = () => {
    const commonProps = {
      onComplete: handleStepComplete,
      loading: false,
      error: '',
      progress
    };

    switch (currentStep) {
      case 1:
        return <Step1Business {...commonProps} />;
      case 2:
        return <Step2Categories {...commonProps} />;
      case 3:
        return <Step3Competitors {...commonProps} />;
      case 4:
        return <Step4Prompts {...commonProps} />;
      default:
        return <Step1Business {...commonProps} />;
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Preview Mode Banner */}
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-yellow-50 border-b border-yellow-200 py-2 px-4"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Eye className="w-4 h-4 text-yellow-600" />
            <div>
              <p className="text-xs font-semibold text-yellow-800">Preview Mode</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex space-x-2">
              {[1, 2, 3, 4].map(step => (
                <button
                  key={step}
                  onClick={() => setCurrentStep(step)}
                  className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                    currentStep === step
                      ? 'bg-yellow-600 text-white'
                      : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  }`}
                >
                  {step}
                </button>
              ))}
            </div>
            <Link
              to="/dashboard"
              className="text-xs text-yellow-700 hover:text-yellow-900 font-medium flex items-center space-x-1"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Exit</span>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Left Sidebar - Progress Panel */}
      <div className="hidden lg:flex lg:w-72 bg-gradient-to-br from-primary-600 to-primary-800 p-8 flex-col mt-12 relative">
        {/* Logo */}
        <Link to="/" className="mb-12">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-lg font-bold text-primary-600">S</span>
            </div>
            <span className="text-xl font-bold text-white">Snowball</span>
          </div>
        </Link>

        {/* Vertical Progress */}
        <VerticalProgress currentStep={currentStep} />

        {/* Smooth gradient transition on right edge */}
        <div className="absolute top-0 right-0 bottom-0 w-px bg-gradient-to-b from-primary-700/30 via-primary-600/20 to-primary-700/30" />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col mt-12 lg:mt-0">
        {/* Mobile Header */}
        <div className="lg:hidden bg-gradient-to-r from-primary-600 to-primary-700 p-4 mt-12">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-sm font-bold text-primary-600">S</span>
              </div>
              <span className="text-lg font-bold text-white">Snowball</span>
            </Link>
            <div className="text-white text-sm font-medium">
              Step {currentStep} of 4
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 via-white to-gray-50 relative">
          {/* Gradient blend overlay from sidebar */}
          <div className="hidden lg:block absolute top-0 left-0 bottom-0 w-32 bg-gradient-to-r from-primary-600/15 via-primary-500/8 to-transparent pointer-events-none" />

          <div className="max-w-3xl mx-auto p-6 lg:p-12 relative z-10">
            {/* Current Step */}
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.98 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              {renderCurrentStep()}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPreview;
