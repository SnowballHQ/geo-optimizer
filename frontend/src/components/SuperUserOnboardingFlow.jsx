import React, { useState } from 'react';
import { apiService } from '../utils/api';
import Step1Business from './onboarding/Step1Business';
import Step2Categories from './onboarding/Step2Categories';
import Step3Competitors from './onboarding/Step3Competitors';
import Step4Prompts from './onboarding/Step4Prompts';
import ProgressBar from './onboarding/ProgressBar';
import SuperUserAnalysisResults from './SuperUserAnalysisResults';
import { toast } from 'react-toastify';
import { Button } from './ui/button';
import { Download, RefreshCw, Crown, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const SuperUserOnboardingFlow = ({ onAnalysisComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [savingToHistory, setSavingToHistory] = useState(false);

  // Generate unique session ID for this Super User analysis
  const [sessionId] = useState(`super_user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  const handleStepComplete = async (stepData, nextStep) => {
    try {
      setLoading(true);
      setError('');
      
      console.log(`🔥 Super User Step ${currentStep} completed:`, stepData);
      
      // Save progress and update to next step
      setProgress(prev => ({ 
        ...prev, 
        [`step${currentStep}`]: stepData 
      }));
      
      if (nextStep <= 4) {
        setCurrentStep(nextStep);
      } else {
        // Steps 1-4 completed, now trigger the remaining analysis steps (5-7)
        await completeAnalysis();
      }
    } catch (error) {
      console.error(`Step ${currentStep} completion failed:`, error);
      setError(`Failed to complete step ${currentStep}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const completeAnalysis = async () => {
    try {
      console.log('🚀 Starting Super User onboarding completion with reused flow...');
      setLoading(true);
      
      // Show progress message
      toast.info('🚀 Starting comprehensive analysis... This may take several minutes.');

      // Step 1: Domain Analysis (reuse existing endpoint with super-user mode)
      console.log('📍 Step 1: Domain analysis...');
      const step1Response = await apiService.post('/api/v1/onboarding/step1-domain', {
        ...progress.step1,
        superUserMode: true,
        sessionId: sessionId
      });
      console.log('✅ Step 1 completed:', step1Response.data);

      // Step 2: Categories (reuse existing endpoint with super-user mode)
      console.log('🏷️ Step 2: Categories...');
      const step2Response = await apiService.post('/api/v1/onboarding/step2-categories', {
        ...progress.step2,
        superUserMode: true,
        sessionId: sessionId
      });
      console.log('✅ Step 2 completed:', step2Response.data);

      // Step 3: Competitors (reuse existing endpoint with super-user mode)
      console.log('🏆 Step 3: Competitors...');
      const step3Response = await apiService.post('/api/v1/onboarding/step3-competitors', {
        ...progress.step3,
        superUserMode: true,
        sessionId: sessionId
      });
      console.log('✅ Step 3 completed:', step3Response.data);

      // Step 4: Prompts (reuse existing endpoint with super-user mode)
      console.log('📝 Step 4: Prompts...');
      const step4Response = await apiService.post('/api/v1/onboarding/step4-prompts', {
        ...progress.step4,
        superUserMode: true,
        sessionId: sessionId
      });
      console.log('✅ Step 4 completed:', step4Response.data);

      // Steps 5-7: Complete analysis (AI responses, mentions, SOV)
      console.log('🔬 Steps 5-7: Complete analysis (AI responses, mentions, SOV)...');
      const completionResponse = await apiService.post('/api/v1/onboarding/complete', {
        superUserMode: true,
        sessionId: sessionId
      }, {
        timeout: 600000 // 10 minutes timeout
      });
      
      console.log('🎉 Super User analysis complete:', completionResponse.data);
      
      // Create analysis data structure for results display
      const analysisResults = {
        sessionId: sessionId,
        domain: progress.step1?.domain,
        brandName: progress.step1?.brandName,
        brandInformation: progress.step1?.description,
        createdAt: new Date().toISOString(),
        step1Data: progress.step1,
        step2Data: progress.step2,
        step3Data: progress.step3,
        step4Data: progress.step4,
        analysisResults: completionResponse.data,
        brandId: step1Response.data.brand?._id
      };
      
      setAnalysisData(analysisResults);
      setAnalysisComplete(true);
      toast.success('Super User Domain Analysis Complete!');
      
      // Call completion callback if provided
      if (onAnalysisComplete) {
        onAnalysisComplete(analysisResults);
      }
      
    } catch (error) {
      console.error('❌ Super User analysis completion error:', error);
      
      let errorMessage;
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        errorMessage = 'Analysis is taking longer than expected. This can happen with complex analyses. Please try again or contact support if the issue persists.';
      } else {
        errorMessage = error.response?.data?.error || error.message || 'Analysis failed';
      }
      
      setError(`Analysis failed: ${errorMessage}`);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleStartNewAnalysis = () => {
    setCurrentStep(1);
    setProgress({});
    setError('');
    setAnalysisComplete(false);
    setAnalysisData(null);
  };

  const handleDownloadPDF = async () => {
    if (!analysisData?.brandId) {
      toast.error('No analysis data available for PDF download');
      return;
    }

    try {
      setDownloadingPdf(true);
      console.log('📄 Downloading PDF for Super User analysis:', analysisData.sessionId);
      
      const token = localStorage.getItem('auth') || localStorage.getItem('token');
      
      const response = await fetch(`/api/v1/brand/${analysisData.brandId}/download-pdf?superUser=true&sessionId=${analysisData.sessionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('PDF download error response:', errorText);
        throw new Error(`PDF download failed: ${response.status} - ${errorText}`);
      }

      // Get the PDF blob and download it
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SuperUser_${analysisData.domain?.replace(/[^a-zA-Z0-9]/g, '_')}_Analysis_${analysisData.sessionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Comprehensive PDF report downloaded successfully!');
      console.log('✅ Super User PDF downloaded successfully');
      
    } catch (error) {
      console.error('PDF download error:', error);
      toast.error('Failed to download PDF report');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleSaveToHistory = async () => {
    if (!analysisData) {
      toast.error('No analysis data available to save');
      return;
    }

    try {
      setSavingToHistory(true);
      console.log('💾 Saving Super User analysis to history:', analysisData.sessionId);
      
      // Save to Super User analysis history
      const response = await apiService.post('/api/v1/super-user/analysis/save-to-history', {
        sessionId: analysisData.sessionId,
        analysisData: analysisData
      });
      
      console.log('✅ Analysis saved to history:', response.data);
      toast.success('Analysis saved to history successfully!');
      
      // Call completion callback to refresh history
      if (onAnalysisComplete) {
        onAnalysisComplete(analysisData);
      }
      
    } catch (error) {
      console.error('Save to history error:', error);
      toast.error('Failed to save analysis to history');
    } finally {
      setSavingToHistory(false);
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
        return <Step4Prompts {...commonProps} isSuperUser={true} />;
      default:
        return <Step1Business {...commonProps} />;
    }
  };

  const renderAnalysisComplete = () => {
    return (
      <div className="space-y-6">
        {/* Action Buttons */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Crown className="w-5 h-5 mr-2 text-yellow-600" />
              Super User Analysis Complete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleDownloadPDF}
                disabled={downloadingPdf}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {downloadingPdf ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleSaveToHistory}
                disabled={savingToHistory}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {savingToHistory ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save to History
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleStartNewAnalysis}
                variant="outline"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                New Analysis
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Analysis Results */}
        <SuperUserAnalysisResults
          analysisData={analysisData}
          onBack={() => console.log('Back button clicked')}
          onStartNewAnalysis={handleStartNewAnalysis}
          downloadingPdf={downloadingPdf}
          onDownloadPDF={handleDownloadPDF}
        />
      </div>
    );
  };

  if (loading && currentStep > 4) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center mb-6">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-6"></div>
          <p className="text-xl font-semibold text-gray-900 mb-3">Completing Super User analysis...</p>
          <p className="text-gray-600 mb-2">Steps 5-7: Generating AI responses, extracting mentions, and calculating Share of Voice</p>
          <p className="text-sm text-gray-500">This may take several minutes as we analyze your domain data with full isolation</p>
        </div>
      </div>
    );
  }

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
          Complete domain analysis using the full 7-step onboarding flow with data isolation
        </p>
        {sessionId && (
          <p className="text-sm text-gray-500 mt-1">
            Session ID: {sessionId}
          </p>
        )}
      </div>

      {/* Show Analysis Complete or Progress */}
      {analysisComplete ? (
        renderAnalysisComplete()
      ) : (
        <>
          {/* Progress Bar */}
          <ProgressBar currentStep={currentStep} totalSteps={7} />
          <div className="text-center mb-4">
            <p className="text-sm text-gray-600">
              Steps 1-4: Interactive Setup • Steps 5-7: Automated Analysis (AI responses, mentions, SOV)
            </p>
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

export default SuperUserOnboardingFlow;