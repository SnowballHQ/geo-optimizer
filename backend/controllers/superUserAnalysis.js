const SuperUserAnalysis = require("../models/SuperUserAnalysis");
const BrandProfile = require("../models/BrandProfile");
const BrandCategory = require("../models/BrandCategory");
const CategorySearchPrompt = require("../models/CategorySearchPrompt");
const PromptAIResponse = require("../models/PromptAIResponse");
const { extractCategories, saveCategories } = require("./brand/category");
const { extractCompetitorsWithOpenAI } = require("./brand/extractCompetitors");
const PerplexityService = require("../utils/perplexityService");
const TokenCostLogger = require("../utils/tokenCostLogger");
const { generateAndSavePrompts } = require("./brand/prompt");
const { runPromptsAndSaveResponses } = require("./brand/aiResponse");
const { calculateShareOfVoice } = require("./brand/shareOfVoice");

// Initialize services
const perplexityService = new PerplexityService();
const tokenLogger = new TokenCostLogger();

class SuperUserAnalysisController {
  
  // Create new isolated super user analysis
  async createAnalysis(req, res) {
    try {
      const userId = req.user.id;
      const isSuperUser = req.user.role === 'superuser';
      
      if (!isSuperUser) {
        return res.status(403).json({ error: 'Access denied. Super user access required.' });
      }
      
      const { domain, brandName, brandInformation = '', step, isLocalBrand = false } = req.body;
      
      if (!domain) {
        return res.status(400).json({ error: 'Domain is required' });
      }
      
      console.log(`🔥 Super User Analysis: Creating new isolated analysis for ${domain}`);
      
      // Get domain information from Perplexity for step 1
      let domainInfo = { description: brandInformation };
      let extractedLocation = null;
      if (step === 1) {
        try {
          domainInfo = await perplexityService.getDomainInfo(domain);
          
          // Extract location if local brand is enabled
          if (isLocalBrand && domainInfo.description) {
            const OnboardingController = require('./onboarding');
            extractedLocation = await OnboardingController.extractLocationFromDescription(domainInfo.description);
            console.log(`📍 Super User Analysis: Extracted location for local brand: ${extractedLocation}`);
          }
        } catch (error) {
          console.warn('Could not fetch domain info, using provided info:', error.message);
        }
      }
      
      // Helper function to extract clean brand name
      const extractBrandName = (input) => {
        if (!input) return '';
        const cleaned = input.replace(/^https?:\/\//, '').replace(/^www\./, '').split('.')[0];
        return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
      };

      // Create new isolated super user analysis
      const analysis = new SuperUserAnalysis({
        superUserId: userId,
        domain: domain,
        brandName: extractBrandName(brandName || domain),
        brandInformation: domainInfo.description || brandInformation,
        status: 'in_progress',
        currentStep: step || 1,
        step1Data: {
          domain: domain,
          brandName: extractBrandName(brandName || domain),
          description: domainInfo.description || brandInformation,
          isLocalBrand: isLocalBrand,
          location: extractedLocation,
          completed: true
        }
      });
      
      await analysis.save();
      
      console.log(`✅ Super User Analysis: Created isolated analysis ${analysis.analysisId}`);
      
      res.json({
        success: true,
        analysisId: analysis.analysisId,
        domain: analysis.domain,
        brandName: analysis.brandName,
        currentStep: analysis.currentStep
      });
      
    } catch (error) {
      console.error('Create super user analysis error:', error);
      res.status(500).json({ error: 'Failed to create analysis' });
    }
  }
  
  // Update analysis with step data
  async updateAnalysis(req, res) {
    try {
      const userId = req.user.id;
      const isSuperUser = req.user.role === 'superuser';
      
      if (!isSuperUser) {
        return res.status(403).json({ error: 'Access denied. Super user access required.' });
      }
      
      const { analysisId, step, stepData } = req.body;
      
      if (!analysisId || !step || !stepData) {
        return res.status(400).json({ error: 'Analysis ID, step, and step data are required' });
      }
      
      console.log(`🔥 Super User Analysis: Updating step ${step} for analysis ${analysisId}`);
      
      // Find the analysis belonging to this super user
      const analysis = await SuperUserAnalysis.findOne({
        analysisId: analysisId,
        superUserId: userId
      });
      
      if (!analysis) {
        return res.status(404).json({ error: 'Analysis not found or access denied' });
      }
      
      // Update the appropriate step data
      switch (step) {
        case 2:
          // Process categories
          try {
            const categories = stepData.categories || [];
            analysis.step2Data = {
              categories: categories,
              completed: true
            };
            analysis.currentStep = Math.max(analysis.currentStep, 2);
            
            console.log(`✅ Super User Analysis: Categories saved for ${analysisId}:`, categories);
          } catch (error) {
            console.error('Error processing categories:', error);
            throw new Error('Failed to process categories');
          }
          break;
          
        case 3:
          // Process competitors
          try {
            const competitors = stepData.competitors || [];
            analysis.step3Data = {
              competitors: competitors,
              completed: true
            };
            analysis.currentStep = Math.max(analysis.currentStep, 3);
            
            console.log(`✅ Super User Analysis: Competitors saved for ${analysisId}:`, competitors);
          } catch (error) {
            console.error('Error processing competitors:', error);
            throw new Error('Failed to process competitors');
          }
          break;
          
        default:
          return res.status(400).json({ error: 'Invalid step number' });
      }
      
      await analysis.save();
      
      res.json({
        success: true,
        analysisId: analysis.analysisId,
        currentStep: analysis.currentStep,
        stepData: stepData
      });
      
    } catch (error) {
      console.error('Update super user analysis error:', error);
      res.status(500).json({ error: error.message || 'Failed to update analysis' });
    }
  }
  
  // Complete analysis (Step 4 and final processing)
  async completeAnalysis(req, res) {
    try {
      const userId = req.user.id;
      const isSuperUser = req.user.role === 'superuser';
      
      if (!isSuperUser) {
        return res.status(403).json({ error: 'Access denied. Super user access required.' });
      }
      
      const { analysisId, step4Data } = req.body;
      
      if (!analysisId || !step4Data) {
        return res.status(400).json({ error: 'Analysis ID and step 4 data are required' });
      }
      
      console.log(`🔥 Super User Analysis: Completing analysis ${analysisId}`);
      
      // Find the analysis
      const analysis = await SuperUserAnalysis.findOne({
        analysisId: analysisId,
        superUserId: userId
      });
      
      if (!analysis) {
        return res.status(404).json({ error: 'Analysis not found or access denied' });
      }
      
      // Save step 4 data - convert string prompts to objects if needed
      const formattedPrompts = (step4Data.prompts || []).map(prompt => {
        // If it's already an object with promptText, keep as is
        if (typeof prompt === 'object' && prompt.promptText) {
          return prompt;
        }
        // If it's a string, convert to object format
        return { promptText: prompt };
      });
      
      analysis.step4Data = {
        prompts: formattedPrompts,
        completed: true
      };
      analysis.currentStep = 4;
      
      // Create a brand profile for this isolated analysis
      console.log(`🚀 Super User Analysis: Creating brand profile for ${analysis.domain}`);
      
      const brandProfile = new BrandProfile({
        ownerUserId: userId,
        brandName: analysis.brandName,
        domain: analysis.domain,
        brandInformation: analysis.brandInformation,
        competitors: analysis.step3Data?.competitors || [],
        isLocalBrand: analysis.step1Data?.isLocalBrand || false,
        location: analysis.step1Data?.location || null,
        isAdminAnalysis: true // Mark as super user analysis
      });
      
      await brandProfile.save();
      
      // Save categories to database
      if (analysis.step2Data?.categories?.length > 0) {
        await saveCategories(brandProfile._id, analysis.step2Data.categories);
      }
      
      // Save category prompts
      if (step4Data.prompts?.length > 0) {
        for (const categoryPrompt of step4Data.prompts) {
          const category = await BrandCategory.findOne({
            brandId: brandProfile._id,
            name: categoryPrompt.categoryName
          });
          
          if (category && categoryPrompt.prompts?.length > 0) {
            for (const prompt of categoryPrompt.prompts) {
              await CategorySearchPrompt.findOneAndUpdate(
                { categoryId: category._id, prompt: prompt },
                { 
                  categoryId: category._id, 
                  prompt: prompt,
                  createdBy: 'super-user',
                  isActive: true
                },
                { upsert: true }
              );
            }
          }
        }
      }
      
      // Run isolated brand analysis using only the categories from this analysis
      console.log(`🚀 Super User Analysis: Running isolated brand analysis for ${analysis.domain}`);
      
      // Get the categories that were just created for this isolated analysis
      const isolatedCategories = await BrandCategory.find({ 
        brandId: brandProfile._id 
      });
      
      console.log(`📊 Found ${isolatedCategories.length} isolated categories for analysis`);
      
      // Use the prompts from Step 4 (the ones that were generated and possibly edited in the UI)
      const step4Prompts = step4Data.prompts || [];
      
      if (step4Prompts.length === 0) {
        throw new Error('No prompts available for analysis. Please generate prompts in Step 4 first.');
      }
      
      console.log(`🎯 Using ${step4Prompts.length} prompts from Step 4 UI (including any edits)`);
      
      // Create CategorySearchPrompt documents for the prompts from Step 4
      const promptDocuments = [];
      for (let i = 0; i < step4Prompts.length; i++) {
        const promptText = step4Prompts[i];
        
        // Create a category document (we'll distribute prompts across categories)
        const categoryIndex = i % isolatedCategories.length;
        const category = isolatedCategories[categoryIndex];
        
        const promptDoc = await CategorySearchPrompt.create({ 
          categoryId: category._id, 
          brandId: brandProfile._id,
          promptText: promptText,
          createdBy: 'super-user-ui',
          isActive: true
        });
        
        promptDocuments.push({
          promptDoc: promptDoc,
          catDoc: category
        });
        
        console.log(`💾 Saved prompt ${i + 1}: ${promptText.substring(0, 60)}...`);
      }
      
      // Run AI responses using the prompts from Step 4 UI
      const OpenAI = require('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      const aiResponses = await runPromptsAndSaveResponses(openai, promptDocuments, brandProfile._id, userId, analysis.analysisId);
      
      // Extract brand and competitor mentions from AI responses
      console.log('🔍 Super User Analysis: Extracting brand and competitor mentions...');
      const MentionExtractor = require('./brand/mentionExtractor');
      const mentionExtractor = new MentionExtractor();

      for (const response of aiResponses) {
        try {
          await mentionExtractor.extractMentionsFromResponse(
            response.aiDoc.responseText,
            response.aiDoc.promptId,
            response.catDoc._id,
            brandProfile._id,
            userId,
            response.aiDoc._id,
            analysis.analysisId
          );
          console.log(`✅ Mentions extracted for response: ${response.aiDoc._id}`);
        } catch (error) {
          console.error(`❌ Error extracting mentions for response ${response.aiDoc._id}:`, error);
          // Continue with other responses even if one fails
        }
      }
      
      // Calculate Share of Voice for isolated analysis
      // The aiResponses variable already contains the generated responses
      
      // Get competitors from step 3 data
      const competitors = analysis.step3Data?.competitors || [];
      
      // Pass the correct parameters to calculateShareOfVoice
      // For Super User analyses, we want to preserve isolation - don't delete old records
      const aiResponseDocs = aiResponses.map(response => response.aiDoc);
      const sovResult = await calculateShareOfVoice(
        brandProfile, 
        competitors, 
        aiResponseDocs, 
        null, // categoryId - null for all categories
        analysis.analysisId, // analysisSessionId
        true // preserveOldRecords - for Super User isolation
      );
      
      const analysisResult = {
        shareOfVoice: sovResult.shareOfVoice || {},
        mentionCounts: sovResult.mentionCounts || {},
        totalMentions: sovResult.totalMentions || 0,
        brandShare: sovResult.brandShare || 0,
        aiVisibilityScore: sovResult.aiVisibilityScore || 0,
        analysisSteps: {
          categoriesProcessed: isolatedCategories.length,
          promptsGenerated: true,
          aiResponsesGenerated: true,
          sovCalculated: true
        }
      };
      
      // Update analysis with results
      analysis.analysisResults = {
        brandId: brandProfile._id,
        categories: analysis.step2Data?.categories?.map(cat => ({ name: cat, prompts: [] })) || [],
        competitors: analysis.step3Data?.competitors || [],
        shareOfVoice: analysisResult.shareOfVoice || {},
        mentionCounts: analysisResult.mentionCounts || {},
        totalMentions: analysisResult.totalMentions || 0,
        brandShare: analysisResult.brandShare || 0,
        aiVisibilityScore: analysisResult.aiVisibilityScore || 0,
        analysisSteps: analysisResult.analysisSteps || {}
      };
      
      analysis.status = 'completed';
      await analysis.save();
      
      console.log(`🎉 Super User Analysis: Completed analysis ${analysisId}`);
      
      res.json({
        success: true,
        analysisId: analysis.analysisId,
        analysisResults: analysis.analysisResults,
        status: analysis.status
      });
      
    } catch (error) {
      console.error('Complete super user analysis error:', error);
      
      // Update analysis status to failed
      try {
        await SuperUserAnalysis.findOneAndUpdate(
          { analysisId: req.body.analysisId, superUserId: req.user.id },
          { status: 'failed' }
        );
      } catch (updateError) {
        console.error('Failed to update analysis status:', updateError);
      }
      
      res.status(500).json({ error: error.message || 'Failed to complete analysis' });
    }
  }
  
  // Get super user analysis history
  async getAnalysisHistory(req, res) {
    try {
      const userId = req.user.id;
      const isSuperUser = req.user.role === 'superuser';
      
      if (!isSuperUser) {
        return res.status(403).json({ error: 'Access denied. Super user access required.' });
      }
      
      console.log(`🔍 Super User Analysis: Getting history for user ${userId}`);
      
      const analyses = await SuperUserAnalysis.find({
        superUserId: userId
      })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('analysisId domain brandName status createdAt completedAt analysisResults');
      
      const analysisHistory = analyses.map(analysis => ({
        analysisId: analysis.analysisId,
        domain: analysis.domain,
        brandName: analysis.brandName,
        status: analysis.status,
        createdAt: analysis.createdAt,
        completedAt: analysis.completedAt,
        brandId: analysis.analysisResults?.brandId,
        aiVisibilityScore: analysis.analysisResults?.aiVisibilityScore || 0,
        brandShare: analysis.analysisResults?.brandShare || 0,
        totalMentions: analysis.analysisResults?.totalMentions || 0,
        competitorsCount: analysis.analysisResults?.competitors?.length || 0
      }));
      
      res.json({
        success: true,
        analyses: analysisHistory,
        totalCount: analyses.length
      });
      
    } catch (error) {
      console.error('Get analysis history error:', error);
      res.status(500).json({ error: 'Failed to get analysis history' });
    }
  }
  
  // Get specific analysis details
  async getAnalysis(req, res) {
    try {
      const userId = req.user.id;
      const isSuperUser = req.user.role === 'superuser';
      const { analysisId } = req.params;
      
      if (!isSuperUser) {
        return res.status(403).json({ error: 'Access denied. Super user access required.' });
      }
      
      console.log(`🔍 Super User Analysis: Getting details for ${analysisId}`);
      
      const analysis = await SuperUserAnalysis.findOne({
        analysisId: analysisId,
        superUserId: userId
      });
      
      if (!analysis) {
        return res.status(404).json({ error: 'Analysis not found or access denied' });
      }
      
      // If analysis is completed, also get populated categories with prompts and responses
      let populatedCategories = [];
      if (analysis.status === 'completed' && analysis.analysisResults?.brandId) {
        try {
          // ✅ SUPER USER SOV FIX: Get fresh SOV data from database instead of cached analysisResults
          console.log(`🔄 Super User Analysis: Fetching fresh SOV data for analysis ${analysisId}`);
          console.log(`🔍 Searching for SOV with userId: ${userId}, brandId: ${analysis.analysisResults.brandId}`);
          
          const BrandShareOfVoice = require('../models/BrandShareOfVoice');
          
          // ✅ FIX: Try multiple user ID formats and search strategies
          let latestSOV = null;
          
          // Strategy 1: Search by exact userId match
          latestSOV = await BrandShareOfVoice.findOne({
            brandId: analysis.analysisResults.brandId,
            userId: userId.toString()
          }).sort({ createdAt: -1 });
          
          if (!latestSOV) {
            console.log(`⚠️ No SOV found with exact userId, trying alternative search strategies`);
            
            // Strategy 2: Search by brandId only (for Super User analyses)
            latestSOV = await BrandShareOfVoice.findOne({
              brandId: analysis.analysisResults.brandId
            }).sort({ createdAt: -1 });
            
            if (latestSOV) {
              console.log(`✅ Found SOV by brandId only: ${latestSOV._id}`);
            }
          }
          
          if (!latestSOV) {
            // Strategy 3: Search by analysisSessionId if available
            if (analysis.analysisId) {
              latestSOV = await BrandShareOfVoice.findOne({
                analysisSessionId: analysis.analysisId
              }).sort({ createdAt: -1 });
              
              if (latestSOV) {
                console.log(`✅ Found SOV by analysisSessionId: ${latestSOV._id}`);
              }
            }
          }
          
          if (latestSOV) {
            console.log(`✅ Super User Analysis: Found fresh SOV data, updating analysisResults`);
            console.log(`📊 Fresh SOV data:`, {
              shareOfVoice: Object.keys(latestSOV.shareOfVoice || {}),
              shareOfVoiceValues: latestSOV.shareOfVoice,
              mentionCounts: Object.keys(latestSOV.mentionCounts || {}),
              mentionCountValues: latestSOV.mentionCounts,
              totalMentions: latestSOV.totalMentions,
              brandShare: latestSOV.brandShare,
              aiVisibilityScore: latestSOV.aiVisibilityScore,
              competitors: latestSOV.competitors?.length || 0
            });
            
            // ✅ FIX: Enhanced SOV data validation and normalization
            const hasValidSOV = latestSOV.shareOfVoice && Object.keys(latestSOV.shareOfVoice).length > 0;
            const hasValidMentions = latestSOV.mentionCounts && Object.keys(latestSOV.mentionCounts).length > 0;
            
            if (hasValidSOV || hasValidMentions) {
              // ✅ CRITICAL FIX: Ensure SOV values are properly formatted for frontend
              const normalizedSOV = {};
              const normalizedMentions = {};
              
              // Normalize shareOfVoice to ensure numeric values
              if (latestSOV.shareOfVoice) {
                Object.entries(latestSOV.shareOfVoice).forEach(([brand, share]) => {
                  // Ensure share is a valid number
                  const numericShare = Number(share);
                  normalizedSOV[brand] = !isNaN(numericShare) ? numericShare : 0;
                });
              }
              
              // Normalize mentionCounts to ensure integer values
              if (latestSOV.mentionCounts) {
                Object.entries(latestSOV.mentionCounts).forEach(([brand, count]) => {
                  const numericCount = parseInt(count) || 0;
                  normalizedMentions[brand] = numericCount;
                });
              }
              
              // Override cached analysisResults with normalized fresh SOV data
              analysis.analysisResults.shareOfVoice = normalizedSOV;
              analysis.analysisResults.mentionCounts = normalizedMentions;
              analysis.analysisResults.totalMentions = parseInt(latestSOV.totalMentions) || 0;
              analysis.analysisResults.brandShare = Number(latestSOV.brandShare) || 0;
              analysis.analysisResults.aiVisibilityScore = Number(latestSOV.aiVisibilityScore) || 0;
              analysis.analysisResults.competitors = latestSOV.competitors || [];
              
              console.log(`✅ Super User Analysis: SOV data updated in analysisResults`);
              console.log(`📊 Updated analysis results SOV:`, {
                shareOfVoice: analysis.analysisResults.shareOfVoice,
                mentionCounts: analysis.analysisResults.mentionCounts,
                totalMentions: analysis.analysisResults.totalMentions,
                brandShare: analysis.analysisResults.brandShare,
                aiVisibilityScore: analysis.analysisResults.aiVisibilityScore
              });
              
              // ✅ ADDITIONAL DEBUG: Log the exact values being sent to frontend
              console.log(`📊 DETAILED SOV VALUES FOR FRONTEND:`);
              Object.entries(analysis.analysisResults.shareOfVoice || {}).forEach(([brand, share]) => {
                console.log(`   ${brand}: ${share}% (mentions: ${analysis.analysisResults.mentionCounts?.[brand] || 0})`);
              });
            } else {
              console.log(`⚠️ SOV data found but appears to be empty, keeping cached data`);
            }
          } else {
            console.log(`⚠️ Super User Analysis: No fresh SOV data found with any strategy, using cached data`);
            console.log(`📊 Cached SOV data:`, {
              shareOfVoice: analysis.analysisResults.shareOfVoice,
              mentionCounts: analysis.analysisResults.mentionCounts,
              totalMentions: analysis.analysisResults.totalMentions,
              brandShare: analysis.analysisResults.brandShare
            });
          }
          
          // Get categories with prompts and responses for this specific analysis
          const categories = await BrandCategory.find({ 
            brandId: analysis.analysisResults.brandId 
          }).lean();
          
          console.log(`📊 Found ${categories.length} categories for analysis ${analysisId}`);
          
          // Get prompts and responses for each category, filtered by analysisSessionId
          for (const category of categories) {
            console.log(`📝 Fetching prompts for category: ${category.categoryName}`);
            
            // Get prompts for this category and analysis
            const prompts = await CategorySearchPrompt.find({
              categoryId: category._id,
              brandId: analysis.analysisResults.brandId
            }).lean();
            
            console.log(`📝 Found ${prompts.length} prompts for ${category.categoryName}`);
            
            // Get AI responses for each prompt, filtered by analysisSessionId
            const promptsWithResponses = [];
            for (const prompt of prompts) {
              console.log(`🔍 Processing prompt ${prompt._id}, promptText: ${prompt.promptText || prompt.prompt || 'NOT FOUND'}`);
              
              // ✅ FIX: Ensure prompt has proper text field populated
              const enhancedPrompt = {
                ...prompt,
                // Ensure promptText field exists for frontend compatibility
                promptText: prompt.promptText || prompt.prompt || prompt.question || prompt.text || prompt.content || `Prompt ${prompt._id}`,
                // Keep original fields as fallback
                text: prompt.text || prompt.promptText || prompt.prompt || prompt.question,
                question: prompt.question || prompt.promptText || prompt.prompt || prompt.text
              };
              
              console.log(`✅ Enhanced prompt text: ${enhancedPrompt.promptText}`);
              
              // First try to get AI response for this specific analysis
              let aiResponse = await PromptAIResponse.findOne({
                promptId: prompt._id,
                analysisSessionId: analysis.analysisId // Filter by analysis session
              }).lean();
              
              // Fallback for older analyses that might not have analysisSessionId
              if (!aiResponse) {
                console.log(`⚠️ No response found with analysisSessionId, trying fallback for prompt: ${prompt._id}`);
                aiResponse = await PromptAIResponse.findOne({
                  promptId: prompt._id,
                  brandId: analysis.analysisResults.brandId,
                  userId: userId
                }).lean();
                
                if (aiResponse) {
                  console.log(`✅ Found fallback response for prompt: ${prompt._id}`);
                }
              }
              
              if (aiResponse) {
                // ✅ FIX: Enhanced AI response structure validation and normalization
                const enhancedResponse = {
                  ...aiResponse,
                  // Ensure responseText field exists with comprehensive fallback
                  responseText: aiResponse.responseText || aiResponse.content || aiResponse.text || aiResponse.message || aiResponse.response || 'Response content not available',
                  // Keep original fields as fallback
                  content: aiResponse.content || aiResponse.responseText,
                  text: aiResponse.text || aiResponse.responseText,
                  message: aiResponse.message || aiResponse.responseText,
                  // Add data validation flags for frontend debugging
                  _dataValidation: {
                    hasResponseText: !!(aiResponse.responseText),
                    hasContent: !!(aiResponse.content),
                    hasText: !!(aiResponse.text),
                    hasMessage: !!(aiResponse.message),
                    originalFields: Object.keys(aiResponse),
                    responseLength: (aiResponse.responseText || aiResponse.content || aiResponse.text || '').length
                  }
                };
                
                console.log(`✅ Enhanced response found for prompt ${prompt._id}, response length: ${enhancedResponse.responseText.length}`);
                
                // ✅ DEBUG: Log exact response structure sent to frontend
                console.log(`🔍 DEBUG: Response structure for prompt ${prompt._id}:`, {
                  responseTextExists: !!enhancedResponse.responseText,
                  contentExists: !!enhancedResponse.content,  
                  textExists: !!enhancedResponse.text,
                  messageExists: !!enhancedResponse.message,
                  responseTextLength: enhancedResponse.responseText?.length || 0,
                  responseFields: Object.keys(enhancedResponse)
                });
                
                promptsWithResponses.push({
                  ...enhancedPrompt,
                  aiResponse: enhancedResponse
                });
              } else {
                // ✅ FIX: Include prompts without responses but with proper text
                console.log(`⚠️ No response found for prompt ${prompt._id}, including prompt without response`);
                promptsWithResponses.push(enhancedPrompt);
              }
            }
            
            if (promptsWithResponses.length > 0 || prompts.length > 0) {
              populatedCategories.push({
                ...category,
                prompts: promptsWithResponses.length > 0 ? promptsWithResponses : prompts
              });
            }
          }
          
          console.log(`✅ Populated ${populatedCategories.length} categories with prompts and responses`);
        } catch (error) {
          console.error('❌ Super User Analysis: Error fetching fresh data:', error);
          // Don't fail the whole request, just continue with cached data
          console.log('⚠️ Super User Analysis: Continuing with cached analysisResults due to error');
        }
      }
      
      // ✅ FINAL DEBUG: Log the complete response structure being sent to frontend
      console.log('📤 COMPLETE RESPONSE TO FRONTEND:');
      console.log('   - populatedCategories count:', populatedCategories?.length || 0);
      console.log('   - analysisResults.shareOfVoice keys:', Object.keys(analysis.analysisResults?.shareOfVoice || {}));
      console.log('   - analysisResults.mentionCounts keys:', Object.keys(analysis.analysisResults?.mentionCounts || {}));
      console.log('   - analysisResults.totalMentions:', analysis.analysisResults?.totalMentions);
      
      // ✅ CRITICAL: Log exact SOV values being sent to frontend
      console.log('📤 CRITICAL SOV VALUES BEING SENT:');
      if (analysis.analysisResults?.shareOfVoice) {
        Object.entries(analysis.analysisResults.shareOfVoice).forEach(([brand, share]) => {
          console.log(`   ${brand}: ${share}% (type: ${typeof share}, isNumber: ${typeof share === 'number'})`);
        });
      }
      
      // ✅ CRITICAL: Log response validation for first few prompts
      if (populatedCategories?.length > 0) {
        console.log('   - First category prompts count:', populatedCategories[0]?.prompts?.length || 0);
        if (populatedCategories[0]?.prompts?.[0]) {
          const firstPrompt = populatedCategories[0].prompts[0];
          console.log('   - First prompt text:', firstPrompt.promptText?.substring(0, 50) + '...');
          console.log('   - First prompt has aiResponse:', !!firstPrompt.aiResponse);
          if (firstPrompt.aiResponse) {
            console.log('   - First prompt response length:', firstPrompt.aiResponse.responseText?.length || 0);
            console.log('   - First prompt response validation:', firstPrompt.aiResponse._dataValidation || 'N/A');
          }
        }
      }
      
      res.json({
        success: true,
        analysis: {
          analysisId: analysis.analysisId,
          domain: analysis.domain,
          brandName: analysis.brandName,
          status: analysis.status,
          createdAt: analysis.createdAt,
          completedAt: analysis.completedAt,
          currentStep: analysis.currentStep,
          step1Data: analysis.step1Data,
          step2Data: analysis.step2Data,
          step3Data: analysis.step3Data,
          step4Data: analysis.step4Data,
          analysisResults: analysis.analysisResults,
          // ✅ FIX: Add populated categories if available
          populatedCategories: populatedCategories
        }
      });
      
    } catch (error) {
      console.error('Get analysis details error:', error);
      res.status(500).json({ error: 'Failed to get analysis details' });
    }
  }
  
  // Generate prompts for Super User isolated analysis
  async generatePrompts(req, res) {
    try {
      const userId = req.user.id;
      const isSuperUser = req.user.role === 'superuser';
      
      if (!isSuperUser) {
        return res.status(403).json({ error: 'Access denied. Super user access required.' });
      }
      
      const { analysisId } = req.body;
      
      if (!analysisId) {
        return res.status(400).json({ error: 'Analysis ID is required' });
      }
      
      console.log(`🔥 Super User Analysis: Generating prompts for analysis ${analysisId}`);
      
      // Find the analysis
      const analysis = await SuperUserAnalysis.findOne({
        analysisId: analysisId,
        superUserId: userId
      });
      
      if (!analysis) {
        return res.status(404).json({ error: 'Analysis not found or access denied' });
      }
      
      // Check if we have the required data
      if (!analysis.step2Data?.categories?.length) {
        return res.status(400).json({ error: 'Categories are required before generating prompts' });
      }
      
      // Create temporary brand profile for prompt generation
      const tempBrandProfile = {
        _id: 'temp_id',
        brandName: analysis.brandName,
        domain: analysis.domain,
        brandInformation: analysis.brandInformation
      };
      
      // Create category documents structure for prompt generation
      const categoryDocs = analysis.step2Data.categories.map((categoryName, index) => ({
        _id: `temp_cat_${index}`,
        categoryName: categoryName,
        brandId: 'temp_id'
      }));
      
      // Generate prompts using the enhanced logic (same as prompt.js)
      const OpenAI = require('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      console.log(`📝 Generating prompts for ${categoryDocs.length} isolated categories:`, analysis.step2Data.categories);
      
      const allPrompts = [];
      for (const catDoc of categoryDocs) {
        console.log(`📝 Generating keywords and prompts for category: ${catDoc.categoryName}`);
        
        // Single mixed prompt that generates both keywords and prompts
        let keywords = [];
        let promptArr = [];
        
        console.log(`🔄 About to generate keywords and prompts for ${catDoc.categoryName}`);
        console.log(`🔑 Brand: ${analysis.brandName}, Domain: ${analysis.domain}`);
        console.log(`📝 Brand Information: ${analysis.brandInformation || 'None provided'}`);
        console.log(`🤖 About to call OpenAI for mixed generation...`);
        
        try {
          // Get competitors from step 3 if available
          const competitors = analysis.step3Data?.competitors || [];
          const competitorList = competitors.length > 0 ? competitors : [
            'competitor1', 'competitor2', 'competitor3', 'competitor4', 'competitor5'
          ];
          
          // Generate mixed prompt based on location
          let mixedPrompt;
          const isLocalBrand = analysis.step1Data?.isLocalBrand && analysis.step1Data?.location;
          const location = analysis.step1Data?.location;
          
          if (isLocalBrand) {
            // Local brand mixed prompt template
            mixedPrompt = `You are helping a digital marketing researcher. For the category "${catDoc.categoryName}" for ${analysis.domain} in ${location},

Brand Context: ${analysis.brandInformation || `${analysis.brandName} operates at ${analysis.domain}`} in ${location}

Popular competitors include: ${competitorList.join(', ')}.

Please do the following:

STEP 1: Generate 10 long-tail keywords that users might search for when looking for ${catDoc.categoryName} services in ${location}.
STEP 2: Based on those keywords, generate 5 natural, conversational questions that users typically ask ChatGPT about local ${catDoc.categoryName} services.

Requirements:
- Keywords should be location-specific, long-tail search terms for ${location}
- Include local search patterns ("near me", "in ${location}", "best ${location} ${catDoc.categoryName}")

- Questions should focus on local search intent and geo-specific needs
- Questions should be framed so responses would naturally mention ${analysis.brandName} but NOT explicitly mention the brand name
- Use natural, conversational phrasing with location context
- Cover local recommendations, comparisons, and area-specific considerations
- ALWAYS ALWAYS mention the ${location} in the question. 

Return ONLY a JSON object with this exact format:
{
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6", "keyword7", "keyword8", "keyword9", "keyword10"],
  "prompts": ["question1", "question2", "question3", "question4", "question5"]
}`;
          } else {
            // Global brand mixed prompt template (original)
            mixedPrompt = `You are helping a digital marketing researcher. For the category "${catDoc.categoryName}" for ${analysis.domain},

Brand Context: ${analysis.brandInformation || `${analysis.brandName} operates at ${analysis.domain}`}

Popular competitors include: ${competitorList.join(', ')}.

Please do the following:

STEP 1: Generate 10 long-tail keywords that users might search for when looking for ${catDoc.categoryName} services.
STEP 2: Based on those keywords, generate 5 natural, conversational questions that users typically ask ChatGPT. The prompts should be super relevant for ${analysis.brandName}, not generic.

Requirements:
- Keywords should be specific, long-tail search terms
- Questions should be framed so responses would naturally mention ${analysis.brandName} but NOT explicitly mention the brand name
- Questions should use natural, conversational phrasing
- Cover themes like comparisons, alternatives, recommendations, trending tools, and value-for-money

Return ONLY a JSON object with this exact format:
{
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6", "keyword7", "keyword8", "keyword9", "keyword10"],
  "prompts": ["question1", "question2", "question3", "question4", "question5"]
}`;
          }

          // Log the complete mixed prompt
          console.log("🔍 Complete OpenAI Mixed Prompt for Keywords + Prompts:");
          console.log("=" .repeat(80));
          console.log(mixedPrompt);
          console.log("=" .repeat(80));

          const mixedResponse = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: mixedPrompt }],
            max_tokens: 500,
            temperature: 0.6,
          });

          const mixedContent = mixedResponse.choices[0].message.content;
          console.log("OpenAI mixed response:", mixedContent);

          // Parse the mixed response
          try {
            const parsedResponse = JSON.parse(mixedContent);
            if (parsedResponse.keywords && Array.isArray(parsedResponse.keywords)) {
              keywords = parsedResponse.keywords.slice(0, 10);
            }
            if (parsedResponse.prompts && Array.isArray(parsedResponse.prompts)) {
              promptArr = parsedResponse.prompts.slice(0, 5);
            }
          } catch (parseError) {
            console.log("⚠️ JSON parsing failed for mixed response, extracting with regex");
            // Fallback: Extract keywords and prompts separately
            const quotedStrings = mixedContent.match(/"([^"]+)"/g);
            if (quotedStrings) {
              const allStrings = quotedStrings.map(s => s.replace(/"/g, ""));
              // First 10 are keywords, next 5 are prompts
              keywords = parsedResponse.keywords.slice(0, 10);
              promptArr = allStrings.slice(10, 15);
            }
          }

          console.log(`✅ Retrieved ${keywords.length} keywords for ${catDoc.categoryName}:`, keywords);
          console.log(`✅ Retrieved ${promptArr.length} prompts for ${catDoc.categoryName}:`, promptArr);
          
        } catch (error) {
          console.error(`❌ Error generating keywords and prompts for ${catDoc.categoryName}:`, error.message);
          console.error(`❌ Full error:`, error);
          console.log(`🔄 Using fallback keywords and prompts for ${catDoc.categoryName}`);
          // Fallback keywords and prompts
          keywords = [
            `${catDoc.categoryName} solutions`,
            `best ${catDoc.categoryName} services`,
            `${catDoc.categoryName} comparison`,
            `${catDoc.categoryName} alternatives`,
            `${catDoc.categoryName} reviews`
          ];
          promptArr = [
            `What are the best ${catDoc.categoryName} services available?`,
            `How do I choose between different ${catDoc.categoryName} providers?`,
            `Which companies offer the most reliable ${catDoc.categoryName}?`,
            `What should I look for in a ${catDoc.categoryName} service?`,
            `Are there any affordable ${catDoc.categoryName} options?`
          ];
        }
        
        // Add the generated prompts to the collection
        promptArr = promptArr.slice(0, 5);
        console.log(`📋 Generated ${promptArr.length} prompts for category ${catDoc.categoryName}`);
        
        allPrompts.push(...promptArr.map(promptText => ({ promptText })));
      }
      
      console.log(`🎉 Generated ${allPrompts.length} total prompts for isolated analysis`);
      
      res.json({
        success: true,
        prompts: allPrompts,
        categoriesCount: categoryDocs.length,
        promptsCount: allPrompts.length
      });
      
    } catch (error) {
      console.error('Generate prompts error:', error);
      res.status(500).json({ error: 'Failed to generate prompts' });
    }
  }

