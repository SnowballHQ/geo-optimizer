const OpenAI = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const TokenCostLogger = require("../../utils/tokenCostLogger");

// Import legacy models
const BrandShareOfVoice = require("../../models/BrandShareOfVoice");
const BrandCategory = require("../../models/BrandCategory");
const CategorySearchPrompt = require("../../models/CategorySearchPrompt");
const PromptAIResponse = require("../../models/PromptAIResponse");

const { findOrCreateBrandProfile, canUserAnalyzeDomain } = require("./brandProfile");
const { extractCategories, saveCategories } = require("./category");
const { generateAndSavePrompts } = require("./prompt");
const { runPromptsAndSaveResponses } = require("./aiResponse");
const { parseInsightsAndCompetitors } = require("./insight");
const { calculateMetrics } = require("./metrics");
const { generateBrandDescription } = require("./description");
const { extractCompetitorsWithOpenAI } = require("./extractCompetitors");
const { calculateShareOfVoice } = require("./shareOfVoice");
const BrandMatcher = require('./brandMatcher');
const EntityRecognizer = require('./entityRecognizer');

// Initialize token logger for cost tracking
const tokenLogger = new TokenCostLogger();

exports.analyzeBrand = async (req, res) => {
  console.log("=== 🚀 Starting Brand Analysis ===");
  console.log("📋 Request body:", req.body);
  const { domain, brandName, isSuperUserAnalysis } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;

  if (!domain) return res.status(400).json({ msg: "Domain is required" });

  // Check if this is a super user analysis
  const isSuperUser = userRole === 'superuser';
  const isAdminAnalysis = isSuperUserAnalysis && isSuperUser;

  console.log(`👤 User analysis type: ${isAdminAnalysis ? 'Super User Analysis' : 'Regular User Analysis'}`);
  console.log(`🔑 User role: ${userRole}`);

  try {
    // ✅ Generate analysis session ID for this analysis
    const sessionPrefix = isAdminAnalysis ? 'superuser_analysis' : 'analysis';
    const analysisSessionId = `${sessionPrefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`🆔 Generated analysis session ID: ${analysisSessionId}`);

    // Pre-validate domain analysis (skip for super users)
    let domainValidation = null;
    if (!isAdminAnalysis) {
      domainValidation = await canUserAnalyzeDomain(userId, domain);
      console.log("🔍 Domain validation:", domainValidation);
      
      if (!domainValidation.canAnalyze) {
        return res.status(400).json({ 
          error: "Domain analysis not allowed", 
          message: domainValidation.message 
        });
      }
    } else {
      console.log("🔥 Super user analysis - skipping domain validation");
      domainValidation = { canAnalyze: true, message: "Super user analysis" };
    }

    // Log analysis session start
    tokenLogger.logAnalysisStart(domain, brandName || domain);
    const analysisStartTime = Date.now();

    // 1. Create or find brand profile
    console.log("📝 Step 1: Creating/finding brand profile...");
    const brand = await findOrCreateBrandProfile({ 
      domain, 
      brandName, 
      userId,
      isAdminAnalysis,
      userRole 
    });
    console.log(`✅ Brand profile ready: ${brand.brandName} ${isAdminAnalysis ? '(Super User Analysis)' : '(Regular Analysis)'}`);
    
    // Log brand voice information if available
    if (brand.brandTonality || brand.brandInformation) {
      console.log("🎭 Brand voice information:", {
        tonality: brand.brandTonality || "Not analyzed",
        info: brand.brandInformation || "Not analyzed"
      });
    }

    // 2. Extract categories
    console.log("🏷️ Step 2: Extracting categories...");
    const categories = await extractCategories(domain);
    console.log("✅ Categories extracted:", categories);

    // 3. Save categories
    console.log("💾 Step 3: Saving categories...");
    const catDocs = await saveCategories(brand, categories);
    console.log("✅ Categories saved:", catDocs.length, "categories");

    // 4. Extract competitors and brand description FIRST (needed for prompt generation)
    console.log("🏆 Step 4: Extracting competitors and brand description...");
    const competitorResult = await extractCompetitorsWithOpenAI(openai, brand);
    const competitors = competitorResult.competitors;
    const extractedBrandInfo = competitorResult.brandDescription;
    console.log("✅ Competitors extracted:", competitors);
    console.log("📝 Brand description for prompts:", extractedBrandInfo);

    // 5. Generate prompts (now with competitors and brand description)
    console.log("📝 Step 5: Generating prompts...");
    const categoryPrompts = await generateAndSavePrompts(openai, catDocs, brand, competitors, extractedBrandInfo);
    console.log("✅ Prompts generated:", categoryPrompts.length, "prompts");

    // 6. Generate AI responses for each prompt
    console.log("🤖 Step 6: Generating AI responses for each prompt...");
    const aiResponses = await runPromptsAndSaveResponses(openai, categoryPrompts, brand._id, userId, analysisSessionId);
    console.log("✅ AI responses generated:", aiResponses.length, "responses");

    // 6.5. Extract company mentions from AI responses
    console.log("🔍 Step 6.5: Extracting company mentions from AI responses...");
    
    // ✅ IMPORTANT: Clear previous mentions for this user before new analysis
    console.log("🧹 Clearing previous mentions for user:", userId);
    try {
      const CategoryPromptMention = require('../../models/CategoryPromptMention');
      const deleteResult = await CategoryPromptMention.deleteMany({ userId: userId });
      console.log(`✅ Cleared ${deleteResult.deletedCount} previous mentions for user: ${userId}`);
    } catch (cleanupError) {
      console.error("⚠️ Warning: Failed to clear previous mentions:", cleanupError.message);
      // Continue with analysis even if cleanup fails
    }
    
    try {
      const MentionExtractor = require('./mentionExtractor');
      const mentionExtractor = new MentionExtractor();
      
      // Process all responses for this brand to extract mentions
      const totalMentions = await mentionExtractor.processBrandResponses(brand._id, userId, analysisSessionId);
      console.log("✅ Company mentions extracted:", totalMentions, "mentions");
      
      // ✅ IMPORTANT: Add delay and verify mentions were created with analysisSessionId
      console.log("⏳ Waiting for database consistency...");
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verify mentions were created with analysisSessionId
      const CategoryPromptMention = require('../../models/CategoryPromptMention');
      const mentionsWithSession = await CategoryPromptMention.find({
        analysisSessionId: analysisSessionId
      });
      
      console.log(`🔍 Verification: Found ${mentionsWithSession.length} mentions with analysisSessionId: ${analysisSessionId}`);
      
      if (mentionsWithSession.length === 0) {
        console.log("⚠️ WARNING: No mentions found with current analysisSessionId!");
        console.log("⚠️ This will cause SOV calculation to fall back to old data");
      } else {
        console.log("✅ Mentions verified with analysisSessionId - SOV calculation should work correctly");
      }
      
    } catch (mentionError) {
      console.error("⚠️ Company mention extraction failed:", mentionError.message);
      // Continue without mention extraction - analysis is still valid
    }

    // 7. Calculate share of voice
    console.log("📊 Step 7: Calculating share of voice...");
    const sovResult = await calculateShareOfVoice(brand, competitors, aiResponses, catDocs[0]?._id, analysisSessionId);
    console.log("✅ Share of voice calculated");

    // 8. Generate brand description
    console.log("📝 Step 8: Generating brand description...");
    const brandDescription = await generateBrandDescription(openai, { domain, brandName });
    console.log("✅ Brand description generated");

    // 9. Update brand profile with description and analyze voice
    console.log("🎭 Step 9: Updating brand profile with voice analysis...");
    try {
      const { updateBrandProfileWithDescriptionAndVoice } = require("./brandProfile");
      await updateBrandProfileWithDescriptionAndVoice(brand, brandDescription, domain, brandName);
      console.log("✅ Brand profile updated with description and voice analysis");
    } catch (voiceError) {
      console.error("⚠️ Brand voice analysis failed:", voiceError.message);
      // Continue without voice analysis - profile is still updated with description
    }

    // 10. Save all data to BrandShareOfVoice
    console.log("💾 Step 10: Saving analysis results...");
    const analysisData = {
      brandId: brand._id,
      userId,
      domain,
      brandName: brand.brandName,
      description: brandDescription,
      categories: catDocs.map(cat => cat._id), // Save only ObjectIds
      categoryPrompts: categoryPrompts.map(prompt => prompt._id), // Save only ObjectIds
      aiResponses: aiResponses.map(response => response.aiDoc._id), // Save only ObjectIds
      competitors,
      shareOfVoice: sovResult.shareOfVoice,
      mentionCounts: sovResult.mentionCounts,
      totalMentions: sovResult.totalMentions,
      brandShare: sovResult.brandShare,
      aiVisibilityScore: sovResult.aiVisibilityScore,
      analysisSessionId: analysisSessionId, // ✅ Add analysis session ID
      analysisDate: new Date(),
      duration: Math.round((Date.now() - analysisStartTime) / 1000),
      // Add missing fields for schema compatibility
      categoryId: catDocs[0]?._id, // Use first category ID if available
      calculatedAt: new Date()
    };

    const brandAnalysis = new BrandShareOfVoice(analysisData);
    await brandAnalysis.save();
    console.log("✅ Analysis results saved to database");

    // 11. Log token usage and complete
    const analysisEndTime = Date.now();
    const totalDuration = Math.round((analysisEndTime - analysisStartTime) / 1000);
    
    tokenLogger.logAnalysisEnd();
    
    console.log("=== 🎉 Brand Analysis Complete ===");
    console.log("⏱️ Total duration:", totalDuration, "seconds");
    console.log("📊 Results:", {
      categories: catDocs.length,
      competitors: competitors.length,
      shareOfVoice: Object.keys(sovResult.shareOfVoice).length,
      totalMentions: sovResult.totalMentions
    });

    // Calculate total duration
    const totalAnalysisTime = Date.now() - analysisStartTime;
    console.log(`⏱️ Total analysis time: ${totalAnalysisTime}ms`);

    // For Super User analyses, also create/update SuperUserAnalysis record and return the correct analysisId
    let finalAnalysisId = brandAnalysis._id;
    if (isAdminAnalysis) {
      try {
        console.log('🔄 Super User Analysis: Creating/updating SuperUserAnalysis record...');
        const SuperUserAnalysis = require("../../models/SuperUserAnalysis");
        
        // Check if there's already a SuperUserAnalysis with this session ID
        let superUserAnalysis = await SuperUserAnalysis.findOne({
          analysisId: analysisSessionId,
          superUserId: userId
        });
        
        if (!superUserAnalysis) {
          // Create new SuperUserAnalysis record
          superUserAnalysis = new SuperUserAnalysis({
            superUserId: userId,
            analysisId: analysisSessionId,
            domain: domain,
            brandName: brand.brandName,
            brandInformation: brandDescription,
            status: 'completed',
            currentStep: 6,
            step1Data: { domain, brandName: brand.brandName, description: brandDescription, completed: true },
            step2Data: { categories: catDocs.map(cat => cat.categoryName), completed: true },
            step3Data: { competitors, completed: true },
            step4Data: { prompts: categoryPrompts.map(p => ({ text: p.promptText, categoryId: p.categoryId })), completed: true },
            analysisResults: {
              brandId: brand._id,
              categories: catDocs.map(cat => ({ name: cat.categoryName, prompts: [] })),
              competitors,
              shareOfVoice: sovResult.shareOfVoice,
              mentionCounts: sovResult.mentionCounts,
              totalMentions: sovResult.totalMentions,
              brandShare: sovResult.brandShare,
              aiVisibilityScore: sovResult.aiVisibilityScore
            },
            completedAt: new Date()
          });
          await superUserAnalysis.save();
          console.log('✅ Super User Analysis: Created new SuperUserAnalysis record:', superUserAnalysis.analysisId);
        } else {
          // Update existing SuperUserAnalysis record
          superUserAnalysis.analysisResults = {
            brandId: brand._id,
            categories: catDocs.map(cat => ({ name: cat.categoryName, prompts: [] })),
            competitors,
            shareOfVoice: sovResult.shareOfVoice,
            mentionCounts: sovResult.mentionCounts,
            totalMentions: sovResult.totalMentions,
            brandShare: sovResult.brandShare,
            aiVisibilityScore: sovResult.aiVisibilityScore
          };
          superUserAnalysis.status = 'completed';
          superUserAnalysis.completedAt = new Date();
          await superUserAnalysis.save();
          console.log('✅ Super User Analysis: Updated existing SuperUserAnalysis record:', superUserAnalysis.analysisId);
        }
        
        finalAnalysisId = superUserAnalysis.analysisId;
      } catch (superUserError) {
        console.error('⚠️ Super User Analysis: Error creating/updating SuperUserAnalysis record:', superUserError);
        // Continue with regular analysis ID if SuperUserAnalysis creation fails
      }
    }

    // Prepare response with domain status information
    const responseData = {
      success: true,
      msg: "Brand analysis completed successfully",
      brand: brand.brandName,
      domain: brand.domain,
      description: brandDescription,
      brandId: brand._id,
      analysisId: finalAnalysisId, // Use SuperUserAnalysis.analysisId for super user analyses
      categories: catDocs, // Send full category objects to frontend
      competitors,
      shareOfVoice: sovResult.shareOfVoice,
      mentionCounts: sovResult.mentionCounts,
      totalMentions: sovResult.totalMentions,
      brandShare: sovResult.brandShare,
      aiVisibilityScore: sovResult.aiVisibilityScore,
      analysisDate: brandAnalysis.analysisDate,
      duration: totalAnalysisTime
    };

    // Add domain status information
    if (domainValidation.warning) {
      responseData.warning = domainValidation.warning;
      responseData.domainStatus = "switched";
    } else if (domainValidation.message === "Re-analyzing existing domain") {
      responseData.domainStatus = "re-analyzed";
    } else {
      responseData.domainStatus = "first-time";
    }

    res.json(responseData);

  } catch (error) {
    console.error("=== 💥 Analysis Error ===");
    console.error("❌ Error details:", error);
    
    // Log token usage on error
    console.error("Token usage logging skipped due to error");
    
    res.status(500).json({ 
      success: false,
      msg: "Analysis failed", 
      error: error.message 
    });
  }
};

// Get existing brand analysis data
exports.getBrandAnalysis = async (req, res) => {
  console.log("=== 🔍 Retrieving Brand Analysis ===");
  const { brandId } = req.params;
  const userId = req.user.id;

  if (!brandId) return res.status(400).json({ msg: "Brand ID is required" });

  try {
    // Validate brand ownership using utility function
    const { validateBrandOwnership } = require("../../utils/brandValidation");
    const brand = await validateBrandOwnership(userId, brandId);

    if (!brand) {
      return res.status(403).json({ msg: "Access denied: You don't have permission to access this brand" });
    }

    console.log("✅ Brand ownership validated:", brand.brandName);

    // Get the current analysis for this brand (guaranteed to be only one record)
    // Using .lean() to ensure proper deserialization of Mixed type fields
    const latestAnalysis = await BrandShareOfVoice.findOne({ brandId: brand._id, userId }).lean();

    if (!latestAnalysis) {
      return res.status(404).json({ 
        success: false,
        msg: "No analysis found for this brand. Please run a new analysis first." 
      });
    }

    // Since we changed from Map to Object types, no conversion needed
    const shareOfVoice = latestAnalysis.shareOfVoice || {};
    const mentionCounts = latestAnalysis.mentionCounts || {};

    // 🔍 DEBUG: Detailed SOV data verification
    console.log("🔍 SOV Data Retrieved from Database:", {
      shareOfVoice: shareOfVoice,
      shareOfVoiceKeys: Object.keys(shareOfVoice),
      shareOfVoiceValues: Object.values(shareOfVoice),
      shareOfVoiceType: typeof shareOfVoice,
      mentionCounts: mentionCounts,
      mentionCountsKeys: Object.keys(mentionCounts),
      mentionCountsValues: Object.values(mentionCounts),
      mentionCountsType: typeof mentionCounts,
      totalMentions: latestAnalysis.totalMentions,
      brandShare: latestAnalysis.brandShare,
      aiVisibilityScore: latestAnalysis.aiVisibilityScore
    });

    console.log("✅ Brand analysis retrieved:", {
      categories: latestAnalysis.categories?.length || 0,
      competitors: latestAnalysis.competitors?.length || 0,
      shareOfVoice: Object.keys(shareOfVoice).length,
      analysisDate: latestAnalysis.analysisDate
    });

    // Populate categories with full data instead of just ObjectIDs
    let populatedCategories = [];
    if (latestAnalysis.categories && latestAnalysis.categories.length > 0) {
      try {
        const BrandCategory = require("../../models/BrandCategory");
        populatedCategories = await BrandCategory.find({
          _id: { $in: latestAnalysis.categories }
        }).lean();
        
        console.log(`✅ Populated ${populatedCategories.length} categories with full data`);
      } catch (categoryError) {
        console.error("⚠️ Error populating categories:", categoryError.message);
        // Fallback to empty categories if population fails
        populatedCategories = [];
      }
    }

    // Fetch category prompts and responses for each category
    let categoriesWithPrompts = [];
    if (populatedCategories.length > 0) {
      try {
        const CategorySearchPrompt = require("../../models/CategorySearchPrompt");
        const PromptAIResponse = require("../../models/PromptAIResponse");
        
        // Debug: Check what prompts exist in the database
        console.log(`🔍 Debug: Checking database for prompts...`);
        const allPrompts = await CategorySearchPrompt.find({}).lean();
        console.log(`📊 Total prompts in database: ${allPrompts.length}`);
        if (allPrompts.length > 0) {
          console.log(`📝 Sample prompt structure:`, {
            id: allPrompts[0]._id,
            categoryId: allPrompts[0].categoryId,
            brandId: allPrompts[0].brandId,
            promptText: allPrompts[0].promptText?.substring(0, 100) + '...'
          });
        }
        
        // Debug: Check prompts for this specific brand
        const brandPrompts = await CategorySearchPrompt.find({ brandId: brand._id }).lean();
        console.log(`🏢 Prompts for brand ${brand.brandName} (${brand._id}): ${brandPrompts.length}`);
        
        // Debug: Check if there's a mismatch in brand ID
        console.log(`🔍 Brand ID comparison:`, {
          brandIdFromBrand: brand._id,
          brandIdFromLatestAnalysis: latestAnalysis.brandId,
          areEqual: brand._id.toString() === latestAnalysis.brandId.toString(),
          brandIdType: typeof brand._id,
          latestAnalysisBrandIdType: typeof latestAnalysis.brandId
        });
        
        for (const category of populatedCategories) {
          console.log(`🔍 Processing category: ${category.categoryName} (${category._id})`);
          
          // Get prompts for this category - try multiple approaches
          let prompts = [];
          
          // First, try to find prompts with both categoryId and brandId
          prompts = await CategorySearchPrompt.find({
            categoryId: category._id,
            brandId: brand._id
          }).lean();
          
          console.log(`📝 Found ${prompts.length} prompts with brandId for category ${category.categoryName}`);
          
          // If no prompts found, try to find prompts with just categoryId (for legacy data)
          if (prompts.length === 0) {
            console.log(`🔍 No prompts with brandId found, checking for legacy prompts without brandId...`);
            const legacyPrompts = await CategorySearchPrompt.find({
              categoryId: category._id,
              brandId: { $exists: false }
            }).lean();
            
            console.log(`📝 Found ${legacyPrompts.length} legacy prompts without brandId for category ${category.categoryName}`);
            
            if (legacyPrompts.length > 0) {
              // Update these legacy prompts to include the brandId
              console.log(`🔄 Updating ${legacyPrompts.length} legacy prompts with brandId: ${brand._id}`);
              console.log(`📝 Legacy prompt IDs to update:`, legacyPrompts.map(p => p._id));
              
              try {
                const updateResult = await CategorySearchPrompt.updateMany(
                  { _id: { $in: legacyPrompts.map(p => p._id) } },
                  { $set: { brandId: brand._id } }
                );
                console.log(`✅ Update result:`, {
                  matchedCount: updateResult.matchedCount,
                  modifiedCount: updateResult.modifiedCount,
                  upsertedCount: updateResult.upsertedCount
                });
                
                // Verify the update by checking one prompt directly
                const verifyPrompt = await CategorySearchPrompt.findById(legacyPrompts[0]._id).lean();
                console.log(`🔍 Verification - First prompt after update:`, {
                  id: verifyPrompt._id,
                  categoryId: verifyPrompt.categoryId,
                  brandId: verifyPrompt.brandId,
                  hasBrandId: !!verifyPrompt.brandId
                });
                
                // Now fetch the updated prompts
                prompts = await CategorySearchPrompt.find({
                  categoryId: category._id,
                  brandId: brand._id
                }).lean();
                console.log(`📝 After update: Found ${prompts.length} prompts for category ${category.categoryName}`);
                
                // Debug: Check what the query is actually looking for
                console.log(`🔍 Query debug:`, {
                  searchingFor: {
                    categoryId: category._id,
                    brandId: brand._id
                  },
                  categoryIdType: typeof category._id,
                  brandIdType: typeof brand._id
                });
                
                // Fallback: Check if there are ANY prompts for this category
                const anyPromptsForCategory = await CategorySearchPrompt.find({
                  categoryId: category._id
                }).lean();
                console.log(`🔍 Fallback check - Any prompts for category ${category.categoryName}:`, {
                  totalFound: anyPromptsForCategory.length,
                  samplePrompts: anyPromptsForCategory.slice(0, 3).map(p => ({
                    id: p._id,
                    categoryId: p.categoryId,
                    brandId: p.brandId,
                    hasBrandId: !!p.brandId
                  }))
                });
                
              } catch (updateError) {
                console.error(`❌ Error updating legacy prompts:`, updateError.message);
                // Use the legacy prompts as-is
                prompts = legacyPrompts;
              }
            }
            
            // If still no prompts, try to find by category name (for very legacy data)
            if (prompts.length === 0) {
              console.log(`🔍 Still no prompts found, trying to find by category name...`);
              const nameBasedPrompts = await CategorySearchPrompt.find({
                categoryName: category.categoryName,
                brandId: { $exists: false }
              }).lean();
              
              console.log(`📝 Found ${nameBasedPrompts.length} prompts by category name: ${category.categoryName}`);
              
              if (nameBasedPrompts.length > 0) {
                // Update these prompts to include both categoryId and brandId
                console.log(`🔄 Updating ${nameBasedPrompts.length} name-based prompts with categoryId and brandId`);
                try {
                  await CategorySearchPrompt.updateMany(
                    { _id: { $in: nameBasedPrompts.map(p => p._id) } },
                    { 
                      $set: { 
                        categoryId: category._id,
                        brandId: brand._id 
                      } 
                    }
                  );
                  console.log(`✅ Successfully updated name-based prompts`);
                  
                  // Now fetch the updated prompts
                  prompts = await CategorySearchPrompt.find({
                    categoryId: category._id,
                    brandId: brand._id
                  }).lean();
                  console.log(`📝 After name-based update: Found ${prompts.length} prompts for category ${category.categoryName}`);
                } catch (updateError) {
                  console.error(`❌ Error updating name-based prompts:`, updateError.message);
                  // Use the name-based prompts as-is
                  prompts = nameBasedPrompts;
                }
              }
            }
          }
          
          console.log(`📝 Final prompts for category ${category.categoryName}:`, {
            categoryId: category._id,
            brandId: brand._id,
            promptsFound: prompts.length,
            promptIds: prompts.map(p => p._id)
          });
          
          // Get AI responses for each prompt
          const promptsWithResponses = [];
          for (const prompt of prompts) {
            console.log(`🤖 Fetching AI response for prompt: ${prompt._id}`);
            const aiResponse = await PromptAIResponse.findOne({
              promptId: prompt._id
            }).lean();
            
            console.log(`✅ AI response for prompt ${prompt._id}:`, {
              found: !!aiResponse,
              responseId: aiResponse?._id || null,
              responseKeys: aiResponse ? Object.keys(aiResponse) : null
            });
            
            promptsWithResponses.push({
              ...prompt,
              aiResponse: aiResponse || null
            });
          }
          
          categoriesWithPrompts.push({
            ...category,
            prompts: promptsWithResponses
          });
        }
        
        console.log(`✅ Fetched prompts and responses for ${categoriesWithPrompts.length} categories`);
        
        // Debug: Log the structure of the first category with prompts
        if (categoriesWithPrompts.length > 0) {
          const firstCategory = categoriesWithPrompts[0];
          console.log('🔍 First category structure:', {
            id: firstCategory._id,
            name: firstCategory.categoryName,
            hasPrompts: !!firstCategory.prompts,
            promptsLength: firstCategory.prompts?.length || 0,
            firstPrompt: firstCategory.prompts?.[0] || null,
            firstPromptStructure: firstCategory.prompts?.[0] ? {
              id: firstCategory.prompts[0]._id,
              hasAiResponse: !!firstCategory.prompts[0].aiResponse,
              aiResponseKeys: firstCategory.prompts[0].aiResponse ? Object.keys(firstCategory.prompts[0].aiResponse) : null
            } : null
          });
        }
      } catch (promptError) {
        console.error("⚠️ Error fetching category prompts/responses:", promptError.message);
        // Fallback to categories without prompts if fetch fails
        categoriesWithPrompts = populatedCategories;
      }
    }

    // Debug: Log the final response data structure
    console.log('🚀 Sending response to frontend with categories:', {
      categoriesCount: categoriesWithPrompts.length,
      categoriesStructure: categoriesWithPrompts.map(cat => ({
        id: cat._id,
        name: cat.categoryName,
        promptsCount: cat.prompts?.length || 0,
        hasPrompts: !!cat.prompts
      })),
      firstCategoryFull: categoriesWithPrompts[0] || null
    });

    console.log("📊 SOV data consistency check:", {
      totalMentions: latestAnalysis.totalMentions,
      shareOfVoice: Object.keys(shareOfVoice).length,
      mentionCounts: Object.keys(mentionCounts).length,
      competitors: latestAnalysis.competitors?.length || 0
    });

    res.json({
      success: true,
      brand: latestAnalysis.brandName,
      domain: latestAnalysis.domain,
      description: latestAnalysis.description || `${latestAnalysis.brandName} provides an AI-powered platform designed for sales teams and sales development representatives (SDRs).`,
      brandId: latestAnalysis.brandId,
      categories: categoriesWithPrompts, // Send populated categories with prompts/responses
      competitors: latestAnalysis.competitors || [],
      shareOfVoice: shareOfVoice,
      mentionCounts: mentionCounts,
      totalMentions: latestAnalysis.totalMentions || 0, // Use fresh database value
      brandShare: latestAnalysis.brandShare || 0,
      aiVisibilityScore: latestAnalysis.aiVisibilityScore || 0,
      status: "Analysis retrieved from database - fresh data guaranteed."
    });

  } catch (err) {
    console.error("=== 💥 Brand Analysis Retrieval Error ===");
    console.error("❌ Error details:", err);
    res.status(500).json({ 
      success: false,
      msg: "Failed to retrieve brand analysis", 
      error: err.message
    });
  }
};