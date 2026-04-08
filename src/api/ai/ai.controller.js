// AI API Controller - Unified endpoint for AI services
const { 
  callAI, 
  analyzeReview, 
  getAvailableModels,
  generateChatbotResponse
} = require('../../services/aiService');

/**
 * GET /api/ai/models
 * Get list of available AI models
 */
const getModels = (req, res) => {
  try {
    const models = getAvailableModels();
    res.json({
      success: true,
      models,
      totalAvailable: models.filter(m => m.status === '✅ Available').length
    });
  } catch (error) {
    console.error('[AI Controller] getModels error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/ai/call
 * Call AI with a prompt
 * Body: { prompt: string, model?: 'GROQ' | 'OPENROUTER' | 'AUTO' }
 */
const callAIEndpoint = async (req, res) => {
  try {
    const { prompt, model = 'AUTO', maxTokens = 512, temperature = 0.7 } = req.body;

    // Validation
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required and must be a string' });
    }

    if (prompt.trim().length === 0) {
      return res.status(400).json({ error: 'Prompt cannot be empty' });
    }

    if (prompt.length > 5000) {
      return res.status(400).json({ error: 'Prompt is too long (max 5000 characters)' });
    }

    // Validate model choice
    const validModels = ['GROQ', 'OPENROUTER', 'AUTO'];
    if (!validModels.includes(model)) {
      return res.status(400).json({ error: `Invalid model. Must be one of: ${validModels.join(', ')}` });
    }

    console.log(`[AI API] Calling ${model} with prompt: "${prompt.substring(0, 50)}..."`);

    const result = await callAI(prompt, model, {
      max_tokens: Math.min(maxTokens, 2048),
      temperature: Math.max(0, Math.min(1, temperature))
    });

    res.json({
      success: true,
      prompt: prompt.substring(0, 100), // Echo first 100 chars
      model,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[AI Controller] callAIEndpoint error:', error.message);

    if (error.message.includes('API Key')) {
      return res.status(500).json({ error: 'AI service not properly configured' });
    }

    if (error.message.includes('All AI providers failed')) {
      return res.status(503).json({ error: 'All AI services are currently unavailable' });
    }

    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * POST /api/ai/analyze-review
 * Analyze a product review
 * Body: { rating: number, comment: string, model?: 'GROQ' | 'OPENROUTER' | 'AUTO' }
 */
const analyzeReviewEndpoint = async (req, res) => {
  try {
    const { rating, comment, model = 'AUTO' } = req.body;

    // Validation
    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be a number between 1 and 5' });
    }

    if (!comment || typeof comment !== 'string' || comment.trim().length === 0) {
      return res.status(400).json({ error: 'Comment is required' });
    }

    console.log(`[AI API] Analyzing review - Rating: ${rating}, Model: ${model}`);

    const analysis = await analyzeReview(rating, comment, model);

    res.json({
      success: true,
      review: {
        rating,
        comment: comment.substring(0, 100)
      },
      analysis,
      model,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[AI Controller] analyzeReviewEndpoint error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to analyze review' });
  }
};

/**
 * POST /api/ai/chatbot-response
 * Generate chatbot response
 * Body: { message: string, context?: string, model?: 'GROQ' | 'OPENROUTER' | 'AUTO' }
 */
const generateChatbotResponseEndpoint = async (req, res) => {
  try {
    const { message, context = '', model = 'AUTO' } = req.body;

    // Validation
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log(`[AI API] Generating chatbot response for: "${message.substring(0, 50)}..."`);

    const response = await generateChatbotResponse(message, context, model);

    res.json({
      success: true,
      message: message.substring(0, 100),
      context: context.substring(0, 50),
      response,
      model,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[AI Controller] generateChatbotResponseEndpoint error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to generate response' });
  }
};

/**
 * POST /api/ai/summarize-reviews
 * Summarize multiple reviews for weekly report
 * Body: { reviews: array of {rating, comment}, model?: string }
 */
const summarizeReviewsEndpoint = async (req, res) => {
  try {
    const { reviews, model = 'AUTO' } = req.body;

    // Validation
    if (!Array.isArray(reviews) || reviews.length === 0) {
      return res.status(400).json({ error: 'Reviews array is required and must not be empty' });
    }

    console.log(`[AI API] Summarizing ${reviews.length} reviews`);

    const { summarizeWeeklyIssues } = require('../../services/aiReviewService');
    const summary = await summarizeWeeklyIssues(reviews, model);

    res.json({
      success: true,
      reviewsCount: reviews.length,
      summary,
      model,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[AI Controller] summarizeReviewsEndpoint error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to summarize reviews' });
  }
};

module.exports = {
  getModels,
  callAIEndpoint,
  analyzeReviewEndpoint,
  generateChatbotResponseEndpoint,
  summarizeReviewsEndpoint
};