  // Get brand mentions for a specific Super User analysis
  async getAnalysisMentions(req, res) {
    try {
      const userId = req.user.id;
      const isSuperUser = req.user.role === 'superuser';
      const { analysisId, brandName } = req.params;
      
      if (!isSuperUser) {
        return res.status(403).json({ error: 'Access denied. Super user access required.' });
      }
      
      console.log(`🔍 Super User Analysis: Getting mentions for brand "${brandName}" in analysis ${analysisId}`);
      
      // Find the analysis
      const analysis = await SuperUserAnalysis.findOne({
        analysisId: analysisId,
        superUserId: userId
      });
      
      if (!analysis) {
        return res.status(404).json({ error: 'Analysis not found or access denied' });
      }
      
      if (!analysis.analysisResults?.brandId) {
        return res.status(404).json({ error: 'No brand data available for this analysis' });
      }
      
      // Get brand mentions for this specific analysis using the analysisSessionId
      const CategoryPromptMention = require('../models/CategoryPromptMention');
      const mentions = await CategoryPromptMention.find({
        brandId: analysis.analysisResults.brandId,
        analysisSessionId: analysis.analysisId,
        companyName: new RegExp(brandName, 'i') // Case insensitive search
      }).populate({
        path: 'promptId',
        populate: {
          path: 'categoryId'
        }
      }).populate('responseId').sort({ createdAt: -1 });
      
      console.log(`✅ Found ${mentions.length} mentions for brand "${brandName}" in analysis ${analysisId}`);
      
      // Format mentions for frontend consumption
      const formattedMentions = mentions.map(mention => ({
        _id: mention._id,
        companyName: mention.companyName,
        promptId: {
          promptText: mention.promptId?.promptText || 'Unknown prompt'
        },
        responseId: {
          responseText: mention.responseId?.responseText || 'No response text'
        },
        categoryId: {
          categoryName: mention.promptId?.categoryId?.categoryName || 'Unknown category'
        },
        createdAt: mention.createdAt,
        analysisSessionId: mention.analysisSessionId,
        confidence: mention.confidence || 0
      }));
      
      res.json({
        success: true,
        mentions: formattedMentions,
        totalMentions: formattedMentions.length,
        brandName: brandName,
        analysisId: analysisId
      });
      
    } catch (error) {
      console.error('Get analysis mentions error:', error);
      res.status(500).json({ error: 'Failed to get analysis mentions' });
    }
  }

