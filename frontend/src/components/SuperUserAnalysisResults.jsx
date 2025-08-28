import React, { useState, useEffect } from 'react';
import { apiService } from '../utils/api';
import LoadingSpinner from './LoadingSpinner';
import ShareOfVoiceTable from '../pages/ShareOfVoiceTable';
import CompetitorsAnalysis from '../pages/CompetitorsAnalysis';
import CategoriesWithPrompts from '../pages/CategoriesWithPrompts';
import BrandSummary from '../pages/BrandSummary';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ArrowLeft, Download, RefreshCw } from 'lucide-react';

const SuperUserAnalysisResults = ({ 
  analysisData, 
  onBack, 
  onStartNewAnalysis,
  downloadingPdf,
  onDownloadPDF 
}) => {
  const [detailedResults, setDetailedResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDetailedAnalysisData();
  }, [analysisData]);

  const loadDetailedAnalysisData = async () => {
    if (!analysisData) {
      setError('No analysis data available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 Super User analysis data received:', analysisData);
      console.log('🔍 Step data available:', {
        step1Data: analysisData.step1Data,
        step2Data: analysisData.step2Data,
        step3Data: analysisData.step3Data,
        step4Data: analysisData.step4Data
      });
      
      // Use the data directly from the Super User analysis - no additional API calls needed
      const shareOfVoiceData = analysisData.analysisResults?.shareOfVoice || {};
      const mentionCounts = analysisData.analysisResults?.mentionCounts || {};
      
      console.log('🔍 Raw SOV data from backend:', analysisData.analysisResults);
      console.log('🔍 Share of Voice data:', shareOfVoiceData);
      console.log('🔍 Share of Voice data type:', typeof shareOfVoiceData);
      console.log('🔍 Share of Voice data entries:', Object.entries(shareOfVoiceData));
      console.log('🔍 Mention counts:', mentionCounts);
      
      // Convert shareOfVoice data to the format expected by ShareOfVoiceTable  
      // Use the original total mentions (136) - this represents ALL brand mentions extracted from AI responses
      // The individual brand counts (3,3,6,0,0,0) represent mentions for the specific brands being analyzed
      const totalMentionsExtracted = analysisData.analysisResults?.totalMentions || 0;
      const analyzedBrandTotal = Object.values(mentionCounts).reduce((sum, count) => sum + (count || 0), 0);
      
      console.log('🔍 SOV Data Analysis:', {
        totalMentionsExtracted, // All brand mentions found (136)
        analyzedBrandTotal,     // Sum of our specific brands (12)  
        mentionCounts,          // Individual brand counts
        shareOfVoiceData        // Backend calculated percentages
      });
      
      const formattedSovData = Object.entries(shareOfVoiceData).map(([brandName, share]) => {
        const brandMentions = mentionCounts[brandName] || 0;
        
        console.log(`🔍 Processing brand: ${brandName}`, {
          backendShare: share,
          brandMentions: brandMentions,
          totalMentions: totalMentionsExtracted
        });
        
        // Calculate share based on mentions if we have the data
        let finalShare = 0;
        
        if (typeof share === 'number' && share >= 0) {
          // Use backend calculated share (already in percentage)
          finalShare = share;
          console.log(`✅ Using backend calculated share for ${brandName}: ${finalShare}%`);
        } else if (brandMentions > 0 && totalMentionsExtracted > 0) {
          // Calculate share from mentions
          finalShare = (brandMentions / totalMentionsExtracted) * 100;
          console.log(`📊 Calculated share for ${brandName}: ${finalShare}%`);
        }
        
        console.log(`🎯 Final share for ${brandName}: ${finalShare}%`);
        
        return {
          brand: brandName,
          mentions: brandMentions,
          share: Math.round(finalShare * 100) / 100 // Round to 2 decimal places
        };
      }).sort((a, b) => b.share - a.share);
      
      console.log('🎯 Final formatted SOV data:', formattedSovData);
      
      // Use the actual data structure from the backend instead of creating temporary ones
      console.log('🔍 Using actual backend data structure');
      
      // Get categories from step data first, then from analysis results
      const actualCategories = analysisData.step2Data?.categories || analysisData.analysisResults?.categories || [];
      const actualPrompts = analysisData.step4Data?.prompts || analysisData.analysisResults?.prompts || [];
      
      console.log('🔍 Step2Data categories:', analysisData.step2Data?.categories);
      console.log('🔍 Step4Data prompts:', analysisData.step4Data?.prompts);
      console.log('🔍 AnalysisResults categories:', analysisData.analysisResults?.categories);
      console.log('🔍 AnalysisResults prompts:', analysisData.analysisResults?.prompts);
      
      console.log('🔍 Actual categories from backend:', actualCategories);
      console.log('🔍 Actual prompts from backend:', actualPrompts);
      
      // Helper function to generate proper ObjectId-like strings
      const generateObjectId = () => {
        return Math.random().toString(16).substr(2, 24).padEnd(24, '0');
      };
      
      // Create proper category structure using backend data
      const basicCategories = actualCategories.map((category, index) => {
        // If category is a string, convert to object format
        const categoryObj = typeof category === 'string' ? { 
          _id: generateObjectId(),
          categoryName: category,
          name: category
        } : category;
        
        // For Super User analysis, distribute prompts evenly across categories
        // since we don't have category-specific prompt mapping
        const totalPrompts = actualPrompts.length || 0;
        const totalCategories = actualCategories.length || 1;
        const promptsPerCategory = Math.ceil(totalPrompts / totalCategories);
        const startIndex = index * promptsPerCategory;
        const categoryPrompts = actualPrompts.slice(startIndex, startIndex + promptsPerCategory);
        
        console.log(`🔍 Category ${categoryObj.categoryName || categoryObj.name}: ${categoryPrompts.length} prompts (${startIndex}-${startIndex + promptsPerCategory})`);
        
        return {
          ...categoryObj,
          prompts: categoryPrompts.map((prompt, promptIndex) => {
            // If prompt is a string, create proper object
            if (typeof prompt === 'string') {
              return {
                _id: generateObjectId(),
                promptText: prompt,
                categoryId: categoryObj._id || categoryObj.categoryName,
                responses: []
              };
            }
            return {
              ...prompt,
              responses: prompt.responses || []
            };
          })
        };
      });
      
      const basicResults = {
        brand: {
          _id: analysisData.analysisResults?.brandId,
          brandName: analysisData.brandName,
          domain: analysisData.domain,
          brandInformation: analysisData.brandInformation || analysisData.step1Data?.description || analysisData.step1Data?.brandInformation
        },
        shareOfVoice: {
          data: formattedSovData,
          mentionCounts: mentionCounts,
          totalMentions: totalMentionsExtracted, // Use the actual total mentions extracted (136)
          brandShare: formattedSovData.find(item => item.brand === analysisData.brandName)?.share || 0,
          aiVisibilityScore: formattedSovData.find(item => item.brand === analysisData.brandName)?.share || 0
        },
        categories: basicCategories,
        competitors: analysisData.step3Data?.competitors || analysisData.analysisResults?.competitors || [],
        prompts: actualPrompts,
        responses: []
      };
      
      console.log('🔍 Basic results created:', basicResults);
      setDetailedResults(basicResults);
      
      // Try to fetch AI responses using the Super User specific endpoint
      if (analysisData.analysisId) {
        try {
          console.log('🔍 Attempting to fetch AI responses for analysisId:', analysisData.analysisId);
          const responsesResponse = await apiService.get(`/api/v1/super-user/analysis/${analysisData.analysisId}/responses`);
          
          if (responsesResponse.data.responses && responsesResponse.data.responses.length > 0) {
            console.log('✅ Found AI responses:', responsesResponse.data.responses.length);
            
            // Update the categories with actual AI responses
            const updatedCategories = basicCategories.map(category => ({
              ...category,
              prompts: category.prompts.map(prompt => {
                // Find responses for this prompt by matching prompt text
                const promptResponses = responsesResponse.data.responses.filter(resp => {
                  const respPromptText = resp.promptText || resp.prompt || '';
                  const promptText = prompt.promptText || '';
                  
                  console.log(`🔍 Matching attempt:`, {
                    promptText: promptText.substring(0, 60),
                    respPromptText: respPromptText.substring(0, 60)
                  });
                  
                  // Try multiple matching strategies
                  const exactMatch = respPromptText === promptText;
                  const containsMatch = respPromptText.toLowerCase().includes(promptText.toLowerCase()) || 
                                       promptText.toLowerCase().includes(respPromptText.toLowerCase());
                  const similarMatch = promptText && respPromptText && 
                                     promptText.toLowerCase().trim() === respPromptText.toLowerCase().trim();
                  
                  const isMatch = exactMatch || containsMatch || similarMatch;
                  
                  if (isMatch) {
                    console.log(`✅ Match found! Strategy: ${exactMatch ? 'exact' : containsMatch ? 'contains' : 'similar'}`);
                  }
                  
                  return isMatch;
                });
                
                // Get the first matching response as the main AI response
                const aiResponse = promptResponses.length > 0 ? {
                  _id: promptResponses[0]._id,
                  responseText: promptResponses[0].responseText,
                  createdAt: promptResponses[0].createdAt
                } : null;
                
                console.log(`🔍 Prompt "${prompt.promptText?.substring(0, 50)}..." matched with ${promptResponses.length} responses`);
                if (aiResponse) {
                  console.log(`✅ AI response found for prompt: ${aiResponse.responseText?.substring(0, 100)}...`);
                }
                
                return {
                  ...prompt,
                  aiResponse: aiResponse,
                  responses: promptResponses // Keep both formats for compatibility
                };
              })
            }));
            
            // Count how many prompts now have AI responses
            const promptsWithResponses = updatedCategories.reduce((count, category) => 
              count + category.prompts.filter(p => p.aiResponse).length, 0);
            
            console.log(`🎯 Response matching complete: ${promptsWithResponses} prompts now have AI responses`);
            
            setDetailedResults(prev => ({
              ...prev,
              categories: updatedCategories,
              responses: responsesResponse.data.responses
            }));
          } else {
            console.log('⚠️ No AI responses found in API response');
          }
        } catch (error) {
          console.warn('Could not fetch AI responses, showing prompts only:', error);
          console.log('🔍 Error details:', error.message);
        }
      }
      
    } catch (error) {
      console.error('Error preparing analysis results:', error);
      setError('Failed to load analysis details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
          <span className="ml-3 text-gray-600">Loading detailed analysis results...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="flex gap-4">
              <Button onClick={onBack} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
              <Button onClick={loadDetailedAnalysisData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const brandData = detailedResults?.brand;
  const sovData = detailedResults?.shareOfVoice;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header with Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={onBack} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to History
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Analysis Results: {analysisData.domain}
            </h1>
            <p className="text-sm text-gray-500">
              Analysis ID: {analysisData.analysisId} • {new Date(analysisData.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button
            onClick={onDownloadPDF}
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
            onClick={onStartNewAnalysis}
            className="bg-primary-500 hover:bg-primary-600 text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            New Analysis
          </Button>
        </div>
      </div>

      {/* Analysis Results */}
      {brandData && (
        <>
          {/* Analysis Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">AI Visibility Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(sovData?.aiVisibilityScore || 0)}%
                </div>
                <p className="text-xs text-gray-500 mt-1">Market presence in AI responses</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Brand Share</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(sovData?.brandShare || 0)}%
                </div>
                <p className="text-xs text-gray-500 mt-1">Share of voice in market</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Mentions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {sovData?.totalMentions || 0}
                </div>
                <p className="text-xs text-gray-500 mt-1">Brand mentions extracted</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Competitors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {detailedResults.competitors?.length || 0}
                </div>
                <p className="text-xs text-gray-500 mt-1">Competitors analyzed</p>
              </CardContent>
            </Card>
          </div>

          {/* Brand Summary */}
          <BrandSummary 
            brand={brandData}
            shareOfVoice={sovData}
            mentionCounts={sovData?.mentionCounts}
            totalMentions={sovData?.totalMentions}
            brandShare={sovData?.brandShare}
            aiVisibilityScore={sovData?.aiVisibilityScore}
            competitors={detailedResults.competitors}
            showTitle={false}
          />

          {/* Share of Voice Table */}
          <ShareOfVoiceTable 
            domain={analysisData.domain}
            shareOfVoice={sovData?.data || []}
            mentionCounts={sovData?.mentionCounts}
            totalMentions={sovData?.totalMentions}
            brandShare={sovData?.brandShare}
            aiVisibilityScore={sovData?.aiVisibilityScore}
            isSuperUser={true}
            analysisId={analysisData.analysisId}
          />

          {/* Competitors Analysis */}
          <CompetitorsAnalysis 
            domain={analysisData.domain}
            competitors={analysisData.analysisResults?.competitors || []}
            shareOfVoice={sovData}
          />

          {/* Categories with Prompts and Responses */}
          <CategoriesWithPrompts 
            domain={analysisData.domain}
            brandId={analysisData.analysisResults.brandId}
            categories={detailedResults.categories}
            prompts={detailedResults.prompts}
          />

          {/* Analysis Steps Completed */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Analysis Steps Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-xs">✓</span>
                    </div>
                    <span className="text-sm font-medium">Domain Analysis & Brand Setup</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-xs">✓</span>
                    </div>
                    <span className="text-sm font-medium">Categories Extraction</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-xs">✓</span>
                    </div>
                    <span className="text-sm font-medium">Competitor Analysis</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-xs">✓</span>
                    </div>
                    <span className="text-sm font-medium">AI Prompt Generation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-xs">✓</span>
                    </div>
                    <span className="text-sm font-medium">AI Response Analysis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-xs">✓</span>
                    </div>
                    <span className="text-sm font-medium">Mentions & SOV Calculation</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Fallback if no detailed data */}
      {!brandData && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(analysisData.analysisResults?.aiVisibilityScore || 0)}%
                </div>
                <div className="text-sm text-blue-700">AI Visibility Score</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(analysisData.analysisResults?.brandShare || 0)}%
                </div>
                <div className="text-sm text-green-700">Brand Share</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {analysisData.analysisResults?.totalMentions || 0}
                </div>
                <div className="text-sm text-purple-700">Total Mentions</div>
              </div>
            </div>
            
            <div className="mt-4">
              <h3 className="font-medium text-gray-900 mb-2">Competitors Analyzed</h3>
              <div className="flex flex-wrap gap-2">
                {(analysisData.analysisResults?.competitors || []).map((competitor, index) => (
                  <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                    {competitor}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SuperUserAnalysisResults;