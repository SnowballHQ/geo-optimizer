const BrandProfile = require('../models/BrandProfile');
const BrandShareOfVoice = require('../models/BrandShareOfVoice');
const BrandStrengthScore = require('../models/BrandStrengthScore');
const PromptAIResponse = require('../models/PromptAIResponse');
const BrandCategory = require('../models/BrandCategory');
const CategorySearchPrompt = require('../models/CategorySearchPrompt');

class DomainAnalysisController {
  /**
   * Get comprehensive domain analysis data
   */
  async getDomainAnalysisData(req, res) {
    try {
      const userId = req.user.id;
      
      // Get user's brand profile
      const brand = await BrandProfile.findOne({ ownerUserId: userId });
      if (!brand) {
        return res.status(404).json({ error: 'Brand profile not found' });
      }

      // Check if brandInformation is missing and fetch it if needed
      if (!brand.brandInformation || brand.brandInformation.trim() === '') {
        console.log(`⚠️ Brand ${brand.brandName} is missing brandInformation, fetching from Perplexity...`);
        try {
          const PerplexityService = require('../utils/perplexityService');
          const perplexityService = new PerplexityService();
          const domainInfo = await perplexityService.getDomainInfo(brand.domain);

          if (domainInfo && domainInfo.description) {
            brand.brandInformation = domainInfo.description;
            await brand.save();
            console.log(`✅ Successfully updated brandInformation for ${brand.brandName}`);
          }
        } catch (error) {
          console.error('❌ Error fetching brandInformation:', error);
          // Continue without failing - we'll just have empty description
        }
      }

      // Get all related data with proper nesting
      const [allSoVResults, brandStrength, categories] = await Promise.all([
        BrandShareOfVoice.find({ brandId: brand._id }).sort({ calculatedAt: -1 }),
        BrandStrengthScore.findOne({ brandId: brand._id }),
        BrandCategory.find({ brandId: brand._id })
      ]);

      // Handle multiple SoV records (legacy issue) - use only the most recent one
      let soVResults = [];
      if (allSoVResults.length > 0) {
        // Check if we have the new unified SoV record (single record with all data)
        const unifiedSoVRecord = allSoVResults.find(sov => 
          sov.analysisSessionId && 
          sov.analysisSessionId.startsWith('onboarding_') &&
          Object.keys(sov.shareOfVoice || {}).length > 1 // Has multiple brands
        );
        
        if (unifiedSoVRecord) {
          console.log('✅ Found unified SoV record, using it');
          soVResults = [unifiedSoVRecord];
        } else {
          console.log('⚠️ Found multiple legacy SoV records, using most recent one');
          soVResults = [allSoVResults[0]]; // Most recent
        }
        
        console.log(`📊 Using SoV record: ${soVResults[0]._id} (${soVResults[0].analysisSessionId || 'no session ID'})`);
      }

      // Get prompts for each category and populate with responses
      const categoriesWithPrompts = await Promise.all(
        categories.map(async (category) => {
          const prompts = await CategorySearchPrompt.find({ categoryId: category._id });
          
          // Get responses for each prompt
          const promptsWithResponses = await Promise.all(
            prompts.map(async (prompt) => {
              const responses = await PromptAIResponse.find({ promptId: prompt._id });
              return {
                ...prompt.toObject(),
                responses
              };
            })
          );

          return {
            ...category.toObject(),
            prompts: promptsWithResponses
          };
        })
      );

      // Also get flat arrays for backward compatibility
      const allPrompts = await CategorySearchPrompt.find({ 
        categoryId: { $in: categories.map(cat => cat._id) }
      });
      const allResponses = await PromptAIResponse.find({ 
        promptId: { $in: allPrompts.map(prompt => prompt._id) }
      });

      // Check if SoV calculation is complete
      const soVStatus = soVResults.length > 0 ? 'completed' : 'pending';

      res.json({
        success: true,
        data: {
          brand: {
            _id: brand._id,
            domain: brand.domain,
            brandName: brand.brandName,
            brandInformation: brand.brandInformation,
            targetAudiences: brand.targetAudiences,
            competitors: brand.competitors
          },
          soVResults,
          brandStrength,
          categories: categoriesWithPrompts, // Categories with nested prompts and responses
          prompts: allPrompts, // Flat array for backward compatibility
          responses: allResponses, // Flat array for backward compatibility
          soVStatus
        }
      });

    } catch (error) {
      console.error('Domain analysis data error:', error);
      res.status(500).json({ error: 'Failed to get domain analysis data' });
    }
  }

