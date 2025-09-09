const OnboardingProgress = require("../models/OnboardingProgress");
const BrandProfile = require("../models/BrandProfile");
const BrandCategory = require("../models/BrandCategory");
const CategorySearchPrompt = require("../models/CategorySearchPrompt");
const { extractCategories, saveCategories } = require("./brand/category");
const { extractCompetitorsWithOpenAI } = require("./brand/extractCompetitors");
const PerplexityService = require("../utils/perplexityService");
const TokenCostLogger = require("../utils/tokenCostLogger");

// Initialize services
const perplexityService = new PerplexityService();
const tokenLogger = new TokenCostLogger();

class OnboardingController {
  // Get user's onboarding progress
  async getProgress(req, res) {
    try {
      const userId = req.user.id;
      const progress = await OnboardingProgress.findOne({ userId });
      
      if (!progress) {
        return res.json({ 
          currentStep: 1, 
          completedSteps: [], 
          stepData: {},
          isCompleted: false 
        });
      }
      
      res.json(progress);
    } catch (error) {
      console.error('Get progress error:', error);
      res.status(500).json({ error: 'Failed to get progress' });
    }
  }

  // Save onboarding progress
  async saveProgress(req, res) {
    try {
      const userId = req.user.id;
      const { currentStep, stepData } = req.body;
      
      const progress = await OnboardingProgress.findOneAndUpdate(
        { userId },
        { 
          currentStep, 
          stepData,
          lastUpdated: new Date(),
          $addToSet: { completedSteps: currentStep }
        },
        { upsert: true, new: true }
      );
      
      res.json({ success: true, progress });
    } catch (error) {
      console.error('Save progress error:', error);
      res.status(500).json({ error: 'Failed to save progress' });
    }
  }