  // Get AI responses for a specific Super User analysis
  async getAnalysisResponses(req, res) {
    try {
      const userId = req.user.id;
      const isSuperUser = req.user.role === 'superuser';
      const { analysisId } = req.params;
      
      if (!isSuperUser) {
        return res.status(403).json({ error: 'Access denied. Super user access required.' });
      }
      
      console.log(`🔍 Super User Analysis: Getting AI responses for analysis ${analysisId}`);
      
      // Find the analysis
      const analysis = await SuperUserAnalysis.findOne({
        analysisId: analysisId,
        superUserId: userId
      });
      
      if (!analysis) {
        return res.status(404).json({ error: 'Analysis not found or access denied' });
      }
      
      if (!analysis.analysisResults?.brandId) {
        return res.status(404).json({ error: 'No brand data available for this analysis' });
      }
      
      // Get AI responses for this specific analysis using the analysisSessionId
      const responses = await PromptAIResponse.find({
        brandId: analysis.analysisResults.brandId,
        analysisSessionId: analysis.analysisId
      }).populate({
        path: 'promptId',
        populate: {
          path: 'categoryId'
        }
      }).sort({ createdAt: -1 });
      
      console.log(`✅ Found ${responses.length} AI responses for analysis ${analysisId}`);
      
      // Format responses for frontend consumption
      const formattedResponses = responses.map(response => ({
        _id: response._id,
        promptText: response.promptId?.promptText || 'Unknown prompt',
        responseText: response.responseText,
        categoryName: response.promptId?.categoryId?.categoryName || 'Unknown category',
        createdAt: response.createdAt,
        analysisSessionId: response.analysisSessionId
      }));
      
      res.json({
        success: true,
        responses: formattedResponses,
        totalResponses: formattedResponses.length,
        analysisId: analysisId
      });
      
    } catch (error) {
      console.error('Get analysis responses error:', error);
      res.status(500).json({ error: 'Failed to get analysis responses' });
    }
  }

