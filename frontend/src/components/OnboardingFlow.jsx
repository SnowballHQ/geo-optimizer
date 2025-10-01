import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiService } from '../utils/api';
import { isSuperuser } from '../utils/auth';
import Step1Business from './onboarding/Step1Business';
import Step2Categories from './onboarding/Step2Categories';
import Step3Competitors from './onboarding/Step3Competitors';
import Step4Prompts from './onboarding/Step4Prompts';
import VerticalProgress from './onboarding/VerticalProgress';

const OnboardingFlow = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Redirect super users to dashboard instead of onboarding
  useEffect(() => {
    if (isSuperuser()) {
      console.log('🔥 Super user detected - redirecting to dashboard instead of onboarding');
      navigate('/dashboard');
      return;
    }
    loadUserProgress();
  }, [navigate]);

  const loadUserProgress = async () => {
    try {
      const response = await apiService.getOnboardingProgress();
      if (response.data.currentStep > 1) {
        setCurrentStep(response.data.currentStep);
        setProgress(response.data.stepData);
      }
    } catch (error) {
      console.log('No saved progress found, starting from step 1');
    }
  };

  const saveProgress = async (stepData) => {
    try {
      await apiService.saveOnboardingProgress({
        currentStep,
        stepData: { ...progress, ...stepData }
      });
      setProgress(prev => ({ ...prev, ...stepData }));
    } catch (error) {
      console.error('Failed to save progress:', error);
      setError('Failed to save progress. Please try again.');
    }
  };

  const handleStepComplete = async (stepData, nextStep) => {
    try {
      setLoading(true);
      setError('');

      // Save progress for current step
      await saveProgress(stepData);

      if (nextStep <= 4) {
        setCurrentStep(nextStep);
      } else {
        // Onboarding completed, trigger remaining analysis
        await completeOnboarding();
      }
    } catch (error) {
      console.error('Step completion failed:', error);
      setError('Failed to complete step. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const completeOnboarding = async () => {
    try {
      console.log('🚀 Starting onboarding completion...');

      // Mark onboarding as completed and trigger remaining analysis
      const response = await apiService.completeOnboarding();

      if (response.data.success) {
        console.log('✅ Onboarding completed successfully:', response.data.analysisSteps);

        // All users who complete onboarding go to their brand dashboard
        navigate('/domain-analysis');
      } else {
        throw new Error('Onboarding completion failed');
      }
    } catch (error) {
      console.error('Onboarding completion failed:', error);
      setError('Failed to complete onboarding. Please try again.');
    }
  };

  const renderCurrentStep = () => {
    const commonProps = {
      onComplete: handleStepComplete,
      loading,
      error,
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-14 h-14 gradient-primary rounded-2xl flex items-center justify-center mb-5 mx-auto shadow-lg">
            <span className="text-xl font-bold text-white">S</span>
          </div>
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500 mx-auto mb-5"></div>
          <p className="text-lg font-semibold text-gray-900 mb-2">Completing onboarding...</p>
          <p className="text-sm text-gray-600 mb-1">Generating AI responses, extracting mentions, and calculating Share of Voice</p>
          <p className="text-xs text-gray-500">This may take a few minutes as we analyze your brand data</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Sidebar - Progress Panel */}
      <div className="hidden lg:flex lg:w-72 bg-gradient-to-br from-primary-600 to-primary-800 p-8 flex-col relative">
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
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <div className="lg:hidden bg-gradient-to-r from-primary-600 to-primary-700 p-4">
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
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6"
              >
                <p className="text-red-800 text-sm">{error}</p>
              </motion.div>
            )}

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

export default OnboardingFlow;
