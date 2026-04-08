// aiService.js - Unified AI Service Supporting Multiple Models

// Load environment variables
require('dotenv').config();

// ===============================
// 📋 LOAD API KEYS FROM .ENV
// ===============================
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// ===============================
// 🧠 AI MODELS CONFIGURATION
// ===============================
const AI_MODELS = {
  GROQ: {
    provider: 'groq',
    apiKey: GROQ_API_KEY,
    baseUrl: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.3-70b-versatile',
    config: {
      temperature: 0.7,
      top_p: 0.9,
      max_tokens: 1024
    }
  },
  OPENROUTER: {
    provider: 'openrouter',
    apiKey: OPENROUTER_API_KEY,
    baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'meta-llama/llama-3.1-8b-instruct:free',
    config: {
      temperature: 0.7,
      max_tokens: 1024
    }
  }
};

// ===============================
// 🔍 AVAILABLE MODELS LIST
// ===============================
function getAvailableModels() {
  const available = [];
  
  for (const [key, config] of Object.entries(AI_MODELS)) {
    if (config.apiKey) {
      available.push({
        name: key,
        provider: config.provider,
        model: config.model,
        status: '✅ Available'
      });
    } else {
      available.push({
        name: key,
        provider: config.provider,
        model: config.model,
        status: '❌ Missing API Key'
      });
    }
  }
  
  return available;
}

// ===============================
// 📤 CALL GROQ
// ===============================
async function callGroq(prompt, options = {}) {
  const config = AI_MODELS.GROQ;
  
  if (!config.apiKey) {
    throw new Error('GROQ_API_KEY is not configured in .env');
  }

  console.log('[AI] Calling Groq...');

  const response = await fetch(config.baseUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: 'user', content: prompt }],
      ...config.config,
      ...options
    })
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('[AI] Groq error:', data);
    throw new Error(`Groq Error: ${data?.error?.message || 'Unknown error'}`);
  }

  const text = data?.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error('Empty response from Groq');
  }

  console.log('[AI] ✅ Groq success');
  return text;
}

// ===============================
// 📤 CALL OPENROUTER
// ===============================
async function callOpenRouter(prompt, options = {}) {
  const config = AI_MODELS.OPENROUTER;
  
  if (!config.apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured in .env');
  }

  console.log('[AI] Calling OpenRouter...');

  const response = await fetch(config.baseUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3001',
      'X-Title': 'NCKH Pizza'
    },
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: 'user', content: prompt }],
      ...config.config,
      ...options
    })
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('[AI] OpenRouter error:', data);
    throw new Error(`OpenRouter Error: ${data?.error?.message || 'Unknown error'}`);
  }

  const text = data?.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error('Empty response from OpenRouter');
  }

  console.log('[AI] ✅ OpenRouter success');
  return text;
}

// ===============================
// 🔄 CALL AI WITH FALLBACK
// ===============================
/**
 * Call AI with automatic fallback to backup providers
 * @param {string} prompt - The prompt to send
 * @param {string} preferredModel - Preferred model: 'GROQ' | 'OPENROUTER' | 'AUTO'
 * @param {object} options - Additional options to pass to the API
 * @returns {Promise<string>} AI response text
 */
async function callAI(prompt, preferredModel = 'AUTO', options = {}) {
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('Prompt must be a non-empty string');
  }

  const providers = [];

  // Determine order of providers based on preference
  if (preferredModel === 'GROQ') {
    providers.push('GROQ', 'OPENROUTER');
  } else if (preferredModel === 'OPENROUTER') {
    providers.push('OPENROUTER', 'GROQ');
  } else {
    // AUTO: Try GROQ first (usually faster), then fallback
    providers.push('GROQ', 'OPENROUTER');
  }

  let lastError = null;

  for (const provider of providers) {
    try {
      if (provider === 'GROQ') {
        return await callGroq(prompt, options);
      } else if (provider === 'OPENROUTER') {
        return await callOpenRouter(prompt, options);
      }
    } catch (error) {
      console.warn(`[AI] ${provider} failed:`, error.message);
      lastError = error;
      // Continue to next provider
    }
  }

  // All providers failed
  console.error('[AI] ❌ All AI providers failed');
  throw new Error(lastError?.message || 'All AI providers are unavailable');
}

// ===============================
// 🧹 SAFE JSON PARSE
// ===============================
function safeParseJSON(text) {
  try {
    // Extract JSON from text if it's wrapped in markdown code blocks
    let jsonStr = text;
    
    const jsonMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }
    
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error('[AI] JSON parse error:', err.message);
    return null;
  }
}

