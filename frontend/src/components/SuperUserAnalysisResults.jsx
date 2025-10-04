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
      
      // ✅ FIX: Enhanced SOV data processing with validation
      const totalMentionsExtracted = analysisData.analysisResults?.totalMentions || 0;
      const analyzedBrandTotal = Object.values(mentionCounts).reduce((sum, count) => sum + (count || 0), 0);
      
      console.log('🔍 Enhanced SOV Data Analysis:', {
        totalMentionsExtracted, 
        analyzedBrandTotal,
        mentionCounts,
        shareOfVoiceData,
        hasValidSOV: Object.keys(shareOfVoiceData).length > 0,
        hasValidMentions: Object.keys(mentionCounts).length > 0,
        brandShare: analysisData.analysisResults?.brandShare,
        aiVisibilityScore: analysisData.analysisResults?.aiVisibilityScore
      });
      
      // ✅ FIX: Better handling for empty SOV data
      if (Object.keys(shareOfVoiceData).length === 0 && Object.keys(mentionCounts).length === 0) {
        console.log('⚠️ WARNING: Both shareOfVoice and mentionCounts are empty');
        
        // Try to extract brands from competitors list as fallback
        const competitors = analysisData.step3Data?.competitors || analysisData.analysisResults?.competitors || [];
        const brandName = analysisData.brandName;
        const allBrands = [brandName, ...competitors].filter(Boolean);
        
        console.log('🔄 Creating fallback SOV data for brands:', allBrands);
        
        // Create minimal SOV structure for display
        allBrands.forEach(brand => {
          shareOfVoiceData[brand] = 0;
          mentionCounts[brand] = 0;
        });
        
        console.log('✅ Fallback SOV data created:', { shareOfVoiceData, mentionCounts });
      }
      
      // ✅ CRITICAL DEBUG: Log the exact SOV data structure we're working with
      console.log('🔍 DETAILED SOV DEBUG BEFORE PROCESSING:', {
        shareOfVoiceData,
        shareOfVoiceDataType: typeof shareOfVoiceData,
        shareOfVoiceDataKeys: Object.keys(shareOfVoiceData),
        shareOfVoiceDataEntries: Object.entries(shareOfVoiceData),
        mentionCounts,
        mentionCountsType: typeof mentionCounts,
        mentionCountsKeys: Object.keys(mentionCounts),
        totalMentionsExtracted
      });
      
      // ✅ CRITICAL DEBUG: Test if shareOfVoiceData has the expected values
      console.log('🔍 CRITICAL: Testing direct access to SOV values:');
      Object.keys(shareOfVoiceData).forEach(brandName => {
        const directValue = shareOfVoiceData[brandName];
        console.log(`   ${brandName}: ${directValue} (type: ${typeof directValue})`);
      });
      
      const formattedSovData = Object.entries(shareOfVoiceData).map(([brandName, share]) => {
        const brandMentions = mentionCounts[brandName] || 0;
        
        console.log(`🔍 PROCESSING BRAND: ${brandName}`, {
          originalShare: share,
          shareType: typeof share,
          shareValue: share,
          brandMentions: brandMentions,
          totalMentions: totalMentionsExtracted,
          rawShareOfVoiceEntry: [brandName, share]
        });
        
        // ✅ CRITICAL FIX: Simplified and more reliable share calculation
        let finalShare = 0;
        
        // Try direct numeric conversion first - this handles most cases
        const numericShare = Number(share);
        if (!isNaN(numericShare) && numericShare >= 0) {
          finalShare = numericShare;
          console.log(`✅ SUCCESS: Direct numeric conversion for ${brandName}: ${finalShare}%`);
        } 
        // Handle percentage strings
        else if (typeof share === 'string' && share.includes('%')) {
          const numericValue = parseFloat(share.replace('%', ''));
          if (!isNaN(numericValue) && numericValue >= 0) {
            finalShare = numericValue;
            console.log(`✅ SUCCESS: Parsed percentage string for ${brandName}: ${finalShare}%`);
          }
        }
        // Fallback to mention-based calculation
        else if (brandMentions > 0 && totalMentionsExtracted > 0) {
          finalShare = (brandMentions / totalMentionsExtracted) * 100;
          console.log(`✅ SUCCESS: Calculated from mentions for ${brandName}: ${finalShare}%`);
        }
        // Final fallback - log for debugging
        else {
          console.log(`⚠️ ZERO RESULT for ${brandName}:`, {
            shareValue: share,
            shareType: typeof share,
            numericShare: numericShare,
            isNaN: isNaN(numericShare),
            brandMentions: brandMentions,
            totalMentions: totalMentionsExtracted
          });
        }
        
        // Ensure we have a valid number
        finalShare = Math.max(0, finalShare || 0);
        
        console.log(`🎯 FINAL RESULT for ${brandName}: ${finalShare}%`);
        
        return {
          brand: brandName,
          mentions: brandMentions,
          share: Math.round(finalShare * 100) / 100 // Round to 2 decimal places
        };
      }).sort((a, b) => b.share - a.share);
      
      // ✅ FIX: Validate formatted SOV data
      console.log('🎯 Final formatted SOV data:', formattedSovData);
      if (formattedSovData.length === 0) {
        console.log('⚠️ WARNING: No formatted SOV data created, this will cause display issues');
      } else {
        const totalShares = formattedSovData.reduce((sum, item) => sum + item.share, 0);
        console.log(`📊 Total SOV shares add up to: ${totalShares}%`);
      }
      
      console.log('🎯 Final formatted SOV data:', formattedSovData);
      
      // Use the actual data structure from the backend instead of creating temporary ones
      console.log('🔍 Using actual backend data structure');
      
      // ✅ FIX: Use populated categories first (these come with prompts and responses already attached)
      // Backend sends populatedCategories at root level, not in analysisResults
      const populatedCategories = analysisData.populatedCategories || analysisData.analysisResults?.populatedCategories;
      console.log('🔍 DEBUG: Populated categories from backend:', populatedCategories);
      console.log('🔍 DEBUG: Populated categories length:', populatedCategories?.length);
      console.log('🔍 DEBUG: First populated category:', populatedCategories?.[0]);
      
      // ✅ FIX: Use populated categories directly if available, otherwise fall back to step data
      let actualCategories, actualPrompts;
      
      if (populatedCategories && populatedCategories.length > 0) {
        console.log('✅ Using populatedCategories from backend');
        actualCategories = populatedCategories;
        actualPrompts = []; // Prompts are already included in populated categories
      } else {
        console.log('⚠️ Falling back to step data');
        actualCategories = analysisData.step2Data?.categories || analysisData.analysisResults?.categories || [];
        actualPrompts = analysisData.step4Data?.prompts || analysisData.analysisResults?.prompts || [];
      }
      
      console.log('🔍 Step2Data categories:', analysisData.step2Data?.categories);
      console.log('🔍 Step4Data prompts:', analysisData.step4Data?.prompts);
      console.log('🔍 AnalysisResults categories:', analysisData.analysisResults?.categories);
      console.log('🔍 AnalysisResults prompts:', analysisData.analysisResults?.prompts);
      
      console.log('🔍 Final actualCategories:', actualCategories);
      console.log('🔍 Final actualPrompts:', actualPrompts);
      
      // DEBUG: Log first few prompts in detail
      if (actualPrompts.length > 0) {
        console.log('🔍 DEBUG: First 3 prompts detail:', actualPrompts.slice(0, 3));
        actualPrompts.slice(0, 3).forEach((prompt, index) => {
          console.log(`🔍 DEBUG: Prompt ${index}:`, {
            type: typeof prompt,
            keys: Object.keys(prompt || {}),
            fullObject: prompt
          });
        });
      }
      
      // Helper function to generate proper ObjectId-like strings
      const generateObjectId = () => {
        return Math.random().toString(16).substr(2, 24).padEnd(24, '0');
      };
      
      // Create proper category structure using backend data
      let basicCategories;
      
      if (populatedCategories && populatedCategories.length > 0) {
        // ✅ FIX: Use populated categories directly - these already have prompts with proper structure
        console.log('✅ Using populated categories with prompts from backend');
        console.log(`🔍 Processing ${populatedCategories.length} populated categories`);
        
        basicCategories = populatedCategories.map((category, index) => {
          console.log(`🔍 DEBUG: Processing populated category ${index}: ${category.categoryName}`);
          console.log(`🔍 DEBUG: Category has ${category.prompts?.length || 0} prompts`);
          
          // Log first prompt details for debugging
          if (category.prompts && category.prompts.length > 0) {
            const firstPrompt = category.prompts[0];
            console.log(`🔍 DEBUG: First prompt in category:`, {
              _id: firstPrompt._id,
              promptText: firstPrompt.promptText,
              text: firstPrompt.text,
              question: firstPrompt.question,
              hasAiResponse: !!firstPrompt.aiResponse,
              aiResponseLength: firstPrompt.aiResponse?.responseText?.length
            });
          }
          
          return {
            ...category,
            prompts: (category.prompts || []).map(prompt => {
              const enhancedPrompt = {
                ...prompt,
                // ✅ FIX: Ensure we always have proper prompt text from various possible fields
                promptText: prompt.promptText || prompt.text || prompt.question || prompt.prompt || prompt.content || `Prompt ${prompt._id}`,
                text: prompt.text || prompt.promptText,
                question: prompt.question || prompt.promptText,
                responses: prompt.responses || []
              };
              
              console.log(`✅ Enhanced prompt: ${enhancedPrompt._id} -> ${enhancedPrompt.promptText.substring(0, 50)}...`);
              return enhancedPrompt;
            })
          };
        });
      } else {
        // Fallback: Create categories from step data
        console.log('📋 Creating categories from step data');
        basicCategories = actualCategories.map((category, index) => {
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
                  text: prompt, // Add text field for compatibility
                  categoryId: categoryObj._id || categoryObj.categoryName,
                  responses: []
                };
              }
              return {
                ...prompt,
                // Ensure we always have proper prompt text from various possible fields
                promptText: prompt.promptText || prompt.text || prompt.question || prompt.prompt || prompt.content || `Prompt ${prompt._id}`,
                responses: prompt.responses || []
              };
            })
          };
        });
      }
      
      console.log('🔍 DEBUG: Final basicCategories:', basicCategories);
      if (basicCategories.length > 0) {
        console.log('🔍 DEBUG: First category prompts:', basicCategories[0].prompts?.slice(0, 3));
      }
      
      // ✅ CRITICAL DEBUG: Log final data being passed to ShareOfVoiceTable
      const brandShareItem = formattedSovData.find(item => item.brand === analysisData.brandName);
      console.log('🔍 CRITICAL: Looking for brand in formattedSovData:', {
        searchingFor: analysisData.brandName,
        formattedSovDataBrands: formattedSovData.map(item => item.brand),
        foundItem: brandShareItem,
        foundShare: brandShareItem?.share
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
          totalMentions: totalMentionsExtracted,
          brandShare: formattedSovData.find(item => item.brand === analysisData.brandName)?.share || 0,
          aiVisibilityScore: formattedSovData.find(item => item.brand === analysisData.brandName)?.share || 0
        },
        categories: basicCategories,
        competitors: analysisData.step3Data?.competitors || analysisData.analysisResults?.competitors || [],
        prompts: actualPrompts,
        responses: []
      };
      
      // ✅ CRITICAL DEBUG: Log the complete basicResults object being passed to components
      // ✅ CRITICAL DEBUG: Log the RAW backend data being passed to ShareOfVoiceTable
      console.log('📤 CRITICAL: RAW analysisResults data for ShareOfVoiceTable:', {
        shareOfVoiceRaw: analysisData.analysisResults?.shareOfVoice,
        mentionCountsRaw: analysisData.analysisResults?.mentionCounts,
        totalMentionsRaw: analysisData.analysisResults?.totalMentions,
        brandShareRaw: analysisData.analysisResults?.brandShare,
        aiVisibilityScoreRaw: analysisData.analysisResults?.aiVisibilityScore
      });
      
      console.log('📤 CRITICAL: Complete basicResults object being passed to ShareOfVoiceTable:', {
        shareOfVoiceData: basicResults.shareOfVoice.data,
        shareOfVoiceDataLength: basicResults.shareOfVoice.data?.length,
        shareOfVoiceFirstItem: basicResults.shareOfVoice.data?.[0],
        brandShare: basicResults.shareOfVoice.brandShare,
        aiVisibilityScore: basicResults.shareOfVoice.aiVisibilityScore,
        totalMentions: basicResults.shareOfVoice.totalMentions,
        mentionCounts: basicResults.shareOfVoice.mentionCounts
      });
      
      // ✅ CRITICAL: Log backend populated categories for debugging
      console.log('🔍 BACKEND POPULATED CATEGORIES:', analysisData.populatedCategories);
      if (analysisData.populatedCategories && analysisData.populatedCategories.length > 0) {
        console.log('✅ USING BACKEND POPULATED CATEGORIES with aiResponse data');
        console.log('🔍 First populated category:', analysisData.populatedCategories[0]);
        if (analysisData.populatedCategories[0]?.prompts?.[0]) {
          console.log('🔍 First prompt in populated category:', analysisData.populatedCategories[0].prompts[0]);
          console.log('🔍 First prompt has aiResponse:', !!analysisData.populatedCategories[0].prompts[0].aiResponse);
        }
      } else {
        console.log('⚠️ No populatedCategories from backend, using basicResults');
      }
      
      console.log('🔍 Basic results created:', basicResults);
      setDetailedResults(basicResults);
      
      // Try to fetch AI responses using the Super User specific endpoint
      if (analysisData.analysisId) {
        try {
          console.log('🔍 Attempting to fetch AI responses for analysisId:', analysisData.analysisId);
          const responsesResponse = await apiService.get(`/api/v1/super-user/analysis/${analysisData.analysisId}/responses`);
          
          if (responsesResponse.data.responses && responsesResponse.data.responses.length > 0) {
            console.log('✅ Found AI responses:', responsesResponse.data.responses.length);
            
            // Create a map of all responses for easier lookup by prompt ID
            const responseMap = {};
            responsesResponse.data.responses.forEach(resp => {
              if (resp.promptId && resp.promptId._id) {
                responseMap[resp.promptId._id] = resp;
              }
            });
            
            console.log('🔍 DEBUG: Response map created:', Object.keys(responseMap).length, 'responses');
            console.log('🔍 DEBUG: First few response IDs:', Object.keys(responseMap).slice(0, 5));
            
            // Update the categories with actual AI responses using direct ID matching
            const updatedCategories = basicCategories.map(category => ({
              ...category,
              prompts: category.prompts.map(prompt => {
                console.log(`🔍 Looking for response for prompt ID: ${prompt._id}`);
                
                // Try to find response by exact prompt ID match
                const matchingResponse = responseMap[prompt._id];
                
                const aiResponse = matchingResponse ? {
                  _id: matchingResponse._id,
                  responseText: matchingResponse.responseText,
                  createdAt: matchingResponse.createdAt
                } : null;
                
                console.log(`🔍 Prompt "${prompt._id}" matched:`, !!aiResponse);
                if (aiResponse) {
                  console.log(`✅ AI response found: ${aiResponse.responseText?.substring(0, 100)}...`);
                }
                
                // Extract actual prompt text from the response data if available
                let actualPromptText = prompt.promptText;
                if (matchingResponse && matchingResponse.promptText && matchingResponse.promptText !== 'Unknown prompt') {
                  actualPromptText = matchingResponse.promptText;
                }
                
                return {
                  ...prompt,
                  // Use the actual prompt text from the response if available
                  promptText: actualPromptText || prompt.text || prompt.question || prompt.prompt || prompt.content || `Prompt ${prompt._id}`,
                  aiResponse: aiResponse,
                  responses: matchingResponse ? [matchingResponse] : [] // Keep for compatibility
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
              {new Date(analysisData.createdAt).toLocaleDateString()}
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
            brandId={analysisData.analysisResults?.brandId}
            brandName={analysisData.brandName}
            shareOfVoice={analysisData.analysisResults?.shareOfVoice || {}}
            mentionCounts={analysisData.analysisResults?.mentionCounts || {}}
            totalMentions={analysisData.analysisResults?.totalMentions || 0}
            brandShare={analysisData.analysisResults?.brandShare || 0}
            aiVisibilityScore={analysisData.analysisResults?.aiVisibilityScore || 0}
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
            categories={analysisData.populatedCategories || detailedResults.categories}
            prompts={detailedResults.prompts}
            isSuperUser={true}
            analysisId={analysisData.analysisId}
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