  // Download Super User analysis as PDF
  async downloadAnalysisPDF(req, res) {
    try {
      const userId = req.user.id;
      const isSuperUser = req.user.role === 'superuser';
      const { analysisId } = req.params;
      
      if (!isSuperUser) {
        return res.status(403).json({ error: 'Access denied. Super user access required.' });
      }
      
      console.log(`📄 Super User Analysis: Downloading PDF for analysis ${analysisId}`);
      
      // Find the analysis
      const analysis = await SuperUserAnalysis.findOne({
        analysisId: analysisId,
        superUserId: userId
      });
      
      if (!analysis) {
        return res.status(404).json({ error: 'Analysis not found or access denied' });
      }
      
      if (!analysis.analysisResults?.brandId) {
        return res.status(404).json({ error: 'No analysis results available for PDF generation' });
      }
      
      // Get brand profile
      const brandProfile = await BrandProfile.findById(analysis.analysisResults.brandId);
      if (!brandProfile) {
        return res.status(404).json({ error: 'Brand profile not found' });
      }
      
      // Get categories with prompts and responses for this specific analysis
      const categories = await BrandCategory.find({ 
        brandId: analysis.analysisResults.brandId 
      }).lean();
      
      console.log(`📊 Found ${categories.length} categories for PDF`);
      
      // Get prompts and responses for each category, filtered by analysisSessionId
      const populatedCategories = [];
      for (const category of categories) {
        console.log(`📝 Fetching prompts for category: ${category.categoryName}`);
        
        // Get prompts for this category and analysis
        const prompts = await CategorySearchPrompt.find({
          categoryId: category._id,
          brandId: analysis.analysisResults.brandId
        }).lean();
        
        console.log(`📝 Found ${prompts.length} prompts for ${category.categoryName}`);
        
        // Get AI responses for each prompt, filtered by analysisSessionId
        const promptsWithResponses = [];
        for (const prompt of prompts) {
          // First try to get AI response for this specific analysis
          let aiResponse = await PromptAIResponse.findOne({
            promptId: prompt._id,
            analysisSessionId: analysis.analysisId // Filter by analysis session
          }).lean();
          
          // Fallback for older analyses that might not have analysisSessionId
          if (!aiResponse) {
            console.log(`⚠️ PDF: No response found with analysisSessionId, trying fallback for prompt: ${prompt._id}`);
            aiResponse = await PromptAIResponse.findOne({
              promptId: prompt._id,
              brandId: analysis.analysisResults.brandId,
              userId: userId
            }).lean();
            
            if (aiResponse) {
              console.log(`✅ PDF: Found fallback response for prompt: ${prompt._id}`);
            }
          }
          
          if (aiResponse) {
            promptsWithResponses.push({
              ...prompt,
              aiResponse: aiResponse
            });
          }
        }
        
        if (promptsWithResponses.length > 0) {
          populatedCategories.push({
            ...category,
            prompts: promptsWithResponses
          });
        }
      }
      
      // Get mentions for this specific analysis
      const CategoryPromptMention = require('../models/CategoryPromptMention');
      let mentions = await CategoryPromptMention.find({
        brandId: analysis.analysisResults.brandId,
        analysisSessionId: analysis.analysisId
      }).populate({
        path: 'promptId',
        populate: {
          path: 'categoryId'
        }
      }).populate('responseId').lean();
      
      // Fallback for older analyses that might not have analysisSessionId in mentions
      if (mentions.length === 0) {
        console.log(`⚠️ PDF: No mentions found with analysisSessionId, trying fallback`);
        mentions = await CategoryPromptMention.find({
          brandId: analysis.analysisResults.brandId,
          userId: userId
        }).populate({
          path: 'promptId',
          populate: {
            path: 'categoryId'
          }
        }).populate('responseId').lean();
        
        if (mentions.length > 0) {
          console.log(`✅ PDF: Found ${mentions.length} fallback mentions`);
        }
      }
      
      console.log(`🔍 Found ${mentions.length} mentions for PDF`);
      
      // ✅ PDF SOV FIX: Get fresh SOV data for PDF generation (same as dashboard fix)
      try {
        console.log(`🔄 PDF: Fetching fresh SOV data for PDF generation of analysis ${analysisId}`);
        
        const BrandShareOfVoice = require('../models/BrandShareOfVoice');
        const latestSOV = await BrandShareOfVoice.findOne({
          brandId: analysis.analysisResults.brandId,
          userId: userId.toString()
        }).sort({ createdAt: -1 });

        if (latestSOV) {
          console.log(`✅ PDF: Found fresh SOV data, updating analysis data for PDF`);
          console.log(`📊 PDF Fresh SOV data:`, {
            shareOfVoice: Object.keys(latestSOV.shareOfVoice || {}),
            mentionCounts: Object.keys(latestSOV.mentionCounts || {}),
            totalMentions: latestSOV.totalMentions,
            competitors: latestSOV.competitors?.length || 0
          });
          
          // Override cached analysisResults with fresh SOV data for PDF
          analysis.analysisResults.shareOfVoice = latestSOV.shareOfVoice;
          analysis.analysisResults.mentionCounts = latestSOV.mentionCounts;
          analysis.analysisResults.totalMentions = latestSOV.totalMentions;
          analysis.analysisResults.brandShare = latestSOV.brandShare;
          analysis.analysisResults.aiVisibilityScore = latestSOV.aiVisibilityScore;
          analysis.analysisResults.competitors = latestSOV.competitors;
          
          console.log(`✅ PDF: SOV data updated for PDF generation`);
        } else {
          console.log(`⚠️ PDF: No fresh SOV data found, using cached data for PDF`);
        }
      } catch (pdfSovError) {
        console.error('❌ PDF: Error fetching fresh SOV data for PDF:', pdfSovError);
        console.log('⚠️ PDF: Continuing with cached analysisResults for PDF generation');
      }
      
      // Group mentions by brand
      const mentionsByBrand = {};
      mentions.forEach(mention => {
        const brandName = mention.companyName;
        if (!mentionsByBrand[brandName]) {
          mentionsByBrand[brandName] = [];
        }
        mentionsByBrand[brandName].push({
          promptText: mention.promptId?.promptText || 'Unknown prompt',
          responseText: mention.responseId?.responseText || 'No response',
          categoryName: mention.promptId?.categoryId?.categoryName || 'Unknown category',
          confidence: mention.confidence || 0
        });
      });
      
      // Prepare comprehensive analysis data for PDF
      const analysisData = {
        brandName: analysis.brandName,
        domain: analysis.domain,
        description: analysis.brandInformation || analysis.step1Data?.description || `Analysis of ${analysis.brandName}`,
        analysisDate: analysis.completedAt || analysis.createdAt,
        shareOfVoice: analysis.analysisResults.shareOfVoice || {},
        mentionCounts: analysis.analysisResults.mentionCounts || {},
        totalMentions: analysis.analysisResults.totalMentions || 0,
        brandShare: analysis.analysisResults.brandShare || 0,
        aiVisibilityScore: analysis.analysisResults.aiVisibilityScore || 0,
        competitors: analysis.analysisResults.competitors || analysis.step3Data?.competitors || [],
        categories: populatedCategories,
        mentionsByBrand: mentionsByBrand,
        analysisSteps: {
          step1: analysis.step1Data,
          step2: analysis.step2Data,
          step3: analysis.step3Data,
          step4: analysis.step4Data
        },
        analysisId: analysis.analysisId,
        createdAt: analysis.createdAt
      };
      
      console.log(`📊 PDF Data Summary for ${analysis.analysisId}:`, {
        categories: populatedCategories.length,
        competitors: analysisData.competitors.length,
        totalMentions: analysisData.totalMentions,
        brandShare: analysisData.brandShare,
        mentionedBrands: Object.keys(mentionsByBrand).length,
        totalMentionRecords: mentions.length
      });
      
      // Generate PDF using the existing PDF generator
      const BrandAnalysisPDFGenerator = require('../services/pdfGenerator');
      const pdfGenerator = new BrandAnalysisPDFGenerator();
      const pdfBuffer = await pdfGenerator.generateBrandAnalysisPDF(analysisData);
      
      console.log(`✅ PDF generated successfully for analysis ${analysisId}`);
      
      // Set response headers for PDF download
      const filename = `SuperUser_${analysis.domain.replace(/[^a-zA-Z0-9]/g, '_')}_Analysis_${analysis.analysisId}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      // Send PDF buffer
      res.end(pdfBuffer);
      
      console.log(`📄 Super User PDF downloaded: ${filename}`);
      
    } catch (error) {
      console.error('Download Super User analysis PDF error:', error);
      res.status(500).json({ error: 'Failed to generate PDF' });
    }
  }

  // Extract mentions for Super User analysis (Step 5)
  async extractMentions(req, res) {
    try {
      const userId = req.user.id;
      const isSuperUser = req.user.role === 'superuser';
      const { analysisId, brandName } = req.body;
      
      if (!isSuperUser) {
        return res.status(403).json({ error: 'Access denied. Super user access required.' });
      }
      
      if (!analysisId || !brandName) {
        return res.status(400).json({ error: 'Analysis ID and brand name are required' });
      }
      
      console.log(`🔍 Super User Analysis: Extracting mentions for brand "${brandName}" in analysis ${analysisId}`);
      
      // Find the analysis
      const analysis = await SuperUserAnalysis.findOne({
        analysisId: analysisId,
        superUserId: userId
      });
      
      if (!analysis) {
        return res.status(404).json({ error: 'Analysis not found or access denied' });
      }
      
      if (!analysis.analysisResults?.brandId) {
        return res.status(404).json({ error: 'No brand data available for this analysis' });
      }
      
      // Extract mentions using existing mention extraction logic
      const { extractMentionsForBrand } = require('./brand/mentionExtractor');
      const mentions = await extractMentionsForBrand(
        analysis.analysisResults.brandId,
        brandName,
        analysisId // Pass analysis session ID for isolation
      );
      
      // Update analysis with mentions data
      analysis.step5Data = {
        mentions: mentions,
        totalMentions: mentions.length,
        completed: true,
        completedAt: new Date()
      };
      
      await analysis.save();
      
      console.log(`✅ Super User Analysis: Extracted ${mentions.length} mentions for analysis ${analysisId}`);
      
      res.json({
        success: true,
        mentions: mentions,
        totalMentions: mentions.length,
        brandName: brandName,
        analysisId: analysisId,
        step5Data: analysis.step5Data
      });
      
    } catch (error) {
      console.error('Extract mentions error:', error);
      res.status(500).json({ error: 'Failed to extract mentions' });
    }
  }

  // Calculate Share of Voice for Super User analysis (Step 6)
  async calculateSOV(req, res) {
    try {
      const userId = req.user.id;
      const isSuperUser = req.user.role === 'superuser';
      const { analysisId, brandName } = req.body;
      
      if (!isSuperUser) {
        return res.status(403).json({ error: 'Access denied. Super user access required.' });
      }
      
      if (!analysisId || !brandName) {
        return res.status(400).json({ error: 'Analysis ID and brand name are required' });
      }
      
      console.log(`📊 Super User Analysis: Calculating SOV for brand "${brandName}" in analysis ${analysisId}`);
      
      // Find the analysis
      const analysis = await SuperUserAnalysis.findOne({
        analysisId: analysisId,
        superUserId: userId
      });
      
      if (!analysis) {
        return res.status(404).json({ error: 'Analysis not found or access denied' });
      }
      
      if (!analysis.analysisResults?.brandId) {
        return res.status(404).json({ error: 'No brand data available for this analysis' });
      }
      
      // Calculate SOV using existing logic
      const sovData = await calculateShareOfVoice(
        analysis.analysisResults.brandId,
        brandName,
        analysisId // Pass analysis session ID for isolation
      );
      
      // Update analysis with SOV data
      analysis.step6Data = {
        shareOfVoice: sovData,
        completed: true,
        completedAt: new Date()
      };
      
      await analysis.save();
      
      console.log(`✅ Super User Analysis: Calculated SOV for analysis ${analysisId}`);
      
      res.json({
        success: true,
        shareOfVoice: sovData,
        brandName: brandName,
        analysisId: analysisId,
        step6Data: analysis.step6Data
      });
      
    } catch (error) {
      console.error('Calculate SOV error:', error);
      res.status(500).json({ error: 'Failed to calculate share of voice' });
    }
  }

  // Save Super User analysis to history
  async saveToHistory(req, res) {
    try {
      const userId = req.user.id;
      const isSuperUser = req.user.role === 'superuser';
      const { sessionId, analysisData } = req.body;
      
      if (!isSuperUser) {
        return res.status(403).json({ error: 'Access denied. Super user access required.' });
      }
      
      if (!sessionId || !analysisData) {
        return res.status(400).json({ error: 'Session ID and analysis data are required' });
      }
      
      console.log(`💾 Super User Analysis: Saving to history - Session: ${sessionId}`);
      
      // Create new SuperUserAnalysis record for history
      const analysis = new SuperUserAnalysis({
        superUserId: userId,
        domain: analysisData.domain,
        brandName: analysisData.brandName,
        brandInformation: analysisData.brandInformation,
        status: 'completed',
        currentStep: 7, // All steps completed
        step1Data: {
          ...analysisData.step1Data,
          completed: true
        },
        step2Data: {
          ...analysisData.step2Data,
          completed: true
        },
        step3Data: {
          ...analysisData.step3Data,
          completed: true
        },
        step4Data: {
          ...analysisData.step4Data,
          completed: true
        },
        analysisResults: {
          brandId: analysisData.brandId,
          sessionId: sessionId,
          ...analysisData.analysisResults
        },
        completedAt: new Date()
      });
      
      await analysis.save();
      
      console.log(`✅ Analysis saved to history with ID: ${analysis.analysisId}`);
      
      res.json({
        success: true,
        message: 'Analysis saved to history successfully',
        analysisId: analysis.analysisId,
        historyRecord: {
          analysisId: analysis.analysisId,
          domain: analysis.domain,
          brandName: analysis.brandName,
          createdAt: analysis.createdAt,
          completedAt: analysis.completedAt
        }
      });
      
    } catch (error) {
      console.error('Save to history error:', error);
      res.status(500).json({ error: 'Failed to save analysis to history' });
    }
  }

  // Get brand mentions for a specific Super User analysis
  async getAnalysisMentions(req, res) {
    try {
      const userId = req.user.id;
      const isSuperUser = req.user.role === 'superuser';
      const { analysisId, brandName } = req.params;
      
      if (!isSuperUser) {
        return res.status(403).json({ error: 'Access denied. Super user access required.' });
      }
      
      console.log(`🔍 Super User Analysis: Getting mentions for brand "${brandName}" in analysis ${analysisId}`);
      
      // Find the analysis to ensure user has access
      const analysis = await SuperUserAnalysis.findOne({
        analysisId: analysisId,
        superUserId: userId
      });
      
      if (!analysis) {
        return res.status(404).json({ error: 'Analysis not found or access denied' });
      }
      
      if (!analysis.analysisResults?.brandId) {
        return res.status(404).json({ error: 'No brand data available for this analysis' });
      }
      
      // Get mentions for this specific brand and analysis session
      const CategoryPromptMention = require('../models/CategoryPromptMention');
      const mentions = await CategoryPromptMention.find({
        companyName: brandName,
        brandId: analysis.analysisResults.brandId,
        analysisSessionId: analysisId // Use analysisId as session ID for Super User analyses
      })
      .populate({
        path: 'promptId',
        select: 'promptText'
      })
      .populate({
        path: 'responseId', 
        select: 'responseText createdAt'
      })
      .populate({
        path: 'categoryId',
        select: 'categoryName'
      })
      .sort({ createdAt: -1 })
      .lean();
      
      console.log(`✅ Found ${mentions.length} mentions for brand "${brandName}" in analysis ${analysisId}`);
      
      // Format the response to match what the frontend expects
      const formattedMentions = mentions.map(mention => ({
        _id: mention._id,
        companyName: mention.companyName,
        mentionContext: mention.mentionContext,
        confidence: mention.confidence,
        createdAt: mention.createdAt,
        promptId: {
          _id: mention.promptId?._id,
          promptText: mention.promptId?.promptText
        },
        responseId: {
          _id: mention.responseId?._id,
          responseText: mention.responseId?.responseText,
          createdAt: mention.responseId?.createdAt
        },
        categoryId: {
          _id: mention.categoryId?._id,
          categoryName: mention.categoryId?.categoryName
        }
      }));
      
      res.json({
        success: true,
        brandName: brandName,
        analysisId: analysisId,
        mentions: formattedMentions,
        totalMentions: formattedMentions.length
      });
      
    } catch (error) {
      console.error('Get Super User analysis mentions error:', error);
      res.status(500).json({ error: 'Failed to get brand mentions' });
    }
  }

  // Delete prompt from super user analysis
  async deletePrompt(req, res) {
    try {
      const userId = req.user.id;
      const isSuperUser = req.user.role === 'superuser';
      const { analysisId, promptId } = req.params;
      
      if (!isSuperUser) {
        return res.status(403).json({ error: 'Access denied. Super user access required.' });
      }
      
      console.log(`🗑️ Super User: Deleting prompt ${promptId} from analysis ${analysisId}`);
      
      // Find the analysis to ensure user has access
      const analysis = await SuperUserAnalysis.findOne({
        analysisId: analysisId,
        superUserId: userId
      });
      
      if (!analysis) {
        return res.status(404).json({ error: 'Analysis not found or access denied' });
      }
      
      if (!analysis.analysisResults?.brandId) {
        return res.status(404).json({ error: 'No brand data available for this analysis' });
      }
      
      // Find the prompt and validate it belongs to this analysis
      const prompt = await CategorySearchPrompt.findById(promptId).populate('categoryId');
      
      if (!prompt) {
        return res.status(404).json({ error: 'Prompt not found' });
      }
      
      // Verify the prompt belongs to this analysis session
      if (prompt.brandId.toString() !== analysis.analysisResults.brandId.toString()) {
        return res.status(403).json({ error: 'Access denied: Prompt does not belong to this analysis' });
      }
      
      const categoryId = prompt.categoryId._id;
      const categoryName = prompt.categoryId.categoryName;
      
      console.log(`🔍 Super User: Prompt belongs to category: ${categoryName} (${categoryId})`);
      
      // Step 1: Find and delete AI responses for this prompt AND analysis session
      const aiResponses = await PromptAIResponse.find({ 
        promptId: prompt._id,
        analysisSessionId: analysis.analysisId // Only delete responses from this analysis session
      });
      const responseIds = aiResponses.map(response => response._id);
      
      console.log(`🔍 Super User: Found ${aiResponses.length} AI responses to delete for this analysis`);
      
      // Step 2: Delete brand mentions linked to these responses
      const CategoryPromptMention = require("../models/CategoryPromptMention");
      const deletedMentions = await CategoryPromptMention.deleteMany({
        responseId: { $in: responseIds },
        analysisSessionId: analysis.analysisId // Only delete mentions from this analysis session
      });
      
      console.log(`🗑️ Super User: Deleted ${deletedMentions.deletedCount} brand mentions`);
      
      // Step 3: Delete AI responses from this analysis session only
      const deletedResponses = await PromptAIResponse.deleteMany({
        promptId: prompt._id,
        analysisSessionId: analysis.analysisId
      });
      
      console.log(`🗑️ Super User: Deleted ${deletedResponses.deletedCount} AI responses`);
      
      // Step 4: Delete the prompt (it may be shared, but we remove it as it's part of isolated analysis)
      await CategorySearchPrompt.findByIdAndDelete(promptId);
      
      console.log(`🗑️ Super User: Deleted prompt: ${promptId}`);
      
      // Step 5: Recalculate SOV for this specific analysis session
      console.log(`📊 Super User: Recalculating SOV for analysis ${analysis.analysisId}`);
      
      // Get brand profile
      const brandProfile = await BrandProfile.findById(analysis.analysisResults.brandId);
      if (!brandProfile) {
        throw new Error('Brand profile not found');
      }
      
      // Get remaining AI responses for this analysis session only
      const remainingResponses = await PromptAIResponse.find({ 
        brandId: analysis.analysisResults.brandId,
        analysisSessionId: analysis.analysisId
      }).populate('promptId');
      
      console.log(`📊 Super User: Found ${remainingResponses.length} remaining responses for SOV calculation`);
      
      // Get competitors from analysis data
      const competitors = analysis.step3Data?.competitors || [];
      
      // Recalculate SOV for this analysis session only
      const { calculateShareOfVoice } = require("./brand/shareOfVoice");
      const sovResult = await calculateShareOfVoice(
        brandProfile,
        competitors,
        remainingResponses,
        null, // categoryId - null for all categories
        analysis.analysisId, // analysisSessionId - isolate to this analysis
        true // preserveOldRecords - true for super user isolation
      );
      
      // Update analysis results with new SOV data
      analysis.analysisResults.shareOfVoice = sovResult.shareOfVoice || {};
      analysis.analysisResults.mentionCounts = sovResult.mentionCounts || {};
      analysis.analysisResults.totalMentions = sovResult.totalMentions || 0;
      analysis.analysisResults.brandShare = sovResult.brandShare || 0;
      analysis.analysisResults.aiVisibilityScore = sovResult.aiVisibilityScore || 0;
      
      await analysis.save();
      
      console.log(`✅ Super User: SOV recalculated for analysis ${analysis.analysisId}:`, {
        totalMentions: sovResult.totalMentions,
        brandShare: sovResult.brandShare,
        competitors: Object.keys(sovResult.shareOfVoice || {})
      });
      
      res.json({
        success: true,
        message: 'Prompt deleted and analysis SOV recalculated successfully',
        analysisId: analysis.analysisId,
        deletedData: {
          promptId: promptId,
          categoryId: categoryId,
          categoryName: categoryName,
          deletedResponses: deletedResponses.deletedCount,
          deletedMentions: deletedMentions.deletedCount
        },
        updatedSOV: {
          shareOfVoice: sovResult.shareOfVoice || {},
          mentionCounts: sovResult.mentionCounts || {},
          totalMentions: sovResult.totalMentions || 0,
          brandShare: sovResult.brandShare || 0,
          aiVisibilityScore: sovResult.aiVisibilityScore || 0
        }
      });
      
    } catch (error) {
      console.error('❌ Super User: Error deleting prompt:', error);
      res.status(500).json({ error: 'Failed to delete prompt and recalculate analysis SOV' });
    }
  }

  // Delete analysis (cleanup)
  async deleteAnalysis(req, res) {
    try {
      const userId = req.user.id;
      const isSuperUser = req.user.role === 'superuser';
      const { analysisId } = req.params;
      
      if (!isSuperUser) {
        return res.status(403).json({ error: 'Access denied. Super user access required.' });
      }
      
      console.log(`🗑️ Super User Analysis: Deleting analysis ${analysisId}`);
      
      const analysis = await SuperUserAnalysis.findOneAndDelete({
        analysisId: analysisId,
        superUserId: userId
      });
      
      if (!analysis) {
        return res.status(404).json({ error: 'Analysis not found or access denied' });
      }
      
      // Cleanup associated brand profile if it's a super user analysis
      if (analysis.analysisResults?.brandId) {
        try {
          const brandProfile = await BrandProfile.findById(analysis.analysisResults.brandId);
          // Only delete if it's a super user admin analysis and belongs to the same user
          if (brandProfile && brandProfile.isAdminAnalysis && brandProfile.ownerUserId.toString() === userId.toString()) {
            await BrandProfile.findByIdAndDelete(analysis.analysisResults.brandId);
            
            // Also cleanup related categories and prompts
            const categories = await BrandCategory.find({ brandId: analysis.analysisResults.brandId });
            for (const category of categories) {
              await CategorySearchPrompt.deleteMany({ categoryId: category._id });
            }
            await BrandCategory.deleteMany({ brandId: analysis.analysisResults.brandId });
            
            console.log(`✅ Cleaned up associated brand profile and data ${analysis.analysisResults.brandId}`);
          }
        } catch (cleanupError) {
          console.warn('Could not cleanup brand profile:', cleanupError.message);
        }
      }
      
      res.json({
        success: true,
        message: 'Analysis deleted successfully'
      });
      
    } catch (error) {
      console.error('Delete analysis error:', error);
      res.status(500).json({ error: 'Failed to delete analysis' });
    }
  }
}

module.exports = new SuperUserAnalysisController();