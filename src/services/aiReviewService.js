// aiReviewService.js

const sanitizeHtml = require('sanitize-html');

// ✅ Model mới 2026
const MODELS = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite'
];

// 🔑 Lấy API key
function getApiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  return key;
}

// 🧠 Gọi Gemini API (v1 + fallback model)
async function callGemini(prompt, apiKey) {
  let lastError;

  for (const model of MODELS) {
    try {
      console.log(`[AI] Trying model: ${model}`);

      const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;

      console.log('[AI] URL:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.warn(`[AI] Model ${model} failed`);
        console.warn(JSON.stringify(data, null, 2));
        lastError = data;
        continue;
      }

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) throw new Error('Empty response');

      console.log(`[AI] Success with model: ${model}`);
      return text;

    } catch (err) {
      lastError = err;
    }
  }

  console.error('[AI] All models failed:', lastError);
  throw new Error('All Gemini models failed');
}

// 🧹 Parse JSON an toàn
function safeParseJSON(text) {
  try {
    let cleaned = text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    if (cleaned.startsWith('json')) {
      cleaned = cleaned.slice(4).trim();
    }

    return JSON.parse(cleaned);
  } catch (err) {
    console.error('[AI] JSON Parse Error:', err);
    console.error('[AI] Raw text:', text);
    return null;
  }
}

// 🧠 PHÂN TÍCH REVIEW
async function analyzeReview(rating, comment) {
  const apiKey = getApiKey();

  const prompt = `
Analyze the following food delivery review.

Rating: ${rating}/5
Comment: "${comment || ''}"

IMPORTANT:
- Return ONLY pure JSON
- Do NOT include markdown or explanation
- Do NOT wrap in \`\`\`

Format:
{
  "Sentiment": "Positive | Negative | Neutral",
  "Severity": "High | Medium | Low | null",
  "FoodIssue": "string | null",
  "DriverIssue": "string | null",
  "StoreIssue": "string | null",
  "OtherIssue": "string | null",
  "MentionLate": true | false
}
`;

  try {
    console.log('[AI] Analyze review...');

    let text = await callGemini(prompt, apiKey);
    let parsed = safeParseJSON(text);

    // 🔁 retry nếu parse fail
    if (!parsed) {
      console.warn('[AI] Retry with stricter prompt...');
      const retryPrompt = prompt + '\nREMEMBER: ONLY JSON.';
      text = await callGemini(retryPrompt, apiKey);
      parsed = safeParseJSON(text);
    }

    if (!parsed) {
      throw new Error('Failed to parse AI response');
    }

    console.log('[AI] Parsed result:', parsed);
    return parsed;

  } catch (err) {
    console.error('[AI] analyzeReview FAILED:', err.message);
    return fallbackAnalysis(rating, comment);
  }
}

// 🛟 FALLBACK khi AI fail
function fallbackAnalysis(rating, comment) {
  const text = (comment || '').toLowerCase();

  return {
    Sentiment: rating >= 4 ? 'Positive' : rating <= 2 ? 'Negative' : 'Neutral',
    Severity: rating <= 2 ? 'Medium' : null,
    FoodIssue: text.includes('ngon') || text.includes('dở') ? comment : null,
    DriverIssue: text.includes('shipper') || text.includes('giao') ? comment : null,
    StoreIssue: text.includes('quán') || text.includes('cửa hàng') ? comment : null,
    OtherIssue: null,
    MentionLate: text.includes('trễ') || text.includes('muộn')
  };
}

// 📊 SUMMARY TUẦN
async function summarizeWeeklyIssues(data) {
  const apiKey = getApiKey();

  const prompt = `
Dựa trên dữ liệu đánh giá sau, hãy viết báo cáo ngắn gọn bằng tiếng Việt:

- Tổng đánh giá: ${data.totalReviews}
- Sentiment: ${JSON.stringify(data.sentiment)}
- Issues: ${JSON.stringify(data.issues)}

Yêu cầu:
- Viết HTML (<h4>, <ul>, <li>, <p>)
- Đưa ra 3 đề xuất cải thiện rõ ràng
- Không dùng markdown
`;

  try {
    let text = await callGemini(prompt, apiKey);

    // 🧹 clean markdown nếu có
    text = text
      .replace(/```html/g, '')
      .replace(/```/g, '')
      .trim();

    // 🔒 chống XSS
    return sanitizeHtml(text, {
      allowedTags: ['h4', 'ul', 'li', 'p', 'b', 'strong']
    });

  } catch (err) {
    console.error('[AI] Summary FAILED:', err.message);
    return '<p>Không thể tạo phân tích AI.</p>';
  }
}

module.exports = {
  analyzeReview,
  summarizeWeeklyIssues
};