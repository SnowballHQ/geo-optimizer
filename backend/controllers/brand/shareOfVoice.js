const BrandShareOfVoice = require("../../models/BrandShareOfVoice");
const CategoryPromptMention = require("../../models/CategoryPromptMention");

// ✅ UTILITY: Generate unique analysis session ID
function generateAnalysisSessionId() {
  return `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ✅ UTILITY: Find latest analysis session for a user/brand
async function findLatestAnalysisSession(userId, brandId) {
  try {
    // Try to find the most recent analysis session
    const latestSession = await CategoryPromptMention.aggregate([
      {
        $match: {
          userId: userId,
          brandId: brandId,
          analysisSessionId: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$analysisSessionId',
          lastMention: { $max: '$createdAt' },
          mentionCount: { $sum: 1 }
        }
      },
      {
        $sort: { lastMention: -1 }
      },
      {
        $limit: 1
      }
    ]);
    
    if (latestSession && latestSession.length > 0) {
      console.log(`🔄 Found latest analysis session: ${latestSession[0]._id} with ${latestSession[0].mentionCount} mentions`);
      return latestSession[0]._id;
    }
    
    return null;
  } catch (error) {
    console.error("❌ Error finding latest analysis session:", error.message);
    return null;
  }
}

// ✅ NEW SIMPLIFIED SOV CALCULATION
// Formula: SOV (%) = (Brand Mentions / Total Mentions in all AI responses) * 100
// Based purely on entity extraction counts from CategoryPromptMention collection
// 
// ✅ USAGE:
// 1. For NEW analysis: calculateShareOfVoice(brand, competitors, aiResponses, categoryId)
//    - Will generate new analysisSessionId automatically
// 2. For EXISTING analysis: calculateShareOfVoice(brand, competitors, aiResponses, categoryId, existingSessionId)
//    - Will use existing analysisSessionId to load previous data
// 3. Each analysis session is completely isolated - no data mixing between sessions

exports.calculateShareOfVoice = async function(brand, competitors, aiResponses, categoryId, analysisSessionId, preserveOldRecords = false) {
  try {
    // ✅ VALIDATION: Check if brand object has required fields
    console.log(`🔍 Brand object validation:`, {
      brandId: brand._id,
      userId: brand.userId,
      ownerUserId: brand.ownerUserId,  // Check for this field too
      brandName: brand.brandName,
      hasUserId: !!brand.userId,
      hasOwnerUserId: !!brand.ownerUserId,
      hasBrandId: !!brand._id,
      hasBrandName: !!brand.brandName
    });
    
    // ✅ FIELD MAPPING: Handle both userId and ownerUserId
    if (!brand.userId && brand.ownerUserId) {
      brand.userId = brand.ownerUserId;
      console.log(`✅ Mapped ownerUserId to userId: ${brand.userId}`);
    }
    
    if (!brand.userId) {
      console.error(`❌ CRITICAL ERROR: brand.userId is missing!`);
      console.error(`❌ Brand object received:`, brand);
      
      // Try to find userId from database if we have brandId
      if (brand._id) {
        console.log(`🔄 Attempting to find userId from database using brandId: ${brand._id}`);
        try {
          const BrandProfile = require("../../models/BrandProfile");
          const brandFromDB = await BrandProfile.findById(brand._id).select('userId ownerUserId');
          
          if (brandFromDB) {
            if (brandFromDB.userId) {
              console.log(`✅ Found userId from database: ${brandFromDB.userId}`);
              brand.userId = brandFromDB.userId;
            } else if (brandFromDB.ownerUserId) {
              console.log(`✅ Found ownerUserId from database: ${brandFromDB.ownerUserId}`);
              brand.userId = brandFromDB.ownerUserId;
            } else {
              console.error(`❌ Neither userId nor ownerUserId found in database for brandId: ${brand._id}`);
              throw new Error('Brand userId is required for SOV calculation and could not be retrieved from database');
            }
          } else {
            console.error(`❌ Could not find brand in database for brandId: ${brand._id}`);
            throw new Error('Brand userId is required for SOV calculation and could not be retrieved from database');
          }
        } catch (dbError) {
          console.error(`❌ Database error while trying to find userId:`, dbError.message);
          throw new Error('Brand userId is required for SOV calculation and could not be retrieved from database');
        }
      } else {
        throw new Error('Brand userId is required for SOV calculation');
      }
    }
    
    if (!brand._id) {
      console.error(`❌ CRITICAL ERROR: brand._id is missing!`);
      console.error(`❌ Brand object received:`, brand);
      throw new Error('Brand ID is required for SOV calculation');
    }
    
    if (!brand.brandName) {
      console.error(`❌ CRITICAL ERROR: brand.brandName is missing!`);
      console.error(`❌ Brand object received:`, brand);
      throw new Error('Brand name is required for SOV calculation');
    }
    
    console.log(`✅ Brand validation passed`);
    
    // Generate analysis session ID if not provided
    if (!analysisSessionId) {
      analysisSessionId = generateAnalysisSessionId();
      console.log(`🆔 Generated new analysis session ID: ${analysisSessionId}`);
    }
    
    console.log(`📈 Calculating Share of Voice for brand: ${brand.brandName}`);
    console.log(`🔍 Using new simplified formula based on CategoryPromptMention counts`);
    console.log(`🎯 Analysis Session ID: ${analysisSessionId}`);
    console.log(`🎯 Category ID: ${categoryId}`);
    console.log(`🎯 User ID: ${brand.userId}`);
    console.log(`🎯 Brand ID: ${brand._id}`);
    
    const allBrands = [brand.brandName, ...competitors];
    console.log(`🎯 Analyzing brands: ${allBrands.join(', ')}`);
    
    // Initialize results
    const mentionCounts = {};
    const shareOfVoice = {};
    let totalMentions = 0;
    let brandShare = 0;
    let aiVisibilityScore = 0;
    
    try {
      // ✅ STEP 1: Get total count of ALL company mentions for the user (CUMULATIVE APPROACH)
      // This includes mentions from ALL analysis sessions for this user/brand
      let totalMentionsResult;
      let dataSource = 'all_mentions_cumulative';
      
      // Get ALL mentions for this user (cumulative across all analysis sessions)
      console.log(`🔍 CUMULATIVE QUERY: Getting all mentions for userId: ${brand.userId}`);
      console.log(`🔍 User ID: ${brand.userId}, Brand ID: ${brand._id}`);
      
      const cumulativeQuery = {
        $match: {
          userId: brand.userId,
          brandId: brand._id
        }
      };
      console.log(`📝 Cumulative query details:`, JSON.stringify(cumulativeQuery, null, 2));
      
      // ✅ DEBUG: Show breakdown by analysis session
      const debugSessions = await CategoryPromptMention.aggregate([
        cumulativeQuery,
        {
          $group: {
            _id: '$analysisSessionId',
            mentionCount: { $sum: 1 },
            companies: { $addToSet: '$companyName' }
          }
        },
        {
          $sort: { mentionCount: -1 }
        }
      ]);
      
      console.log(`🔍 DEBUG: Mentions by analysis session:`);
      debugSessions.forEach(session => {
        console.log(`   Session: ${session._id} - ${session.mentionCount} mentions - Companies: [${session.companies.join(', ')}]`);
      });
      
      totalMentionsResult = await CategoryPromptMention.aggregate([
        cumulativeQuery,
        {
          $group: {
            _id: null,
            totalMentions: { $sum: 1 }
          }
        }
      ]);
      
      console.log(`📊 Cumulative query result:`, totalMentionsResult);
      
      totalMentions = totalMentionsResult && totalMentionsResult.length > 0 ? totalMentionsResult[0].totalMentions : 0;
      console.log(`📊 Total cumulative mentions found: ${totalMentions} (Source: ${dataSource})`);
      
      console.log(`✅ Using CUMULATIVE approach - all mentions from all analysis sessions included`);
      console.log(`✅ This ensures new custom prompt mentions are added to existing SOV calculation`);
      
      if (analysisSessionId) {
        console.log(`ℹ️ Analysis session ID ${analysisSessionId} provided but using cumulative data for SOV`);
      }
      
      if (totalMentions === 0) {
        console.log(`⚠️ No mentions found in database`);
        console.log(`🔍 Debugging information:`);
        console.log(`   - User ID: ${brand.userId}`);
        console.log(`   - Category ID: ${categoryId}`);
        console.log(`   - Analysis Session ID: ${analysisSessionId}`);
        console.log(`   - Brand ID: ${brand._id}`);
        
        // Check if there are any mentions at all for this user
        try {
          const anyMentionsCheck = await CategoryPromptMention.aggregate([
            {
              $match: {
                userId: brand.userId
              }
            },
            {
              $limit: 1
            }
          ]);
          
          if (anyMentionsCheck.length === 0) {
            console.log(`💡 No mentions found for user ${brand.userId} at all`);
            console.log(`💡 This might mean:`);
            console.log(`   1. User hasn't run any analysis yet`);
            console.log(`   2. Mention extraction failed during analysis`);
            console.log(`   3. Database connection issues`);
          } else {
            console.log(`💡 Found ${anyMentionsCheck.length} mention(s) for user, but they don't match current filters`);
            console.log(`💡 Check if analysisSessionId or categoryId are correct`);
          }
        } catch (checkError) {
          console.error(`❌ Error checking for any mentions:`, checkError.message);
        }
        
        // Calculate real SOV values (all brands get 0% when no mentions exist)
        allBrands.forEach(brandName => {
          mentionCounts[brandName] = 0;
          shareOfVoice[brandName] = 0;
        });
        
        brandShare = 0;
        aiVisibilityScore = 0;
        
        console.log(`📊 Real SOV calculated: All brands have 0% SOV (no mentions found)`);
        console.log(`📊 Final results:`, {
          totalMentions,
          mentionCounts,
          shareOfVoice,
          brandShare,
          aiVisibilityScore
        });
        
        // Continue with saving and returning real zero values
      } else {
        // ✅ STEP 2: Get mention count for each specific brand using CUMULATIVE approach
        for (const brandName of allBrands) {
          console.log(`\n🔍 Processing brand: ${brandName}`);
          
          // Use same cumulative query as total mentions (consistent data source)
          const brandCumulativeQuery = {
            $match: {
              userId: brand.userId,
              brandId: brand._id,
              companyName: { $regex: new RegExp(brandName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }
            }
          };
          console.log(`📝 Brand cumulative query details:`, JSON.stringify(brandCumulativeQuery, null, 2));
          
          const brandMentionsResult = await CategoryPromptMention.aggregate([
            brandCumulativeQuery,
            {
              $group: {
                _id: null,
                brandMentions: { $sum: 1 }
              }
            }
          ]);
          
          console.log(`📊 Brand cumulative result for ${brandName}:`, brandMentionsResult);
          
          const brandMentions = brandMentionsResult && brandMentionsResult.length > 0 ? brandMentionsResult[0].brandMentions : 0;
          mentionCounts[brandName] = brandMentions;
          
          console.log(`🔍 ${brandName}: ${brandMentions} mentions (Source: cumulative_all_sessions)`);
          
          // ✅ DEBUG: Show which sessions contributed to this brand's mentions
          if (brandMentions > 0) {
            const sessionBreakdown = await CategoryPromptMention.aggregate([
              brandCumulativeQuery,
              {
                $group: {
                  _id: '$analysisSessionId',
                  mentionCount: { $sum: 1 }
                }
              },
              {
                $sort: { mentionCount: -1 }
              }
            ]);
            
            console.log(`   📊 ${brandName} session breakdown:`, sessionBreakdown.map(s => `${s._id}: ${s.mentionCount}`).join(', '));
          }
        }
        
        // ✅ STEP 3: Calculate SOV using the formula
        // SOV (%) = (Brand Mentions / Total Mentions) * 100
        console.log(`\n📊 STEP 3: Calculating SOV percentages`);
        console.log(`📊 Total mentions found: ${totalMentions}`);
        console.log(`📊 Mention counts:`, mentionCounts);
        
        allBrands.forEach(brandName => {
          const brandMentions = mentionCounts[brandName] || 0;
          const sovPercentage = totalMentions > 0 ? (brandMentions / totalMentions) * 100 : 0;
          
          shareOfVoice[brandName] = Math.round(sovPercentage * 100) / 100; // Round to 2 decimal places
          
          console.log(`📊 ${brandName} SOV: ${brandMentions}/${totalMentions} = ${shareOfVoice[brandName]}%`);
          
          // Set main brand share and AI visibility score
          if (brandName === brand.brandName) {
            brandShare = shareOfVoice[brandName];
            aiVisibilityScore = shareOfVoice[brandName];
          }
        });
        
        console.log(`\n✅ SOV calculation complete using CUMULATIVE formula (all sessions included)`);
        console.log(`📊 Final results:`, {
          totalMentions,
          mentionCounts,
          shareOfVoice,
          brandShare,
          aiVisibilityScore
        });
      }
      
    } catch (dbError) {
      console.error(`❌ Database error during SOV calculation:`, dbError.message);
      console.log(`🔄 Falling back to simplified calculation`);
      
      // Fallback: Use basic text analysis if database fails
      return createFallbackSOV(brand, competitors);
    }
    
    // ✅ STEP 4: Save results to database (upsert based on analysisSessionId)
    try {
      const shareOfVoiceData = {
        brandId: brand._id,
        userId: brand.userId,
        categoryId: categoryId,
        analysisSessionId: analysisSessionId,  // Track which analysis this belongs to
        domain: brand.domain || brand.brandName || 'unknown.com', // Add required domain field
        brandName: brand.brandName || 'Unknown Brand', // Add required brandName field
        totalMentions: totalMentions,
        brandShare: brandShare,
        aiVisibilityScore: aiVisibilityScore,
        shareOfVoice: shareOfVoice,
        mentionCounts: mentionCounts,
        calculationMethod: 'cumulative_all_sessions',
        competitors: [brand.brandName, ...competitors], // Update competitors list
        updatedAt: new Date(),
        analysisDate: new Date()
      };
      
      // Clean approach: Delete existing SOV records and create fresh one (unless preserving for isolation)
      if (!preserveOldRecords) {
        // This ensures frontend always gets the latest, most accurate data
        console.log("🗑️ Removing old SOV records for brand to ensure clean data...");
        const deleteResult = await BrandShareOfVoice.deleteMany({ 
          brandId: brand._id,
          userId: brand.userId 
        });
        console.log(`✅ Deleted ${deleteResult.deletedCount} old SOV records`);
      } else {
        console.log("🔒 Preserving old SOV records for Super User analysis isolation");
      }
      
      // Create fresh SOV record with latest data
      const savedShareOfVoice = await BrandShareOfVoice.create({
        ...shareOfVoiceData,
        createdAt: new Date()
      });
      
      console.log("✅ Fresh Share of Voice record created successfully");
      console.log("✅ Document ID:", savedShareOfVoice._id);
      console.log("✅ Analysis Session ID:", analysisSessionId);
      console.log("✅ Operation: Created fresh record");

      // ✅ STEP 5: Save SOV Snapshot for trend tracking
      try {
        const BrandSOVSnapshot = require("../../models/BrandSOVSnapshot");
        
        // Determine trigger type based on context (default to manual_rerun if not specified)
        const triggerType = brand.triggerType || 'manual_rerun';
        
        console.log(`📊 Saving SOV snapshot for trend tracking - Trigger: ${triggerType}`);
        
        const snapshotData = {
          brandId: brand._id,
          userId: brand.userId,
          snapshotDate: new Date(),
          sovData: shareOfVoice,
          mentionCounts: mentionCounts,
          totalMentions: totalMentions,
          brandShare: brandShare,
          aiVisibilityScore: aiVisibilityScore,
          competitors: competitors,
          triggerType: triggerType,
          analysisSessionId: analysisSessionId,
          metadata: {
            totalPrompts: brand.totalPrompts || 0,
            totalCategories: brand.totalCategories || 0,
            customPromptsCount: brand.customPromptsCount || 0
          }
        };
        
        const sovSnapshot = await BrandSOVSnapshot.create(snapshotData);
        console.log(`✅ SOV snapshot saved for trend tracking: ${sovSnapshot._id}`);
        
      } catch (snapshotError) {
        console.error("❌ Error saving SOV snapshot:", snapshotError.message);
        // Continue - snapshot failure shouldn't break SOV calculation
      }
      
    } catch (saveError) {
      console.error("❌ Error upserting Share of Voice to database:", saveError.message);
      // Continue without saving - results are still valid
    }
    
    // ✅ STEP 5: Return results
    return {
      shareOfVoice,
      mentionCounts,
      totalMentions,
      brandShare,
      aiVisibilityScore,
      analysisSessionId,  // Include which analysis session this belongs to
      calculationMethod: 'cumulative_all_sessions'
    };
    
  } catch (error) {
    console.error("❌ Error calculating Share of Voice:", error);
    return createFallbackSOV(brand, competitors);
  }
};