// ===============================
// 🎯 ANALYZE REVIEW
// ===============================
async function analyzeReview(rating, comment, preferredModel = 'AUTO') {
  const prompt = `
Phân tích chi tiết nhận xét khách hàng về dịch vụ giao hàng thực phẩm.

Rating: ${rating}/5
Nhận xét: "${comment || '(không có nhận xét)'}"

HƯỚNG DẪN:
- Trả về JSON thuần, không markdown hay giải thích
- Phân tích tâm lý: khách hàng muốn nói gì thực sự?
- Xác định vấn đề gốc rễ, không chỉ triệu chứng

JSON format (bắt buộc):
{
  "Sentiment": "Positive | Negative | Neutral",
  "Severity": "High | Medium | Low | null",
  "Root": "gốc rễ vấn đề chính (tiếng Việt) | null",
  "FoodIssue": "chất lượng thức ăn | null",
  "DriverIssue": "vấn đề shipper/giao hàng | null",
  "StoreIssue": "vấn đề quán ăn | null",
  "MentionLate": true | false,
  "Suggestion": "đề xuất cải thiện 1-2 từ | null"
}
`;

  try {
    const response = await callAI(prompt, preferredModel);
    const analysis = safeParseJSON(response);
    
    if (!analysis) {
      console.warn('[AI] Failed to parse analysis response, using fallback');
      return fallbackAnalysis(rating, comment);
    }

    return analysis;
  } catch (error) {
    console.error('[AI] analyzeReview error:', error.message);
    return fallbackAnalysis(rating, comment);
  }
}

// ===============================
// 🛟 FALLBACK LOCAL ANALYSIS
// ===============================
function fallbackAnalysis(rating, comment) {
  const text = (comment || '').toLowerCase();

  return {
    Sentiment: rating >= 4 ? 'Positive' : rating <= 2 ? 'Negative' : 'Neutral',
    Severity: rating <= 2 ? 'Medium' : null,
    Root: text.includes('chất lượng') ? 'Vấn đề chất lượng' : null,
    FoodIssue: text.includes('nguội') || text.includes('dở') ? comment : null,
    DriverIssue: text.includes('shipper') || text.includes('giao') ? comment : null,
    StoreIssue: text.includes('quán') ? comment : null,
    MentionLate: text.includes('trễ') || text.includes('muộn'),
    Suggestion: null
  };
}

// ===============================
// 📊 SUMMARIZE WEEKLY ISSUES
// ===============================
async function summarizeWeeklyIssues(reviews, preferredModel = 'AUTO') {
  if (!Array.isArray(reviews) || reviews.length === 0) {
    return {
      totalReviews: 0,
      summary: 'No reviews to analyze'
    };
  }

  const reviewsText = reviews
    .map(r => `Rating: ${r.rating}/5 - "${r.comment || 'No comment'}"`)
    .join('\n');

  const prompt = `
Tóm tắt các vấn đề chính từ danh sách đánh giá khách hàng dưới đây (1 tuần):

${reviewsText}

Trả về JSON với:
{
  "totalReviews": số,
  "avgRating": số (2 chữ số thập phân),
  "topIssues": ["vấn đề 1", "vấn đề 2", ...],
  "sentiment": "Positive | Negative | Mixed",
  "actionItems": ["hành động 1", "hành động 2", ...]
}
`;

  try {
    const response = await callAI(prompt, preferredModel);
    const summary = safeParseJSON(response);
    
    if (summary) {
      return {
        totalReviews: reviews.length,
        ...summary
      };
    }

    return {
      totalReviews: reviews.length,
      summary: 'Failed to generate AI summary'
    };
  } catch (error) {
    console.error('[AI] summarizeWeeklyIssues error:', error.message);
    return {
      totalReviews: reviews.length,
      summary: 'AI summary unavailable'
    };
  }
}

// ===============================
// 🔧 GENERATE CHATBOT RESPONSE
// ===============================
async function generateChatbotResponse(userMessage, context = '', preferredModel = 'AUTO') {
  const prompt = `
You are a helpful pizza restaurant chatbot assistant. 
Customer asks: "${userMessage}"

${context ? `Context: ${context}` : ''}

Respond in Vietnamese, be helpful and friendly.
Keep response concise (2-3 sentences max).
`;

  try {
    return await callAI(prompt, preferredModel, {
      max_tokens: 512,
      temperature: 0.8
    });
  } catch (error) {
    console.error('[AI] generateChatbotResponse error:', error.message);
    return 'Xin lỗi, tôi đang gặp vấn đề. Vui lòng thử lại sau.';
  }
}

// ===============================
// 📤 EXPORTS
// ===============================
module.exports = {
  // Main functions
  callAI,
  callGroq,
  callOpenRouter,
  
  // Analysis functions
  analyzeReview,
  summarizeWeeklyIssues,
  generateChatbotResponse,
  
  // Utilities
  safeParseJSON,
  fallbackAnalysis,
  getAvailableModels,
  
  // Models configuration
  AI_MODELS
};
