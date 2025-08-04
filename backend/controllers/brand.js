const OpenAI = require("openai");
const CategorySearchPrompt = require("../models/CategorySearchPrompt");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

exports.analyzeBrand = require("./brand/analyzeBrand").analyzeBrand;
exports.generatePrompts = (req, res) => res.json({ message: "Prompts generated (mock)" });
exports.getCompetitors = (req, res) => res.json({ message: "Competitor insights (mock)" });
exports.getShareOfVoice = (req, res) => res.json({ message: "Share of Voice (mock)" });
exports.getBrandRank = (req, res) => res.json({ message: "Brand rank (mock)" });

// Get user's brands with proper ownership validation
exports.getUserBrands = async (req, res) => {
  try {
    const userId = req.user.id;
    const { getUserBrands } = require("../utils/brandValidation");
    
    const brands = await getUserBrands(userId);
    
    res.json({
      success: true,
      brands: brands.map(brand => ({
        id: brand._id,
        name: brand.brandName,
        domain: brand.domain,
        createdAt: brand.createdAt
      }))
    });
  } catch (error) {
    console.error("❌ Error fetching user brands:", error);
    res.status(500).json({ msg: "Failed to fetch user brands", error: error.message });
  }
};

// Get user's categories with proper ownership validation
exports.getUserCategories = async (req, res) => {
  try {
    const userId = req.user.id;
    const { getUserCategories } = require("../utils/brandValidation");
    
    const categories = await getUserCategories(userId);
    
    res.json({
      success: true,
      categories: categories.map(category => ({
        id: category._id,
        name: category.categoryName,
        brandId: category.brandId._id,
        brandName: category.brandId.brandName,
        domain: category.brandId.domain,
        createdAt: category.createdAt
      }))
    });
  } catch (error) {
    console.error("❌ Error fetching user categories:", error);
    res.status(500).json({ msg: "Failed to fetch user categories", error: error.message });
  }
};

// Get prompts for a specific category
exports.getCategoryPrompts = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const userId = req.user.id;
    
    console.log(`🔍 Fetching prompts for categoryId: ${categoryId} for user: ${userId}`);
    
    if (!categoryId) {
      console.log('❌ Category ID is missing');
      return res.status(400).json({ msg: "Category ID is required" });
    }

    // Check if categoryId is a valid ObjectId
    if (!require('mongoose').Types.ObjectId.isValid(categoryId)) {
      console.log('❌ Invalid ObjectId format:', categoryId);
      return res.status(400).json({ msg: "Invalid category ID format" });
    }

    // Validate category ownership using utility function
    const { validateCategoryOwnership } = require("../utils/brandValidation");
    const category = await validateCategoryOwnership(userId, categoryId);

    if (!category) {
      return res.status(403).json({ msg: "Access denied: You don't have permission to access this category" });
    }

    // Now fetch prompts for the verified category
    const CategorySearchPrompt = require("../models/CategorySearchPrompt");
    const prompts = await CategorySearchPrompt.find({ categoryId })
      .sort({ createdAt: 1 })
      .limit(5);

    console.log(`✅ Found ${prompts.length} prompts for category ${categoryId}`);
    console.log('Prompts:', prompts.map(p => ({ id: p._id, text: p.promptText.substring(0, 50) + '...' })));
    
    res.json({
      prompts,
      category: {
        id: category._id,
        name: category.categoryName,
        brandName: category.brandId.brandName,
        domain: category.brandId.domain
      }
    });
  } catch (error) {
    console.error("❌ Error fetching category prompts:", error);
    res.status(500).json({ msg: "Failed to fetch category prompts", error: error.message });
  }
};