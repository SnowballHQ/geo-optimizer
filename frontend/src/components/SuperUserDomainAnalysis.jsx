import React, { useState } from "react";
import { toast } from "react-toastify";
import { apiService } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import DomainForm from "../pages/DomainForm";
import BrandSummary from "../pages/BrandSummary";
import ShareOfVoiceTable from "../pages/ShareOfVoiceTable";
import CompetitorsAnalysis from "../pages/CompetitorsAnalysis";
import CategoriesWithPrompts from "../pages/CategoriesWithPrompts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { RefreshCw, Crown, Download } from 'lucide-react';

const SuperUserDomainAnalysis = ({ onAnalysisComplete }) => {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loadingTime, setLoadingTime] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [progressSteps, setProgressSteps] = useState([]);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Analysis steps for progress tracking
  const analysisSteps = [
    { id: 1, name: "Creating brand profile", description: "Setting up brand information and domain details" },
    { id: 2, name: "Extracting categories", description: "Analyzing domain to identify business categories" },
    { id: 3, name: "Discovering competitors", description: "Finding competitors and market alternatives" },
    { id: 4, name: "Generating search prompts", description: "Creating AI prompts for comprehensive analysis" },
    { id: 5, name: "Running AI analysis", description: "Processing prompts with AI for market insights" },
    { id: 6, name: "Calculating Share of Voice", description: "Computing brand visibility and market share metrics" }
  ];

  const handleAnalyze = async (e) => {
    e.preventDefault();
    
    if (!domain.trim()) {
      toast.error("Please enter a domain");
      return;
    }

    // Basic domain validation
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domain)) {
      toast.error("Please enter a valid domain (e.g., example.com)");
      return;
    }

    setLoading(true);
    setError(null);
    setLoadingTime(0);
    setCurrentStep("");
    setProgressSteps([]);
    setResult(null);
    
    // Start loading timer
    const startTime = Date.now();
    const timer = setInterval(() => {
      setLoadingTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setProgressSteps(prev => {
        if (prev.length < analysisSteps.length) {
          const nextStep = analysisSteps[prev.length];
          setCurrentStep(nextStep.name);
          return [...prev, nextStep];
        }
        return prev;
      });
    }, 3000); // Update every 3 seconds
    
    try {
      console.log('🔥 Super User - Starting domain analysis for:', domain);
      const response = await apiService.analyzeBrand({ 
        domain: domain,
        brandName: domain,
        isSuperUserAnalysis: true // Flag for backend to handle as super user analysis
      });
      
      console.log('✅ Super User - Domain analysis completed:', response.data);
      setResult(response.data);
      setCurrentStep("Analysis complete!");
      
      // Notify parent component about analysis completion
      if (onAnalysisComplete && typeof onAnalysisComplete === 'function') {
        onAnalysisComplete();
      }
      
      toast.success("Super User domain analysis completed successfully!");
      
    } catch (error) {
      console.error('❌ Super User domain analysis error:', error);
      
      // Handle different types of errors
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        setError("Analysis is taking longer than expected. Please try again or check if the domain is accessible.");
        toast.error("Analysis timed out. Domain analysis can take several minutes for complex domains.");
      } else if (error.response?.status === 404) {
        setError("Domain not found or not accessible. Please check the domain name.");
      } else if (error.response?.status === 500) {
        setError("Server error during analysis. Please try again later.");
      } else {
        setError(error.response?.data?.msg || "Failed to analyze domain. Please try again.");
      }
    } finally {
      clearInterval(timer);
      clearInterval(progressInterval);
      setLoading(false);
      setLoadingTime(0);
    }
  };

  const handleClose = () => {
    setResult(null);
    setError(null);
    setCurrentStep("");
    setProgressSteps([]);
    setDomain("");
  };

  const downloadPDF = async () => {
    if (!result || !result.analysisId) {  // ← Change from brandId to analysisId
      toast.error("No analysis data available for PDF generation");
      return;
    }

    try {
      setDownloadingPdf(true);
      console.log('📄 Downloading Super User PDF for analysis:', result.analysisId);
      
      const token = localStorage.getItem('auth') || localStorage.getItem('token');
      
      // Use apiService to ensure correct base URL handling
      const pdfEndpoint = `/api/v1/super-user/analysis/${result.analysisId}/download-pdf`;
      console.log('📄 PDF Endpoint:', pdfEndpoint);
      console.log('📄 Analysis ID:', result.analysisId);
      console.log('📄 Using apiService base URL for PDF download');
      
      const response = await apiService.get(pdfEndpoint, {
        responseType: 'blob', // Important: Tell axios to expect a blob response
        headers: {
          'Accept': 'application/pdf',
        },
        timeout: 120000 // 2 minute timeout for PDF generation
      });

      console.log('📄 PDF Response status:', response.status);
      console.log('📄 PDF Response headers:', response.headers);

      // Check if response is successful
      if (response.status !== 200) {
        console.error('PDF download failed with status:', response.status);
        throw new Error(`PDF download failed: HTTP ${response.status}`);
      }

      // Verify response is actually PDF
      const contentType = response.headers['content-type'];
      if (!contentType || !contentType.includes('application/pdf')) {
        console.error('❌ Response is not a PDF, content-type:', contentType);
        throw new Error('Server response is not a PDF file');
      }

      // Get the PDF blob and download it
      const blob = response.data; // axios with responseType 'blob' puts data here
      console.log('📄 PDF blob size:', blob.size);
      
      if (blob.size === 0) {
        throw new Error('Received empty PDF file');
      }
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Get filename from Content-Disposition header or create default
      let filename = `SuperUser_${result.brand?.replace(/[^a-zA-Z0-9]/g, '_')}_Analysis_${result.analysisId}.pdf`;
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('✅ Super User PDF downloaded successfully:', filename);
      toast.success(`PDF report downloaded successfully! (${filename})`);
      
    } catch (error) {
      console.error('❌ Super User PDF download error:', error);
      
      // Additional debugging for 404 errors
      if (error.response?.status === 404) {
        console.error('❌ 404 Error Details:');
        console.error('   - Endpoint:', pdfEndpoint);
        console.error('   - Analysis ID:', result.analysisId);
        console.error('   - Full URL would be: [BASE_URL]' + pdfEndpoint);
        
        // Try to test if the analysis exists
        try {
          console.log('🔍 Testing if analysis exists...');
          const testResponse = await apiService.get(`/api/v1/super-user/analysis/${result.analysisId}`);
          console.log('✅ Analysis exists:', testResponse.status === 200);
        } catch (testError) {
          console.error('❌ Analysis does not exist:', testError.response?.status);
        }
      }
      
      toast.error(`Failed to download PDF report: ${error.message} (${error.response?.status || 'Network Error'})`);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Function to refresh SOV data after competitor addition or custom prompt addition
  const refreshSOVData = async () => {
    if (!result || !result.brandId) {
      console.log('❌ No brandId available for SOV refresh');
      return;
    }
    
    try {
      console.log('🔄 Super User - Refreshing SOV data for brandId:', result.brandId);
      
      // Add a small delay to ensure backend processing is complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Refetch the brand analysis to get updated SOV data
      const analysisResponse = await apiService.getBrandAnalysis(result.brandId);
      console.log('✅ Super User - SOV data refreshed:', {
        shareOfVoice: analysisResponse.data.shareOfVoice,
        mentionCounts: analysisResponse.data.mentionCounts,
        totalMentions: analysisResponse.data.totalMentions,
        competitors: analysisResponse.data.competitors?.length || 0
      });
      
      // Update the result with new SOV data and any updated fields
      setResult(prevResult => ({
        ...prevResult,
        shareOfVoice: analysisResponse.data.shareOfVoice,
        mentionCounts: analysisResponse.data.mentionCounts,
        totalMentions: analysisResponse.data.totalMentions,
        brandShare: analysisResponse.data.brandShare,
        aiVisibilityScore: analysisResponse.data.aiVisibilityScore,
        competitors: analysisResponse.data.competitors, // Update competitors list
        categories: analysisResponse.data.categories || prevResult.categories // Update categories if available
      }));
      
      console.log('✅ Super User - SOV table data updated successfully');
      toast.success('Data refreshed successfully!');
      
    } catch (error) {
      console.error('❌ Super User - Error refreshing SOV data:', error);
      console.error('❌ Error details:', {
        status: error.response?.status,
        message: error.response?.data?.msg || error.message
      });
      toast.error('Failed to refresh data. Please try again.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Super User Header */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
          <Crown className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-[#4a4a6a]">Super User Domain Analysis</h2>
          <p className="text-[#4a4a6a]">Analyze any domain and get comprehensive brand intelligence</p>
        </div>
      </div>

      {/* Domain Analysis Form */}
      {!result && (
        <Card className="border border-[#b0b0d8] bg-white">
          <CardHeader>
            <CardTitle className="text-[#4a4a6a] flex items-center space-x-2">
              <div className="w-6 h-6 bg-[#7c77ff] rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">🚀</span>
              </div>
              <span>Domain Analysis</span>
            </CardTitle>
            <CardDescription className="text-[#4a4a6a]">
              Enter any domain to get a complete brand analysis including Share of Voice, competitors, and market insights.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DomainForm
              domain={domain}
              setDomain={setDomain}
              loading={loading}
              onSubmit={handleAnalyze}
              onClose={handleClose}
              showDomainWarning={false}
              existingDomain={null}
            />
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center my-8">
          <LoadingSpinner size="large" message={currentStep || "Starting analysis..."} />
          
          {/* Progress Steps */}
          <div className="mt-6 w-full max-w-2xl">
            <div className="mb-4">
              <p className="text-sm text-muted-foreground text-center mb-2">
                This process can take 2-5 minutes for comprehensive analysis
              </p>
              {loadingTime > 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  Elapsed time: {formatTime(loadingTime)}
                </p>
              )}
            </div>
            
            <div className="space-y-3">
              {analysisSteps.map((step, index) => {
                const isCompleted = index < progressSteps.length;
                const isCurrent = index === progressSteps.length;
                const isPending = index > progressSteps.length;
                
                return (
                  <div key={step.id} className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 ${
                    isCompleted ? 'bg-green-50 border border-green-200' : 
                    isCurrent ? 'bg-blue-50 border border-blue-200' : 
                    'bg-gray-50 border border-gray-200'
                  }`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                      isCompleted ? 'bg-green-500 text-white' : 
                      isCurrent ? 'bg-blue-500 text-white animate-pulse' : 
                      'bg-gray-300 text-gray-600'
                    }`}>
                      {isCompleted ? '✓' : step.id}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        isCompleted ? 'text-green-700' : 
                        isCurrent ? 'text-blue-700' : 
                        'text-gray-500'
                      }`}>
                        {step.name}
                      </p>
                      <p className={`text-xs ${
                        isCompleted ? 'text-green-600' : 
                        isCurrent ? 'text-blue-600' : 
                        'text-gray-400'
                      }`}>
                        {step.description}
                      </p>
                    </div>
                    {isCurrent && (
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="border border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-red-600 text-4xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold text-red-800 mb-2">Analysis Failed</h3>
              <p className="text-red-700 mb-4">{error}</p>
              <Button onClick={handleClose} variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Display */}
      {result && !loading && (
        <div className="space-y-6">
          {/* Header with PDF Download and Reset Button */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-[#4a4a6a]">Analysis Results for {result.domain}</h3>
              <p className="text-sm text-[#4a4a6a]">Super User Analysis • Complete brand intelligence report</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={downloadPDF}
                disabled={downloadingPdf}
                className="bg-green-600 hover:bg-green-700 text-white border-0"
              >
                {downloadingPdf ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF Report
                  </>
                )}
              </Button>
              <Button
                onClick={handleClose}
                variant="outline"
                className="border-[#b0b0d8] text-[#4a4a6a] hover:bg-[#d5d6eb]"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                New Analysis
              </Button>
            </div>
          </div>

          {/* Brand Summary and SOV Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <BrandSummary result={result} />
            </div>
            <div>
              <ShareOfVoiceTable 
                shareOfVoice={result.shareOfVoice || {}}
                mentionCounts={result.mentionCounts || {}}
                totalMentions={result.totalMentions || 0}
                brandShare={result.brandShare || 0}
                aiVisibilityScore={result.aiVisibilityScore || 0}
                brandId={result.brandId}
                brandName={result.brand}
                calculationMethod="cumulative_all_sessions"
                onDataUpdate={refreshSOVData}
              />
            </div>
          </div>

          {/* Competitors Analysis */}
          {result.competitors && (
            <div className="mt-6">
              <CompetitorsAnalysis competitors={result.competitors} brandId={result.brandId} />
            </div>
          )}

          {/* Categories with Prompts */}
          {result.categories && Array.isArray(result.categories) && result.categories.length > 0 && (
            <div className="mt-6">
              <CategoriesWithPrompts 
                categories={result.categories} 
                brandId={result.brandId} 
                onSOVUpdate={refreshSOVData}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SuperUserDomainAnalysis;