import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../utils/api';
import Step1Business from './onboarding/Step1Business';
import Step2Categories from './onboarding/Step2Categories';
import Step3Competitors from './onboarding/Step3Competitors';
import Step4Prompts from './onboarding/Step4Prompts';
import ProgressBar from './onboarding/ProgressBar';
import SuperUserAnalysisResults from './SuperUserAnalysisResults';
import { toast } from 'react-toastify';
import { Button } from './ui/button';
import { Download, RefreshCw, Crown } from 'lucide-react';

const SuperUserDomainAnalysisFlow = ({ onAnalysisComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [analysisId, setAnalysisId] = useState(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const navigate = useNavigate();

  const handleStep1Submit = async (stepData) => {
    setLoading(true);
    setError('');

    try {
      console.log('🔥 Super User Domain Analysis Step 1: Creating new isolated analysis...', stepData);
      
      // Create new isolated super user analysis
      const response = await apiService.post('/api/v1/super-user/analysis/create', {
        ...stepData,
        step: 1
      });
      
      console.log('✅ Step 1 - New analysis created:', response.data);
      
      setAnalysisId(response.data.analysisId);
      setProgress({ 
        step1: stepData,
        analysisId: response.data.analysisId
      });
      setCurrentStep(2);
      toast.success('Analysis started! Domain details saved.');
      
    } catch (error) {
      console.error('❌ Super User Domain Analysis Step 1 error:', error);
      const errorMessage = error.response?.data?.msg || error.message || 'Failed to start analysis';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Submit = async (stepData) => {
    setLoading(true);
    setError('');

    try {
      console.log('🔥 Super User Domain Analysis Step 2: Saving categories...', stepData);
      
      // Update isolated analysis with step 2 data
      const response = await apiService.post('/api/v1/super-user/analysis/update', {
        analysisId: progress.analysisId,
        step: 2,
        stepData: stepData
      });
      
      console.log('✅ Step 2 saved to isolated analysis:', response.data);
      
      setProgress(prev => ({ 
        ...prev, 
        step2: stepData 
      }));
      setCurrentStep(3);
      toast.success('Categories saved!');
      
    } catch (error) {
      console.error('❌ Super User Domain Analysis Step 2 error:', error);
      const errorMessage = error.response?.data?.msg || error.message || 'Failed to save categories';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleStep3Submit = async (stepData) => {
    setLoading(true);
    setError('');

    try {
      console.log('🔥 Super User Domain Analysis Step 3: Saving competitors...', stepData);
      
      // Update isolated analysis with step 3 data
      const response = await apiService.post('/api/v1/super-user/analysis/update', {
        analysisId: progress.analysisId,
        step: 3,
        stepData: stepData
      });
      
      console.log('✅ Step 3 saved to isolated analysis:', response.data);
      
      setProgress(prev => ({ 
        ...prev, 
        step3: stepData 
      }));
      setCurrentStep(4);
      toast.success('Competitors saved!');
      
    } catch (error) {
      console.error('❌ Super User Domain Analysis Step 3 error:', error);
      const errorMessage = error.response?.data?.msg || error.message || 'Failed to save competitors';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleStep4Submit = async (stepData) => {
    setLoading(true);
    setError('');
    
    // Show progress message
    toast.info('🚀 Starting comprehensive analysis... This may take several minutes.');

    try {
      console.log('🔥 Super User Domain Analysis Step 4: Completing analysis...', stepData);
      
      // Complete the isolated analysis with extended timeout
      const response = await apiService.post('/api/v1/super-user/analysis/complete', {
        analysisId: progress.analysisId,
        step4Data: stepData
      }, {
        timeout: 600000, // 10 minutes timeout for Super User analysis completion
        onUploadProgress: (progressEvent) => {
          console.log('🔄 Analysis in progress...', Math.round((progressEvent.loaded * 100) / progressEvent.total) + '%');
        }
      });
      
      console.log('🎉 Super User Domain Analysis Complete:', response.data);
      toast.success('Super User Domain Analysis Complete!');
      
      // Save final step data and show completion
      setProgress(prev => ({ 
        ...prev, 
        step4: stepData,
        analysisResult: response.data.analysisResults,
        // Ensure all step data is available for results display
        step1: prev.step1,
        step2: prev.step2,
        step3: prev.step3
      }));
      setAnalysisComplete(true);
      
      // Call the completion callback to refresh history
      if (onAnalysisComplete) {
        onAnalysisComplete();
      }
      
    } catch (error) {
      console.error('❌ Super User Domain Analysis Step 4 error:', error);
      
      let errorMessage;
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        errorMessage = 'Analysis is taking longer than expected. This can happen with complex analyses. Please try again or contact support if the issue persists.';
      } else {
        errorMessage = error.response?.data?.msg || error.message || 'Analysis failed';
      }
      
      setError(`Analysis failed: ${errorMessage}`);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError('');
    }
  };

  const handleStartNewAnalysis = () => {
    setCurrentStep(1);
    setProgress({});
    setError('');
    setAnalysisComplete(false);
    setAnalysisId(null);
  };

  const handleDownloadPDF = async () => {
    if (!progress.analysisResult?.brandId) {
      toast.error('No analysis data available for PDF download');
      return;
    }

    try {
      setDownloadingPdf(true);
      console.log('📄 Downloading PDF for isolated analysis:', progress.analysisResult.brandId);
      
      const token = localStorage.getItem('auth') || localStorage.getItem('token');
      
      // Use the Super User specific PDF download endpoint
      const response = await fetch(`/api/v1/super-user/analysis/${progress.analysisId}/download-pdf`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        throw new Error(`PDF download failed: ${response.status}`);
      }

      // Get the PDF blob and download it
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SuperUser_${progress.step1?.domain?.replace(/[^a-zA-Z0-9]/g, '_')}_Analysis_${progress.analysisId}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('PDF downloaded successfully!');
      
    } catch (error) {
      console.error('PDF download error:', error);
      toast.error('Failed to download PDF report');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1Business
            onComplete={(stepData, nextStep) => handleStep1Submit(stepData.step1)}
            loading={loading}
            error={error}
            progress={progress}
          />
        );
      case 2:
        return (
          <Step2Categories
            onComplete={(stepData, nextStep) => handleStep2Submit(stepData.step2)}
            loading={loading}
            error={error}
            progress={progress}
          />
        );
      case 3:
        return (
          <Step3Competitors
            onComplete={(stepData, nextStep) => handleStep3Submit(stepData.step3)}
            loading={loading}
            error={error}
            progress={progress}
          />
        );
      case 4:
        return (
          <Step4Prompts
            onComplete={(stepData, nextStep) => handleStep4Submit(stepData.step4)}
            loading={loading}
            error={error}
            progress={progress}
            isSuperUser={true}
          />
        );
      default:
        return null;
    }
  };

  const renderAnalysisComplete = () => {
    // Show detailed analysis results instead of summary
    return (
      <SuperUserAnalysisResults
        analysisData={{
          analysisId: analysisId,
          domain: progress.step1?.domain,
          brandName: progress.step1?.brandName,
          brandInformation: progress.step1?.brandInformation || progress.step1?.description,
          createdAt: new Date().toISOString(),
          analysisResults: progress.analysisResult,
          // Include all step data for proper display
          step1Data: progress.step1,
          step2Data: progress.step2,
          step3Data: progress.step3,
          step4Data: progress.step4
        }}
        onBack={() => {
          // This will be used when viewing from history
          console.log('Back button clicked from results');
        }}
        onStartNewAnalysis={handleStartNewAnalysis}
        downloadingPdf={downloadingPdf}
        onDownloadPDF={handleDownloadPDF}
      />
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Super User Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-2xl mb-4">
          <Crown className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-[#4a4a6a] mb-2">
          Super User Domain Analysis
        </h1>
        <p className="text-[#6b7280]">
          Complete isolated domain analysis with AI-powered insights and market analysis
        </p>
        {analysisId && (
          <p className="text-sm text-gray-500 mt-1">
            Analysis ID: {analysisId}
          </p>
        )}
      </div>

      {/* Show Analysis Complete or Progress */}
      {analysisComplete ? (
        renderAnalysisComplete()
      ) : (
        <>
          {/* Progress Bar */}
          <ProgressBar currentStep={currentStep} totalSteps={4} />
          <div className="text-center mb-4 text-sm text-gray-600">
            <p>Step 4 includes: Prompts → AI Analysis → Mentions → Share of Voice</p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Current Step */}
          <div className="mt-8">
            {renderCurrentStep()}
          </div>
        </>
      )}
    </div>
  );
};

export default SuperUserDomainAnalysisFlow;