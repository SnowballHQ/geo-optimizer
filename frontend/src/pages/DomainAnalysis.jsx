import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { apiService } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import DomainForm from "./DomainForm";
import BrandSummary from "./BrandSummary";
import ShareOfVoiceTable from "./ShareOfVoiceTable";

import CompetitorsAnalysis from "./CompetitorsAnalysis";
import CategoriesWithPrompts from "./CategoriesWithPrompts";
import SOVTrendChart from "../components/SOVTrendChart";
// Blog analysis moved to separate page
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { RefreshCw } from 'lucide-react';

const DomainAnalysis = ({ onClose, initialDomain = "" }) => {
  const [domain, setDomain] = useState(initialDomain);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showRawData, setShowRawData] = useState(false);
  const [error, setError] = useState(null);
  const [loadingTime, setLoadingTime] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [progressSteps, setProgressSteps] = useState([]);
  const [showConsole, setShowConsole] = useState(false);
  // Blog analysis moved to separate page
  const [hasStartedAnalysis, setHasStartedAnalysis] = useState(false);
  
  // New state for domain switching
  const [existingDomain, setExistingDomain] = useState(null);
  const [showDomainWarning, setShowDomainWarning] = useState(false);
  
  // State for regenerating analysis
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Check for existing analysis first, then auto-start if needed
  useEffect(() => {
    if (!hasStartedAnalysis) {
      setHasStartedAnalysis(true);
      if (initialDomain && initialDomain.trim()) {
        setDomain(initialDomain);
        // Always use the comprehensive data loading path that includes prompts/responses
        checkForExistingAnalysis();
      } else {
        // No initial domain - check if user has existing analysis to display
        checkForExistingAnalysis();
      }
    }
  }, [initialDomain, hasStartedAnalysis]);

  // Function to check for existing analysis before starting new one
  const checkExistingAnalysisOrStart = async (domainToCheck) => {
    try {
      console.log('Checking for existing analysis for domain:', domainToCheck);
      
      // First, get user's existing brands
      const brandsResponse = await apiService.getUserBrands();
      const userBrands = brandsResponse.data.brands || [];
      
      // Look for existing brand with this domain
      const existingBrand = userBrands.find(brand => 
        brand.domain === domainToCheck || 
        brand.domain.replace(/^https?:\/\//, '') === domainToCheck ||
        brand.domain === `https://${domainToCheck}` ||
        brand.domain === `http://${domainToCheck}`
      );
      
      if (existingBrand) {
        console.log('Found existing brand, loading analysis:', existingBrand);
        setLoading(true);
        setCurrentStep("Loading existing analysis...");
        
        try {
          const analysisResponse = await apiService.getBrandAnalysis(existingBrand.id);
          console.log('Existing analysis loaded:', analysisResponse.data);
          console.log('🔍 Categories data received:', {
            categories: analysisResponse.data.categories,
            categoriesLength: analysisResponse.data.categories?.length,
            categoriesType: typeof analysisResponse.data.categories,
            firstCategory: analysisResponse.data.categories?.[0] || null,
            firstCategoryStructure: analysisResponse.data.categories?.[0] ? {
              id: analysisResponse.data.categories[0]._id,
              name: analysisResponse.data.categories[0].categoryName,
              hasPrompts: !!analysisResponse.data.categories[0].prompts,
              promptsLength: analysisResponse.data.categories[0].prompts?.length || 0
            } : null
          });
          setResult(analysisResponse.data);
          setCurrentStep("Analysis loaded!");
          toast.success("Existing analysis loaded successfully!");
        } catch (analysisError) {
          console.log('Error loading existing analysis, starting new analysis:', analysisError);
          handleAnalyzeWithDomain(domainToCheck);
        } finally {
          setLoading(false);
        }
      } else {
        console.log('No existing brand found, starting new analysis...');
        handleAnalyzeWithDomain(domainToCheck);
      }
    } catch (error) {
      console.log('Error checking existing analysis, starting new analysis:', error);
      handleAnalyzeWithDomain(domainToCheck);
    }
  };

  // Function to check for existing analysis when no domain is provided
  const checkForExistingAnalysis = async () => {
    try {
      console.log('Loading pre-calculated domain analysis data...');
      
      setLoading(true);
      setCurrentStep("Loading domain analysis data...");
      
      try {
        // Use the domain analysis API to get all pre-calculated data
        const domainAnalysisResponse = await apiService.get('/api/v1/domain-analysis/data');
        console.log('🚀 Domain analysis data loaded:', domainAnalysisResponse.data);
        
        if (domainAnalysisResponse.data.success && domainAnalysisResponse.data.data) {
          const data = domainAnalysisResponse.data.data;
          
          // Transform the domain analysis data to match the expected format for the UI components
          const transformedResult = {
            brandId: data.brand._id,
            brand: data.brand.brandName,
            domain: data.brand.domain,
            description: data.brand.brandInformation,
            categories: data.categories || [], // Categories with prompts for display
            competitors: data.brand.competitors || [],
            
            // Share of Voice data transformation
            // The backend now returns a single SoV record with shareOfVoice and mentionCounts objects
            shareOfVoice: data.soVResults?.[0]?.shareOfVoice || {},
            mentionCounts: data.soVResults?.[0]?.mentionCounts || {},
            totalMentions: data.soVResults?.[0]?.totalMentions || 0,
            brandShare: data.soVResults?.[0]?.brandShare || 0,
            
            // Brand strength/AI visibility score
            aiVisibilityScore: data.brandStrength?.overallScore || 0,
            
            // Additional data for traceability
            prompts: data.prompts || [],
            responses: data.responses || [],
            calculationMethod: 'pre_calculated_from_onboarding'
          };
          
          console.log('🎯 Transformed result for UI:', {
            brandId: transformedResult.brandId,
            brand: transformedResult.brand,
            domain: transformedResult.domain,
            categoriesCount: transformedResult.categories.length,
            competitorsCount: transformedResult.competitors.length,
            soVEntries: Object.keys(transformedResult.shareOfVoice).length,
            totalMentions: transformedResult.totalMentions
          });
          
          setResult(transformedResult);
          setDomain(data.brand.domain);
          setCurrentStep("Domain analysis loaded!");
          toast.success("Pre-calculated domain analysis loaded successfully!");
          return;
        }
      } catch (domainAnalysisError) {
        console.log('❌ Error loading domain analysis data:', domainAnalysisError);
        
        // Fallback to the original method if domain analysis API fails
        console.log('Falling back to brand analysis method...');
        const brandsResponse = await apiService.getUserBrands();
        const userBrands = brandsResponse.data.brands || [];
        
        if (userBrands.length > 0) {
          const existingBrand = userBrands[0];
          console.log('Found existing brand, loading analysis:', existingBrand);
          
          setCurrentStep("Loading existing analysis...");
          
          try {
            const analysisResponse = await apiService.getBrandAnalysis(existingBrand.id);
            console.log('Existing analysis loaded:', analysisResponse.data);
            setResult(analysisResponse.data);
            setCurrentStep("Analysis loaded!");
            setDomain(existingBrand.domain);
            toast.success("Analysis data loaded successfully!");
          } catch (analysisError) {
            console.log('Error loading existing analysis:', analysisError);
            toast.error("Failed to load analysis data");
          }
        } else {
          toast.error("No brand data found. Please complete onboarding first.");
        }
      }
    } catch (error) {
      console.log('❌ Error in checkForExistingAnalysis:', error);
      toast.error("Failed to load domain analysis data");
    } finally {
      setLoading(false);
    }
  };

  // Check for domain switching when domain input changes
  useEffect(() => {
    const checkDomainSwitch = async () => {
      if (domain && domain.trim()) {
        try {
          const brandsResponse = await apiService.getUserBrands();
          const userBrands = brandsResponse.data.brands || [];
          
          if (userBrands.length > 0) {
            const currentBrand = userBrands[0]; // Get the user's current brand
            const isDifferentDomain = currentBrand.domain !== domain && 
                                    currentBrand.domain.replace(/^https?:\/\//, '') !== domain &&
                                    currentBrand.domain !== `https://${domain}` &&
                                    currentBrand.domain !== `http://${domain}`;
            
            if (isDifferentDomain) {
              setExistingDomain(currentBrand.domain);
              setShowDomainWarning(true);
            } else {
              setShowDomainWarning(false);
              setExistingDomain(null);
            }
          }
        } catch (error) {
          console.log('Error checking domain switch:', error);
        }
      } else {
        setShowDomainWarning(false);
        setExistingDomain(null);
      }
    };
    
    // Debounce the check to avoid too many API calls
    const timeoutId = setTimeout(checkDomainSwitch, 500);
    return () => clearTimeout(timeoutId);
  }, [domain]);

  // Debug logging using useEffect
  useEffect(() => {
    if (result) {
      console.log('DomainAnalysis result:', {
        categories: result.categories,
        categoriesLength: result.categories?.length,
        categoriesType: typeof result.categories,
        brandId: result.brandId
      });
    }
  }, [result]);

  const analysisSteps = [
    { id: 1, name: "Creating brand profile", description: "Setting up brand information and domain details" },
    { id: 2, name: "Extracting categories", description: "Analyzing domain to identify business categories" },
    { id: 3, name: "Generating prompts", description: "Creating AI prompts for comprehensive analysis" },
    { id: 4, name: "Running AI analysis", description: "Processing domain through AI models" },
    { id: 5, name: "Parsing insights", description: "Extracting competitor and market insights" },
    { id: 6, name: "Calculating metrics", description: "Computing brand strength and performance metrics" },
    { id: 7, name: "Extracting competitors", description: "Identifying direct competitors in the market" },
    { id: 8, name: "Calculating Share of Voice", description: "Analyzing market share and brand mentions" },
    { id: 9, name: "Generating description", description: "Creating brand summary and description" }
  ];

  const handleAnalyzeWithDomain = async (domainToAnalyze) => {
    if (!domainToAnalyze.trim()) {
      toast.error("Please enter a domain");
      return;
    }

    // Basic domain validation
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domainToAnalyze)) {
      toast.error("Please enter a valid domain (e.g., example.com)");
      return;
    }

    setLoading(true);
    setError(null);
    setLoadingTime(0);
    setCurrentStep("");
    setProgressSteps([]);
    setShowConsole(true);
    
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
      console.log('Starting domain analysis for:', domainToAnalyze);
      const response = await apiService.analyzeBrand({ 
        domain: domainToAnalyze,
        brandName: domainToAnalyze 
      });
      console.log('Domain analysis completed:', response.data);
      setResult(response.data);
      setCurrentStep("Analysis complete!");
      
      // Show appropriate success message based on domain status
      if (response.data.warning) {
        toast.warning(`Domain switched successfully! ${response.data.warning}`);
      } else if (response.data.domainStatus === 're-analyzed') {
        toast.success("Domain re-analyzed successfully!");
      } else {
        toast.success("Domain analysis completed successfully!");
      }
    } catch (error) {
      console.error('Domain analysis error:', error);
      
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

  const handleAnalyze = async (e) => {
    console.log('🎯 handleAnalyze called!', { e, domain });
    e.preventDefault();
    
    // First check if we have existing analysis for this domain
    try {
      console.log('Checking for existing analysis before starting new one...');
      
      // Get user's existing brands
      const brandsResponse = await apiService.getUserBrands();
      const userBrands = brandsResponse.data.brands || [];
      
      // Look for existing brand with this domain
      const existingBrand = userBrands.find(brand => 
        brand.domain === domain || 
        brand.domain.replace(/^https?:\/\//, '') === domain ||
        brand.domain === `https://${domain}` ||
        brand.domain === `http://${domain}`
      );
      
      if (existingBrand) {
        console.log('Found existing brand, offering to load existing data:', existingBrand);
        
        // Show confirmation dialog to user
        const shouldLoadExisting = window.confirm(
          `Domain "${domain}" has already been analyzed.\n\n` +
          `Would you like to:\n` +
          `• Load existing analysis (instant) - Click OK\n` +
          `• Run new analysis (2-5 minutes) - Click Cancel`
        );
        
        if (shouldLoadExisting) {
          // Load existing analysis
          setLoading(true);
          setCurrentStep("Loading existing analysis...");
          
          try {
            const analysisResponse = await apiService.getBrandAnalysis(existingBrand.id);
            console.log('Existing analysis loaded:', analysisResponse.data);
            setResult(analysisResponse.data);
            setCurrentStep("Analysis loaded!");
            toast.success("Existing analysis loaded successfully!");
          } catch (analysisError) {
            console.log('Error loading existing analysis, starting new analysis:', analysisError);
            toast.error("Failed to load existing analysis, starting new analysis...");
            await handleAnalyzeWithDomain(domain);
          } finally {
            setLoading(false);
          }
        } else {
          // User chose to run new analysis
          console.log('User chose to run new analysis for existing domain');
          await handleAnalyzeWithDomain(domain);
        }
      } else {
        // No existing brand found, start new analysis
        console.log('No existing brand found, starting new analysis...');
        await handleAnalyzeWithDomain(domain);
      }
    } catch (error) {
      console.log('Error checking existing analysis, starting new analysis:', error);
      await handleAnalyzeWithDomain(domain);
    }
  };

  const handleClose = () => {
    setResult(null);
    setError(null);
    setShowRawData(false);
    setCurrentStep("");
    setProgressSteps([]);
    setShowConsole(false);
    setHasStartedAnalysis(false);
    onClose();
  };

  // Function to fully reload all data after competitor addition or custom prompt addition
  const refreshSOVData = async () => {
    if (!result || !result.brandId) {
      console.log('❌ No brandId available for data reload');
      return;
    }

    try {
      console.log('🔄 Triggering full data reload...');

      // Add a small delay to ensure backend processing is complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Trigger full data reload by calling checkForExistingAnalysis
      await checkForExistingAnalysis();

      console.log('✅ Full data reload completed successfully');
      toast.success('Data refreshed successfully!');

    } catch (error) {
      console.error('❌ Error reloading data:', error);
      console.error('❌ Error details:', {
        status: error.response?.status,
        message: error.response?.data?.msg || error.message
      });
      toast.error('Failed to refresh data. Please try again.');
    }
  };

  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Function to regenerate analysis
  const handleRegenerateAnalysis = async () => {
    if (!result || !result.brandId) {
      toast.error("No brand analysis found to regenerate");
      return;
    }

    try {
      setIsRegenerating(true);
      setCurrentStep("Regenerating analysis...");
      
      console.log('🔄 Regenerating analysis for brand:', result.brandId);
      
      const response = await apiService.post(`/api/v1/regenerate/regenerate/${result.brandId}`);
      
      if (response.data.success) {
        console.log('✅ Analysis regenerated successfully:', response.data);
        
        // Update the current result with new data
        const updatedResult = {
          ...result,
          shareOfVoice: response.data.sovResults.shareOfVoice || {},
          mentionCounts: response.data.sovResults.mentionCounts || {},
          totalMentions: response.data.sovResults.totalMentions || 0,
          brandShare: response.data.sovResults.brandShare || 0,
          aiVisibilityScore: response.data.sovResults.aiVisibilityScore || 0,
          calculationMethod: response.data.sovResults.calculationMethod || 'regenerated',
          competitors: response.data.competitors || result.competitors
        };
        
        setResult(updatedResult);
        setCurrentStep("");
        toast.success("Analysis regenerated successfully! Fresh AI responses generated.");
      } else {
        throw new Error(response.data.msg || 'Failed to regenerate analysis');
      }
    } catch (error) {
      console.error('❌ Error regenerating analysis:', error);
      const errorMessage = error.response?.data?.msg || error.message || 'Failed to regenerate analysis';
      toast.error(errorMessage);
      setCurrentStep("");
    } finally {
      setIsRegenerating(false);
    }
  };

  // Blog analysis moved to separate page

  return (
    <div className="w-full h-auto">
      {/* Only show form if no result and not loading */}
      {!result && !loading && (
        <DomainForm
          domain={domain}
          setDomain={setDomain}
          loading={loading}
          onSubmit={handleAnalyze}
          onClose={handleClose}
          existingDomain={existingDomain}
          showDomainWarning={showDomainWarning}
        />
      )}

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

            {/* Progress Bar */}
            <div className="w-full bg-muted rounded-full h-2 mb-4">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-500"
                style={{ width: `${(progressSteps.length / analysisSteps.length) * 100}%` }}
              ></div>
            </div>

            {/* Current Step */}
            {currentStep && (
              <Card className="mb-4 border-primary/20 bg-primary/5">
                <CardContent className="p-3">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3 animate-pulse"></div>
                    <p className="text-sm font-medium text-primary">
                      Currently: {currentStep}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Completed Steps */}
            {progressSteps.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-foreground mb-2">Completed Steps:</p>
                {progressSteps.map((step, index) => (
                  <div key={step.id} className="flex items-center text-xs">
                    <div className="w-4 h-4 bg-green-500 rounded-full mr-3 flex items-center justify-center">
                      <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-muted-foreground">{step.name}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Upcoming Steps */}
            {progressSteps.length < analysisSteps.length && (
              <div className="mt-4">
                <p className="text-xs font-medium text-foreground mb-2">Upcoming Steps:</p>
                <div className="space-y-1">
                  {analysisSteps.slice(progressSteps.length, progressSteps.length + 3).map((step) => (
                    <div key={step.id} className="flex items-center text-xs">
                      <div className="w-4 h-4 bg-muted rounded-full mr-3"></div>
                      <span className="text-muted-foreground">{step.name}</span>
                    </div>
                  ))}
                  {analysisSteps.length - progressSteps.length > 3 && (
                    <div className="text-xs text-muted-foreground ml-7">
                      +{analysisSteps.length - progressSteps.length - 3} more steps
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Backend Console Toggle */}
            <div className="mt-4 text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowConsole(!showConsole)}
                className="text-xs text-primary hover:text-primary/80"
              >
                {showConsole ? "Hide" : "Show"} Backend Console
              </Button>
            </div>

            {/* Backend Console Display */}
            {showConsole && (
              <Card className="mt-4 bg-muted/50 border-0">
                <CardContent className="p-4 max-h-48 overflow-y-auto">
                  <div className="text-xs text-green-600 font-mono">
                    <div className="mb-2">=== 🚀 Starting Brand Analysis ===</div>
                    <div className="mb-1">📋 Request body: {JSON.stringify({ domain, brandName: domain })}</div>
                    <div className="mb-1">📝 Step 1: Creating brand profile...</div>
                    <div className="mb-1 text-green-500">✅ Brand profile created: {domain}</div>
                    <div className="mb-1">🏷️ Step 2: Extracting categories...</div>
                    <div className="mb-1 text-green-500">✅ Categories extracted and saved</div>
                    <div className="mb-1">🤖 Step 3: Generating prompts...</div>
                    <div className="mb-1 text-green-500">✅ Prompts generated</div>
                    <div className="mb-1">🧠 Step 4: Running AI analysis...</div>
                    <div className="mb-1 text-green-500">✅ AI responses received</div>
                    <div className="mb-1">🔍 Step 5: Parsing insights...</div>
                    <div className="mb-1 text-green-500">✅ Insights and competitors parsed</div>
                    <div className="mb-1">📊 Step 6: Calculating metrics...</div>
                    <div className="mb-1 text-green-500">✅ Metrics calculated</div>
                    <div className="mb-1">🏢 Step 7: Extracting competitors...</div>
                    <div className="mb-1 text-green-500">✅ Competitors extracted</div>
                    <div className="mb-1">📈 Step 8: Calculating Share of Voice...</div>
                    <div className="mb-1 text-green-500">✅ Share of Voice calculated</div>
                    <div className="mb-1">📝 Step 9: Generating description...</div>
                    <div className="mb-1 text-green-500">✅ Brand description generated</div>
                    <div className="text-yellow-600">=== 🎉 Brand Analysis Complete ===</div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {error && (
        <Card className="mt-6 border-destructive/20 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-destructive" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-destructive">Analysis Failed</h3>
                <div className="mt-2 text-sm text-destructive/80">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {result && (
        <div className="mt-2 space-y-3">
          {/* Header */}
          

          {/* Main Analysis Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Brand Summary */}
            <div className="h-full">
              <BrandSummary
                brandData={{
                  name: result.brand,
                  domain: result.domain,
                  description: result.description,
                  categories: result.categories
                }}
              />
            </div>
            
            {/* Share of Voice */}
            <div className="h-full">
              <ShareOfVoiceTable 
                shareOfVoice={result.shareOfVoice}
                mentionCounts={result.mentionCounts}
                totalMentions={result.totalMentions}
                brandShare={result.brandShare}
                aiVisibilityScore={result.aiVisibilityScore}
                brandId={result.brandId}
                brandName={result.brand}
                calculationMethod={result.calculationMethod}
                onDataUpdate={refreshSOVData}
              />
            </div>
          </div>

          {/* SOV Trends Chart - Full Width */}
          <div className="mt-6">
            <SOVTrendChart brandId={result.brandId} />
          </div>

          {/* Competitors Analysis - Full Width */}
          {result.competitors && (
            <div className="mt-6">
                              <CompetitorsAnalysis competitors={result.competitors} brandId={result.brandId} />
            </div>
          )}

          {/* Categories with Prompts - Full Width */}
          {result.categories && Array.isArray(result.categories) && result.categories.length > 0 && (
            <div className="mt-6">
              {console.log('🎯 Rendering CategoriesWithPrompts with:', {
                categories: result.categories,
                brandId: result.brandId,
                categoriesLength: result.categories.length,
                firstCategory: result.categories[0]
              })}
              <CategoriesWithPrompts
                categories={result.categories}
                brandId={result.brandId}
                onSOVUpdate={refreshSOVData}
                onDataUpdate={refreshSOVData}
              />
              
              {/* Blog analysis moved to separate page */}
            </div>
          )}

          {/* Raw Data Toggle */}
          <div className="text-center mt-6">
            <Button
              variant="outline"
              onClick={() => setShowRawData(!showRawData)}
              className="inline-flex items-center"
            >
              {showRawData ? (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                  Hide Raw Data
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  Show Raw Data
                </>
              )}
            </Button>
          </div>

          {/* Raw Data Display */}
          {showRawData && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Raw API Response</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <pre className="text-sm text-foreground whitespace-pre-wrap">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default DomainAnalysis;