  // Step 1: Domain analysis and AI autocomplete
  async step1DomainAnalysis(req, res) {
    try {
      const userId = req.user.id;
      const { domain, superUserMode = false, sessionId, isLocalBrand = false } = req.body;
      
      if (!domain) {
        return res.status(400).json({ error: 'Domain is required' });
      }

      if (superUserMode) {
        console.log(`🔥 Super User Step 1: Domain analysis for ${domain} (Session: ${sessionId})`);
        
        // For Super User mode, verify user has super user privileges
        const isSuperUser = req.user.role === 'superuser';
        if (!isSuperUser) {
          return res.status(403).json({ error: 'Access denied. Super user privileges required.' });
        }
        
        // Get domain information from Perplexity
        const domainInfo = await perplexityService.getDomainInfo(domain);
        
        // Extract location if local brand is enabled for super user
        let extractedLocation = null;
        if (isLocalBrand && domainInfo.description) {
          extractedLocation = await this.extractLocationFromDescription(domainInfo.description);
          console.log(`📍 Super User: Extracted location for local brand: ${extractedLocation}`);
        }
        
        // Create temporary isolated brand profile for Super User analysis
        const brand = new BrandProfile({
          ownerUserId: userId.toString(),
          domain,
          brandName: domain.replace(/^https?:\/\//, '').replace(/^www\./, ''),
          brandInformation: domainInfo.description || '',
          isLocalBrand: isLocalBrand,
          location: extractedLocation,
          isAdminAnalysis: true, // Mark as Super User analysis
          analysisSessionId: sessionId // Add session ID for isolation
        });
        
        await brand.save();
        
        console.log(`✅ Super User temporary brand profile created: ${brand._id}`);
        
        return res.json({
          success: true,
          brand,
          domainInfo,
          location: extractedLocation,
          currentStep: 1,
          superUserMode: true,
          sessionId: sessionId
        });
      } else {
        console.log(`🔍 Step 1: Domain analysis for ${domain}`);

        // Get domain information from Perplexity
        const domainInfo = await perplexityService.getDomainInfo(domain);
        
        // Extract location if local brand is enabled
        let extractedLocation = null;
        if (isLocalBrand && domainInfo.description) {
          extractedLocation = await this.extractLocationFromDescription(domainInfo.description);
          console.log(`📍 Extracted location for local brand: ${extractedLocation}`);
        }
        
        // Create or update brand profile (normal user flow)
        const brand = await BrandProfile.findOneAndUpdate(
          { ownerUserId: userId.toString() },
          { 
            domain,
            brandName: domain.replace(/^https?:\/\//, '').replace(/^www\./, ''),
            brandInformation: domainInfo.description || '',
            isLocalBrand: isLocalBrand,
            location: extractedLocation,
            updatedAt: new Date()
          },
          { upsert: true, new: true }
        );
        
        // Save progress for normal users
        await OnboardingProgress.findOneAndUpdate(
          { userId },
          { 
            currentStep: 1,
            'stepData.step1': {
              domain,
              brandName: brand.brandName,
              description: domainInfo.description || '',
              isLocalBrand: isLocalBrand,
              location: extractedLocation,
              completed: true
            },
            $addToSet: { completedSteps: 1 }
          },
          { upsert: true }
        );

        return res.json({
          success: true,
          brand,
          domainInfo,
          location: extractedLocation,
          currentStep: 1
        });
      }

    } catch (error) {
      console.error('Step 1 error:', error);
      res.status(500).json({ error: 'Domain analysis failed' });
    }
  }

  // Step 2: Categories extraction
  async step2Categories(req, res) {
    try {
      const userId = req.user.id;
      const { categories } = req.body;
      
      const brand = await BrandProfile.findOne({ ownerUserId: userId.toString() });
      if (!brand) {
        return res.status(404).json({ error: 'Brand profile not found' });
      }

      console.log(`🏷️ Step 2: Categories for ${brand.brandName}`);

      let extractedCategories = categories;
      
      // If no categories provided, extract them using existing API
      if (!categories || categories.length === 0) {
        extractedCategories = await extractCategories(brand.domain);
      }

      // Save categories to database
      const categoryDocs = await saveCategories(brand, extractedCategories);

      // Save progress
      await OnboardingProgress.findOneAndUpdate(
        { userId },
        { 
          currentStep: 2,
          'stepData.step2': {
            categories: extractedCategories,
            completed: true
          },
          $addToSet: { completedSteps: 2 }
        },
        { upsert: true }
      );

      res.json({
        success: true,
        categories: extractedCategories,
        categoryDocs,
        currentStep: 2
      });

    } catch (error) {
      console.error('Step 2 error:', error);
      res.status(500).json({ error: 'Categories extraction failed' });
    }
  }

  // Step 3: Competitors extraction
  async step3Competitors(req, res) {
    try {
      const userId = req.user.id;
      const { competitors } = req.body;
      
      const brand = await BrandProfile.findOne({ ownerUserId: userId.toString() });
      if (!brand) {
        return res.status(404).json({ error: 'Brand profile not found' });
      }

      console.log(`🏆 Step 3: Competitors for ${brand.brandName}`);

      let extractedCompetitors = competitors;
      
      // If no competitors provided, extract them using existing API
      if (!competitors || competitors.length === 0) {
        const OpenAI = require('openai');
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        
        const result = await extractCompetitorsWithOpenAI(openai, brand);
        extractedCompetitors = result.competitors || result; // Handle both new object format and legacy array format
      }

      // Save competitors to brand profile
      brand.competitors = extractedCompetitors;
      await brand.save();

      // Save progress
      await OnboardingProgress.findOneAndUpdate(
        { userId },
        { 
          currentStep: 3,
          'stepData.step3': {
            competitors: extractedCompetitors,
            completed: true
          },
          $addToSet: { completedSteps: 3 }
        },
        { upsert: true }
      );

      res.json({
        success: true,
        competitors: extractedCompetitors,
        currentStep: 3
      });

    } catch (error) {
      console.error('Step 3 error:', error);
      res.status(500).json({ error: 'Competitors extraction failed' });
    }
  }

  // Step 4: Prompts generation
  async step4Prompts(req, res) {
    try {
      const userId = req.user.id;
      const { prompts: editedPrompts } = req.body; // Get edited prompts if provided
      
      const brand = await BrandProfile.findOne({ ownerUserId: userId.toString() });
      if (!brand) {
        return res.status(404).json({ error: 'Brand profile not found' });
      }

      const categories = await BrandCategory.find({ brandId: brand._id });
      if (categories.length === 0) {
        return res.status(400).json({ error: 'No categories found' });
      }

      console.log(`📝 Step 4: Prompts for ${brand.brandName}`);

      let prompts;

      // If edited prompts are provided, update the existing prompts
      if (editedPrompts && Array.isArray(editedPrompts) && editedPrompts.length > 0) {
        console.log(`✏️ Updating prompts with edited versions`);
        
        // Get existing prompts from database
        const existingPrompts = await CategorySearchPrompt.find({ brandId: brand._id });
        
        // Update existing prompts with edited text
        for (let i = 0; i < Math.min(editedPrompts.length, existingPrompts.length); i++) {
          if (existingPrompts[i] && editedPrompts[i].trim()) {
            existingPrompts[i].promptText = editedPrompts[i].trim();
            await existingPrompts[i].save();
          }
        }
        
        // Return updated prompts with their categories
        prompts = existingPrompts.map(p => ({
          promptDoc: p,
          catDoc: categories.find(c => c._id.toString() === p.categoryId.toString())
        }));
      } else {
        console.log(`🤖 Generating new prompts with AI`);
        
        // Use the existing, more sophisticated prompt generation logic
        const OpenAI = require('openai');
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        
        // Import the existing prompt generation function
        const { generateAndSavePrompts } = require('./brand/prompt');
        
        // Get brand description from brand profile or generate a fallback
        const brandDescription = brand.description || brand.overview || `${brand.brandName} operates at ${brand.domain}`;
        
        // Generate prompts using the existing logic
        console.log(`🔄 Onboarding Step 4: Generating prompts for ${categories.length} categories`);
        console.log(`🏢 Brand: ${brand.brandName} (${brand._id})`);
        console.log(`📂 Categories:`, categories.map(c => `${c.categoryName} (${c._id})`));
        
        prompts = await generateAndSavePrompts(
          openai, 
          categories, 
          brand, 
          brand.competitors || [],
          brand.location // Pass location for local brand prompt generation
        );
        
        console.log(`✅ Onboarding Step 4: Generated ${prompts.length} prompts`);
        
        // Validate prompts array structure
        if (!Array.isArray(prompts)) {
          console.error('❌ Prompts is not an array:', typeof prompts);
          throw new Error('Invalid prompts data structure returned from generateAndSavePrompts');
        }
        
        console.log(`🔍 Prompt structure validation:`, prompts.map((p, index) => ({
          index,
          hasPromptDoc: !!p?.promptDoc,
          hasCatDoc: !!p?.catDoc,
          promptId: p?.promptDoc?._id,
          categoryId: p?.catDoc?._id,
          categoryName: p?.catDoc?.categoryName
        })));
      }

      // Save progress
      await OnboardingProgress.findOneAndUpdate(
        { userId },
        { 
          currentStep: 4,
          'stepData.step4': {
            promptsGenerated: true,
            completed: true
          },
          $addToSet: { completedSteps: 4 },
          isCompleted: true
        },
        { upsert: true }
      );

      // Extract prompt data for response (existing function returns {promptDoc, catDoc} structure)
      console.log(`🔍 Processing ${prompts.length} prompts for response`);
      
      const promptData = prompts
        .filter(p => {
          // Handle null/undefined prompts
          if (!p) {
            console.warn('⚠️ Skipping null/undefined prompt');
            return false;
          }
          
          // Validate that both promptDoc and catDoc exist
          if (!p.promptDoc || !p.catDoc) {
            console.warn('⚠️ Skipping prompt with missing data:', {
              hasPromptDoc: !!p.promptDoc,
              hasCatDoc: !!p.catDoc,
              promptId: p.promptDoc?._id,
              categoryId: p.catDoc?._id,
              categoryName: p.catDoc?.categoryName
            });
            return false;
          }
          return true;
        })
        .map(p => ({
          id: p.promptDoc._id,
          promptText: p.promptDoc.promptText,
          categoryName: p.catDoc.categoryName || 'Unknown Category'
        }));
        
      console.log(`✅ Successfully processed ${promptData.length} valid prompts`);

      res.json({
        success: true,
        prompts: promptData,
        currentStep: 4,
        onboardingCompleted: true
      });

    } catch (error) {
      console.error('Step 4 error:', error);
      res.status(500).json({ error: 'Prompts generation failed' });
    }
  }

  // Complete onboarding and trigger remaining analysis
  async completeOnboarding(req, res) {
    try {
      const userId = req.user.id;
      
      console.log(`🚀 Completing onboarding for user: ${userId}`);
      
      // Set a timeout to prevent hanging requests
      let timeoutTriggered = false;
      const timeout = setTimeout(() => {
        console.log('⏰ Request timeout reached, sending response anyway');
        if (!res.headersSent && !timeoutTriggered) {
          timeoutTriggered = true;
          res.json({
            success: true,
            message: 'Onboarding completed (timeout reached)',
            isCompleted: true,
            analysisSteps: {
              aiResponsesGenerated: 'timeout',
              mentionsExtracted: 'timeout',
              shareOfVoiceCalculated: 'timeout'
            }
          });
        }
      }, 300000); // 5 minutes timeout
      
      // Mark onboarding as completed
      await OnboardingProgress.findOneAndUpdate(
        { userId },
        { isCompleted: true, lastUpdated: new Date() }
      );

      // Get brand profile and categories
      const brand = await BrandProfile.findOne({ ownerUserId: userId.toString() });
      if (!brand) {
        console.error('Brand profile not found for user:', userId);
        return res.status(500).json({ error: 'Brand profile not found for analysis' });
      }

      const categories = await BrandCategory.find({ brandId: brand._id });
      if (categories.length === 0) {
        console.error('No categories found for brand:', brand._id);
        return res.status(500).json({ error: 'No categories found for analysis' });
      }

      console.log(`📊 Found ${categories.length} categories for analysis`);

      // --- Trigger the remaining analysis steps ---
      console.log('🚀 Onboarding completed. Triggering remaining analysis steps...');

      // 1. Generate AI responses for prompts
      console.log('📝 Step 1: Generating AI responses for prompts...');
      const OpenAI = require('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      // Get all prompts for the brand's categories
      const prompts = await CategorySearchPrompt.find({ 
        categoryId: { $in: categories.map(cat => cat._id) }
      });

      if (prompts.length === 0) {
        console.error('No prompts found for categories');
        return res.status(500).json({ error: 'No prompts found for analysis' });
      }

      console.log(`📝 Found ${prompts.length} prompts to process`);

      // Generate AI responses using existing function
      const { runPromptsAndSaveResponses } = require('./brand/aiResponse');
      const aiResponses = await runPromptsAndSaveResponses(
        openai, 
        prompts.map(p => ({ promptDoc: p, catDoc: categories.find(c => c._id.toString() === p.categoryId.toString()) })), 
        brand._id, 
        userId, 
        `onboarding_${Date.now()}` // Generate unique analysis session ID
      );

      console.log(`✅ Generated ${aiResponses.length} AI responses`);

      // 2. Extract brand and competitor mentions from responses
      console.log('🔍 Step 2: Extracting brand and competitor mentions...');
      const MentionExtractor = require('./brand/mentionExtractor');
      const mentionExtractor = new MentionExtractor();

      for (const response of aiResponses) {
        try {
          await mentionExtractor.extractMentionsFromResponse(
            response.aiDoc.responseText,
            response.aiDoc.promptId,
            response.catDoc._id,
            brand._id,
            userId,
            response.aiDoc._id,
            `onboarding_${Date.now()}`
          );
        } catch (error) {
          console.error(`Error extracting mentions for response ${response.aiDoc._id}:`, error);
        }
      }

      console.log('✅ Mentions extracted from all responses');

      // 3. Calculate Share of Voice
      console.log('📊 Step 3: Calculating Share of Voice...');
      const { calculateShareOfVoice } = require('./brand/shareOfVoice');
      
      // Ensure brand object has all required fields for SOV calculation
      const brandForSOV = {
        _id: brand._id,
        brandName: brand.brandName || brand.domain?.replace(/^https?:\/\//, '').replace(/^www\./, '') || 'Unknown Brand',
        domain: brand.domain || brand.brandName || 'unknown.com', // Add domain field
        userId: brand.ownerUserId, // Map ownerUserId to userId as expected by SOV function
        ownerUserId: brand.ownerUserId,
        competitors: brand.competitors || []
      };
      
      console.log('🔍 Brand object prepared for SOV calculation:', {
        brandId: brandForSOV._id,
        brandName: brandForSOV.brandName,
        domain: brandForSOV.domain,
        userId: brandForSOV.userId
      });
      
      // Calculate SOV once for the entire brand (aggregating all categories)
      console.log(`🔄 Calculating Share of Voice for entire brand (${categories.length} categories)...`);
      
      // Generate a single analysis session ID for the entire onboarding
      const onboardingAnalysisSessionId = `onboarding_${Date.now()}`;
      console.log(`📊 Using analysis session ID: ${onboardingAnalysisSessionId}`);
      
      try {
        // Aggregate all responses across all categories
        console.log(`📊 Aggregating all AI responses across ${categories.length} categories...`);
        
        if (aiResponses.length > 0) {
          const startTime = Date.now();
          
          // Calculate SOV once using ALL responses, not per category
          // Use the first category's ID as the primary category (this is mainly for tracking)
          await calculateShareOfVoice(
            brandForSOV, 
            brandForSOV.competitors, 
            aiResponses, // Use ALL responses, not just category-specific ones
            categories[0]?._id, // Use first category as primary (for reference only)
            onboardingAnalysisSessionId // Same session ID for the entire onboarding
          );
          
          const endTime = Date.now();
          console.log(`✅ SOV calculated successfully for entire brand in ${endTime - startTime}ms`);
          console.log(`📊 Processed ${aiResponses.length} total AI responses across all categories`);
        } else {
          console.log(`⚠️ No AI responses found, skipping SOV calculation`);
        }
      } catch (error) {
        console.error(`❌ Error calculating SOV for brand:`, error);
      }

      console.log('✅ Share of Voice calculated for all categories');
      console.log('🎉 All remaining analysis steps completed successfully!');
      console.log('📤 Preparing to send response...');

      // Final success response
      const successResponse = {
        success: true,
        message: 'Onboarding completed and remaining analysis triggered successfully',
        isCompleted: true,
        analysisSteps: {
          aiResponsesGenerated: aiResponses.length,
          mentionsExtracted: true,
          shareOfVoiceCalculated: true
        }
      };

      console.log('📤 Sending success response:', successResponse);
      console.log('📤 Response object prepared, calling res.json()...');
      
      // Clear timeout since we're responding successfully
      clearTimeout(timeout);
      
      console.log('📤 Calling res.json() now...');
      if (!res.headersSent && !timeoutTriggered) {
        res.json(successResponse);
        console.log('📤 Response sent successfully!');
      } else {
        console.log('📤 Response already sent, skipping...');
      }

    } catch (error) {
      console.error('Error completing onboarding and triggering analysis:', error);
      
      // Clear timeout in case of error
      if (typeof timeout !== 'undefined') {
        clearTimeout(timeout);
      }
      
      // Only send error response if headers haven't been sent
      if (!res.headersSent && !timeoutTriggered) {
        res.status(500).json({ error: 'Failed to complete onboarding and trigger analysis' });
      } else {
        console.log('Error occurred but response already sent');
      }
    }
  }

  // Check onboarding status
  async getStatus(req, res) {
    try {
      const userId = req.user.id;
      const progress = await OnboardingProgress.findOne({ userId });
      
      if (!progress) {
        return res.json({ 
          status: 'not_started',
          currentStep: 1,
          isCompleted: false
        });
      }
      
      res.json({
        status: progress.isCompleted ? 'completed' : 'in_progress',
        currentStep: progress.currentStep,
        isCompleted: progress.isCompleted,
        completedSteps: progress.completedSteps
      });

    } catch (error) {
      console.error('Get status error:', error);
      res.status(500).json({ error: 'Failed to get status' });
    }
  }

  // Extract location from business description using OpenAI
  async extractLocationFromDescription(description) {
    try {
      console.log(`🔍 Extracting location from description using OpenAI`);
      
      const OpenAI = require('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      const locationPrompt = `From this business description, identify the primary location/city where this business operates. Return only the location name (city, state format if applicable). If no clear location is mentioned, return "null".

Business Description: ${description}`;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: locationPrompt }],
        max_tokens: 50,
        temperature: 0.1
      });

      const locationResult = response.choices[0].message.content.trim();
      
      // Log token usage
      tokenLogger.logOpenAICall(
        'Location Extraction',
        locationPrompt,
        locationResult,
        'gpt-3.5-turbo'
      );
      
      // Return null if OpenAI couldn't find a location
      if (locationResult.toLowerCase() === 'null' || locationResult.toLowerCase() === 'none') {
        return null;
      }
      
      console.log(`✅ Location extracted: ${locationResult}`);
      return locationResult;
      
    } catch (error) {
      console.error('❌ Error extracting location from description:', error);
      return null;
    }
  }
}

module.exports = new OnboardingController();