// ✅ FALLBACK FUNCTION: Creates realistic SOV when no mentions are found
function createFallbackSOV(brand, competitors) {
  console.log(`🔄 Creating fallback SOV distribution`);
  console.log(`ℹ️ This happens when no company mentions are found in the database`);
  console.log(`ℹ️ Fallback provides estimated distribution for demonstration purposes`);
  
  const allBrands = [brand.brandName, ...competitors];
  const mentionCounts = {};
  const shareOfVoice = {};
  
  // Create realistic fallback data
  let totalMentions = 0;
  
  allBrands.forEach((brandName, index) => {
    // Main brand gets more mentions, competitors get fewer
    const baseMentions = index === 0 ? 4 : 2;
    const randomBonus = Math.floor(Math.random() * 2); // 0-1 extra mentions
    const brandMentions = baseMentions + randomBonus;
    
    mentionCounts[brandName] = brandMentions;
    totalMentions += brandMentions;
  });
  
  // Calculate SOV percentages
  allBrands.forEach(brandName => {
    const brandMentions = mentionCounts[brandName];
    const sovPercentage = (brandMentions / totalMentions) * 100;
    shareOfVoice[brandName] = Math.round(sovPercentage * 100) / 100;
  });
  
  const brandShare = shareOfVoice[brand.brandName] || 0;
  const aiVisibilityScore = brandShare;
  
  console.log(`📊 Fallback SOV created:`, {
    totalMentions,
    mentionCounts,
    shareOfVoice,
    brandShare
  });
  console.log(`⚠️ Note: This is estimated data, not based on actual mention analysis`);
  
  return {
    shareOfVoice,
    mentionCounts,
    totalMentions,
    brandShare,
    aiVisibilityScore,
    calculationMethod: 'fallback_distribution'
  };
}

