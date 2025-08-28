import React, { useState, useEffect } from 'react';
import ResponsesStep from './ResponsesStep';
import MentionsStep from './MentionsStep';
import SOVStep from './SOVStep';
import BrandDashboardStep from './BrandDashboardStep';

const PostAnalysisFlow = ({
  brandId,
  analysisId,
  brandName,
  competitors = [],
  onStartNewAnalysis,
  onDownloadPDF,
  downloadingPdf = false,
  isSuperUser = false,
  initialStep = 'responses' // 'responses', 'mentions', 'sov', 'dashboard'
}) => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [loading, setLoading] = useState(false);

  // Define step sequence
  const steps = ['responses', 'mentions', 'sov', 'dashboard'];
  
  const getCurrentStepIndex = () => steps.indexOf(currentStep);
  const getTotalSteps = () => steps.length;

  const handleNext = async () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex < steps.length - 1) {
      setLoading(true);
      // Add a small delay for better UX
      setTimeout(() => {
        setCurrentStep(steps[currentIndex + 1]);
        setLoading(false);
      }, 500);
    }
  };

  const renderCurrentStep = () => {
    const commonProps = {
      brandId,
      analysisId,
      brandName,
      competitors,
      onNext: handleNext,
      loading,
      isSuperUser
    };

    switch (currentStep) {
      case 'responses':
        return <ResponsesStep {...commonProps} />;
      
      case 'mentions':
        return <MentionsStep {...commonProps} />;
      
      case 'sov':
        return <SOVStep {...commonProps} />;
      
      case 'dashboard':
        return (
          <BrandDashboardStep 
            {...commonProps}
            onStartNewAnalysis={onStartNewAnalysis}
            onDownloadPDF={onDownloadPDF}
            downloadingPdf={downloadingPdf}
          />
        );
      
      default:
        return <ResponsesStep {...commonProps} />;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Progress indicator - only show for first 3 steps */}
      {currentStep !== 'dashboard' && (
        <div className="bg-white border-b">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Analysis Progress
                </h2>
              </div>
              
              <div className="flex items-center space-x-2">
                {steps.slice(0, -1).map((step, index) => {
                  const isActive = index === getCurrentStepIndex();
                  const isCompleted = index < getCurrentStepIndex();
                  
                  return (
                    <div key={step} className="flex items-center">
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                        ${isActive ? 'bg-blue-600 text-white' : 
                          isCompleted ? 'bg-green-600 text-white' : 
                          'bg-gray-200 text-gray-600'}
                      `}>
                        {isCompleted ? '✓' : index + 1}
                      </div>
                      
                      {index < steps.length - 2 && (
                        <div className={`
                          w-12 h-1 mx-2
                          ${isCompleted ? 'bg-green-600' : 'bg-gray-200'}
                        `} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Step Labels */}
            <div className="flex items-center justify-end mt-2 space-x-2">
              {['Responses', 'Mentions', 'Share of Voice'].map((label, index) => {
                const isActive = index === getCurrentStepIndex();
                return (
                  <div key={label} className="flex items-center">
                    <span className={`
                      text-xs font-medium px-2
                      ${isActive ? 'text-blue-600' : 'text-gray-500'}
                    `}>
                      {label}
                    </span>
                    {index < 2 && <div className="w-12" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Current Step Content */}
      {renderCurrentStep()}
    </div>
  );
};

export default PostAnalysisFlow;