const express = require('express');
const router = express.Router();
const { authenticationMiddleware: auth } = require('../middleware/auth');
const superUserAnalysisController = require('../controllers/superUserAnalysis');

// Super User Analysis Routes
// All routes require authentication and super user privileges

// All routes require authentication and super user privileges
router.use(auth);

// POST /api/v1/super-user/analysis/create - Create new isolated analysis
router.post('/create', superUserAnalysisController.createAnalysis);

// POST /api/v1/super-user/analysis/update - Update analysis with step data
router.post('/update', superUserAnalysisController.updateAnalysis);

// POST /api/v1/super-user/analysis/generate-prompts - Generate isolated prompts
router.post('/generate-prompts', superUserAnalysisController.generatePrompts);

// POST /api/v1/super-user/analysis/complete - Complete analysis (Step 4 + final processing)
router.post('/complete', superUserAnalysisController.completeAnalysis);

// POST /api/v1/super-user/analysis/extract-mentions - Extract mentions (Step 5)
router.post('/extract-mentions', superUserAnalysisController.extractMentions);

// POST /api/v1/super-user/analysis/calculate-sov - Calculate Share of Voice (Step 6)
router.post('/calculate-sov', superUserAnalysisController.calculateSOV);

// GET /api/v1/super-user/analysis/history - Get analysis history for super user
router.get('/history', superUserAnalysisController.getAnalysisHistory);

// GET /api/v1/super-user/analysis/:analysisId - Get specific analysis details
router.get('/:analysisId', superUserAnalysisController.getAnalysis);

// GET /api/v1/super-user/analysis/:analysisId/responses - Get AI responses for analysis
router.get('/:analysisId/responses', superUserAnalysisController.getAnalysisResponses);

// GET /api/v1/super-user/analysis/:analysisId/mentions/:brandName - Get brand mentions for analysis
router.get('/:analysisId/mentions/:brandName', superUserAnalysisController.getAnalysisMentions);

// GET /api/v1/super-user/analysis/:analysisId/download-pdf - Download analysis PDF
router.get('/:analysisId/download-pdf', superUserAnalysisController.downloadAnalysisPDF);

// POST /api/v1/super-user/analysis/save-to-history - Save analysis to history
router.post('/save-to-history', superUserAnalysisController.saveToHistory);

// DELETE /api/v1/super-user/analysis/:analysisId/prompts/:promptId - Delete specific prompt
router.delete('/:analysisId/prompts/:promptId', superUserAnalysisController.deletePrompt);

// DELETE /api/v1/super-user/analysis/:analysisId - Delete analysis
router.delete('/:analysisId', superUserAnalysisController.deleteAnalysis);

module.exports = router;