  /**
   * Get Share of Voice results
   */
  async getShareOfVoice(req, res) {
    try {
      const userId = req.user.id;
      
      const brand = await BrandProfile.findOne({ ownerUserId: userId });
      if (!brand) {
        return res.status(404).json({ error: 'Brand profile not found' });
      }

      const soVResults = await BrandShareOfVoice.find({ 
        brandId: brand._id
      }).sort({ sharePercentage: -1 });

      res.json({
        success: true,
        soVResults
      });

    } catch (error) {
      console.error('Share of Voice error:', error);
      res.status(500).json({ error: 'Failed to get Share of Voice data' });
    }
  }

  /**
   * Get brand strength score
   */
  async getBrandStrength(req, res) {
    try {
      const userId = req.user.id;
      
      const brand = await BrandProfile.findOne({ ownerUserId: userId });
      if (!brand) {
        return res.status(404).json({ error: 'Brand profile not found' });
      }

      const brandStrength = await BrandStrengthScore.findOne({ 
        brandId: brand._id
      });

      res.json({
        success: true,
        brandStrength
      });

    } catch (error) {
      console.error('Brand strength error:', error);
      res.status(500).json({ error: 'Failed to get brand strength data' });
    }
  }

  /**
   * Get AI responses with mention analysis
   */
  async getAIResponses(req, res) {
    try {
      const userId = req.user.id;
      
      const brand = await BrandProfile.findOne({ ownerUserId: userId });
      if (!brand) {
        return res.status(404).json({ error: 'Brand profile not found' });
      }

      // Get responses with prompt and category information
      const responses = await PromptAIResponse.aggregate([
        {
          $lookup: {
            from: 'category_search_prompts',
            localField: 'promptId',
            foreignField: '_id',
            as: 'prompt'
          }
        },
        {
          $lookup: {
            from: 'brand_categories',
            localField: 'prompt.categoryId',
            foreignField: '_id',
            as: 'category'
          }
        },
        {
          $match: {
            'category.brandId': brand._id
          }
        },
        {
          $project: {
            _id: 1,
            responseText: 1,
            responseUrl: 1,
            responseTitle: 1,
            responseSource: 1,
            createdAt: 1,
            'prompt.promptText': 1,
            'category.categoryName': 1,
            brandMentions: {
              $size: {
                $regexFindAll: {
                  input: { $toLower: '$responseText' },
                  regex: brand.brandName.toLowerCase()
                }
              }
            }
          }
        }
      ]);

      res.json({
        success: true,
        responses
      });

    } catch (error) {
      console.error('AI responses error:', error);
      res.status(500).json({ error: 'Failed to get AI responses' });
    }
  }

  /**
   * Check SoV calculation status
   */
  async getSoVStatus(req, res) {
    try {
      const userId = req.user.id;
      
      const brand = await BrandProfile.findOne({ ownerUserId: userId });
      if (!brand) {
        return res.status(404).json({ error: 'Brand profile not found' });
      }

      const soVCount = await BrandShareOfVoice.countDocuments({ 
        brandId: brand._id
      });

      const brandStrength = await BrandStrengthScore.findOne({ 
        brandId: brand._id
      });

      res.json({
        success: true,
        status: {
          soVCalculated: soVCount > 0,
          brandStrengthCalculated: !!brandStrength,
          isComplete: soVCount > 0 && !!brandStrength
        }
      });

    } catch (error) {
      console.error('SoV status error:', error);
      res.status(500).json({ error: 'Failed to get SoV status' });
    }
  }
}

module.exports = new DomainAnalysisController();