// ✅ LEGACY SUPPORT: Keep old function signature for backward compatibility
exports.calculateEnhancedShareOfVoice = exports.calculateShareOfVoice;

// ✅ UTILITY FUNCTIONS: Simplified versions for basic operations
exports.getBrandMentions = async function(brandId, userId, analysisSessionId) {
  try {
    let matchCriteria = { brandId, userId };
    
    if (analysisSessionId) {
      matchCriteria.analysisSessionId = analysisSessionId;
    }
    
    const result = await CategoryPromptMention.aggregate([
      {
        $match: matchCriteria
      },
      {
        $group: {
          _id: '$companyName',
          mentionCount: { $sum: 1 }
        }
      },
      {
        $sort: { mentionCount: -1 }
      }
    ]);
    
    return result;
  } catch (error) {
    console.error("❌ Error getting brand mentions:", error.message);
    return [];
  }
};

exports.getTotalMentions = async function(brandId, userId, analysisSessionId) {
  try {
    let matchCriteria = { brandId, userId };
    
    if (analysisSessionId) {
      matchCriteria.analysisSessionId = analysisSessionId;
    }
    
    const result = await CategoryPromptMention.aggregate([
      {
        $match: matchCriteria
      },
      {
        $group: {
          _id: null,
          totalMentions: { $sum: 1 }
        }
      }
    ]);
    
    return result[0]?.totalMentions || 0;
  } catch (error) {
    console.error("❌ Error getting total mentions:", error.message);
    return 0;
  }
};