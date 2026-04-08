// aiReviewService.js - Review Analysis (Wrapper around aiService)

const sanitizeHtml = require('sanitize-html');
const {
  analyzeReview: aiAnalyzeReview,
  summarizeWeeklyIssues: aiSummarizeWeeklyIssues,
  fallbackAnalysis,
  getAvailableModels
} = require('./aiService');

// ===============================
// 🎯 ANALYZE REVIEW (Wrapper)
// ===============================
/**
 * Analyze customer review using AI
 * @param {number} rating - Rating 1-5
 * @param {string} comment - Review comment
 * @param {string} preferredModel - 'GROQ' | 'OPENROUTER' | 'AUTO'
 * @returns {Promise<object>} Analysis result
 */
async function analyzeReview(rating, comment, preferredModel = 'AUTO') {
  return await aiAnalyzeReview(rating, comment, preferredModel);
}

// ===============================
// 📊 SUMMARIZE WEEKLY ISSUES (Wrapper)
// ===============================
/**
 * Summarize weekly review issues with strategic insights
 * @param {array} reviews - Array of review objects {rating, comment}
 * @param {string} preferredModel - 'GROQ' | 'OPENROUTER' | 'AUTO'
 * @returns {Promise<string>} HTML summary
 */
async function summarizeWeeklyIssues(reviews, preferredModel = 'AUTO') {
  try {
    // Transform reviews into summary format
    const data = {
      totalReviews: reviews.length,
      sentiment: calculateSentiment(reviews),
      issues: categorizeIssues(reviews)
    };

    const summary = await aiSummarizeWeeklyIssues(reviews, preferredModel);

    // Sanitize HTML for safety
    return sanitizeHtml(summary, {
      allowedTags: ['div', 'p', 'b', 'strong', 'em', 'i', 'br', 'ul', 'li'],
      allowedAttributes: {}
    });

  } catch (err) {
    console.error('[ReviewService] summarizeWeeklyIssues error:', err.message);
    return '<div><p>⚠️ AI tạm thời không khả dụng. Vui lòng thử lại sau.</p></div>';
  }
}

// ===============================
// 📊 CALCULATE SENTIMENT
// ===============================
function calculateSentiment(reviews) {
  const sentiments = {
    Positive: 0,
    Neutral: 0,
    Negative: 0
  };

  for (const review of reviews) {
    const rating = review.rating || 0;
    if (rating >= 4) sentiments.Positive++;
    else if (rating <= 2) sentiments.Negative++;
    else sentiments.Neutral++;
  }

  return sentiments;
}

// ===============================
// 🏷️ CATEGORIZE ISSUES
// ===============================
function categorizeIssues(reviews) {
  const issues = {
    FoodQuality: 0,
    Delivery: 0,
    Store: 0,
    Late: 0
  };

  for (const review of reviews) {
    const comment = (review.comment || '').toLowerCase();
    
    if (comment.includes('nguội') || comment.includes('dở') || comment.includes('chất lượng')) {
      issues.FoodQuality++;
    }
    if (comment.includes('shipper') || comment.includes('giao')) {
      issues.Delivery++;
    }
    if (comment.includes('quán')) {
      issues.Store++;
    }
    if (comment.includes('trễ') || comment.includes('muộn')) {
      issues.Late++;
    }
  }

  return issues;
}

module.exports = {
  analyzeReview,
  summarizeWeeklyIssues,
  getAvailableModels,
  fallbackAnalysis
};