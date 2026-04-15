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
    // Validate reviews is an array
    if (!Array.isArray(reviews)) {
      console.error('[ReviewService] Reviews must be an array, got:', typeof reviews);
      return '<div><p>⚠️ Dữ liệu không hợp lệ. Vui lòng thử lại sau.</p></div>';
    }

    if (reviews.length === 0) {
      return '<div><p>📊 Không có đánh giá nào trong tuần này.</p></div>';
    }

    // Call AI service to get summary
    const summary = await aiSummarizeWeeklyIssues(reviews, preferredModel);

    // Convert summary object to HTML
    if (!summary || typeof summary !== 'object') {
      console.error('[ReviewService] Invalid summary format:', typeof summary);
      return '<div><p>⚠️ Không thể tạo tóm tắt. Vui lòng thử lại sau.</p></div>';
    }

    // Build HTML from summary object
    let html = '<div style="padding: 15px; background: #f5f5f5; border-radius: 8px;">';
    
    html += `<h3>📊 Tóm Tắt Đánh Giá Tuần (${summary.totalReviews || 0} đánh giá)</h3>`;
    
    if (summary.avgRating) {
      html += `<p><strong>Đánh giá trung bình:</strong> ⭐ ${summary.avgRating}/5</p>`;
    }
    
    if (summary.sentiment) {
      html += `<p><strong>Cảm xúc chung:</strong> ${summary.sentiment}</p>`;
    }
    
    if (summary.topIssues && Array.isArray(summary.topIssues) && summary.topIssues.length > 0) {
      html += '<p><strong>🎯 Vấn đề chính:</strong></p><ul>';
      summary.topIssues.forEach(issue => {
        html += `<li>${issue}</li>`;
      });
      html += '</ul>';
    }
    
    if (summary.actionItems && Array.isArray(summary.actionItems) && summary.actionItems.length > 0) {
      html += '<p><strong>✅ Hành động đề xuất:</strong></p><ul>';
      summary.actionItems.forEach(action => {
        html += `<li>${action}</li>`;
      });
      html += '</ul>';
    }
    
    html += '</div>';

    // Sanitize HTML for safety
    return sanitizeHtml(html, {
      allowedTags: ['div', 'h3', 'p', 'b', 'strong', 'em', 'i', 'br', 'ul', 'li'],
      allowedAttributes: { div: ['style'] }
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
  if (!Array.isArray(reviews) || reviews.length === 0) {
    return { Positive: 0, Neutral: 0, Negative: 0 };
  }

  const sentiments = {
    Positive: 0,
    Neutral: 0,
    Negative: 0
  };

  for (const review of reviews) {
    const rating = review?.rating || 0;
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
  if (!Array.isArray(reviews) || reviews.length === 0) {
    return { FoodQuality: 0, Delivery: 0, Store: 0, Late: 0 };
  }

  const issues = {
    FoodQuality: 0,
    Delivery: 0,
    Store: 0,
    Late: 0
  };

  for (const review of reviews) {
    const comment = (review?.comment || '').toLowerCase();
    
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