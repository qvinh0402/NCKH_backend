const express = require('express');
const router = express.Router();
const aiController = require('./ai.controller');

/**
 * AI Service Routes
 * 
 * GET  /api/ai/models              - Get available AI models
 * POST /api/ai/call                - Call AI with prompt
 * POST /api/ai/analyze-review      - Analyze product review
 * POST /api/ai/chatbot-response    - Generate chatbot response
 * POST /api/ai/summarize-reviews   - Summarize multiple reviews
 */

// Get available models
router.get('/models', aiController.getModels);

// Call AI endpoint
router.post('/call', aiController.callAIEndpoint);

// Analyze review
router.post('/analyze-review', aiController.analyzeReviewEndpoint);

// Generate chatbot response
router.post('/chatbot-response', aiController.generateChatbotResponseEndpoint);

// Summarize reviews
router.post('/summarize-reviews', aiController.summarizeReviewsEndpoint);

module.exports = router;
