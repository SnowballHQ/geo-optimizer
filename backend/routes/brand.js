const express = require("express");
const router = express.Router();
const { authenticationMiddleware: auth } = require("../middleware/auth");
const brandController = require("../controllers/brand");
const mentionController = require("../controllers/brand/mentionController");
const pdfController = require("../controllers/brand/pdfController");

// Brand analysis endpoints
router.post("/analyze", auth, brandController.analyzeBrand);
router.get("/analysis/:brandId", auth, brandController.getBrandAnalysis);

// User data endpoints with proper ownership validation
router.get("/user/brands", auth, brandController.getUserBrands);
router.get("/user/categories", auth, brandController.getUserCategories);

// Category prompts endpoint
router.get("/categories/:categoryId/prompts", auth, brandController.getCategoryPrompts);

// Prompt response endpoint
router.get("/prompts/:promptId/response", auth, brandController.getPromptResponse);

// Custom prompt endpoints
router.post("/prompts/custom", auth, brandController.addCustomPrompt);
router.post("/prompts/enhance", auth, brandController.enhancePrompt);
router.post("/prompts/:promptId/generate", auth, brandController.generateCustomResponse);

// Debug endpoint
router.get("/debug/ai-responses", auth, brandController.debugAIResponses);

// Super User endpoints
router.get("/super-user/history", auth, pdfController.getSuperUserAnalysisHistory);
router.get("/:brandId/download-pdf", auth, pdfController.downloadBrandAnalysisPDF);

// Blog analysis endpoints
router.get("/:brandId/blogs", auth, brandController.getBlogAnalysis);
router.post("/:brandId/blogs/score", auth, brandController.scoreSingleBlog);
router.get("/:brandId/blogs/scores", auth, brandController.getBlogScores);

// Blog extraction endpoint (separate from main analysis)
router.post("/extract-blogs", auth, brandController.extractBlogs);

// Blog analysis trigger for domain analysis
router.post("/:brandId/trigger-blog-analysis", auth, brandController.triggerBlogAnalysis);

// Create minimal brand profile for blog analysis (without full analysis)
router.post("/create-minimal-brand", auth, brandController.createMinimalBrand);

// Extract categories from AI (without saving to database)
router.post("/extract-categories", auth, brandController.extractCategories);

// Add competitor to brand
router.post("/:brandId/competitors", auth, brandController.addCompetitor);

// Delete competitor from brand
router.delete("/:brandId/competitors/:competitorName", auth, brandController.deleteCompetitor);

// SOV trend data for charts
router.get("/:brandId/sov-trends", auth, brandController.getSOVTrends);

// Manual rerun analysis button
router.post("/:brandId/rerun-analysis", auth, brandController.rerunAnalysis);

// Get AI responses for a brand
router.get("/:brandId/responses", auth, brandController.getBrandResponses);

// Mention extraction and analysis endpoints
router.post("/:brandId/mentions/process", auth, mentionController.processBrandMentions);
router.get("/:brandId/mentions/companies", auth, mentionController.getUniqueCompanies);
router.get("/:brandId/mentions/stats", auth, mentionController.getMentionStats);
router.get("/mentions/company/:companyName", auth, mentionController.getCompanyMentions);
router.get("/mentions/category/:categoryId", auth, mentionController.getMentionsByCategory);
router.get("/mentions/search", auth, mentionController.searchMentions);

module.exports = router;