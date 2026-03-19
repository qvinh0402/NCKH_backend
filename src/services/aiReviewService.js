// aiReviewService.js

const DEFAULT_MODEL = 'gemini-1.5-flash';

function getApiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  return key;
}

// 🧠 Gọi Gemini API
async function callGemini(model, prompt, apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('[AI] Gemini Error:', JSON.stringify(data, null, 2));
    throw new Error(data?.error?.message || 'Gemini API error');
  }

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('No response text from Gemini');
  }

  return text;
}

// 🧹 Clean + parse JSON an toàn
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

Return ONLY a valid JSON object:
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

    // 🔁 thử model chính
    let text = await callGemini(DEFAULT_MODEL, prompt, apiKey);
    let parsed = safeParseJSON(text);

    // 🔁 retry nếu parse fail
    if (!parsed) {
      console.warn('[AI] Retry parsing with second call...');
      text = await callGemini(DEFAULT_MODEL, prompt, apiKey);
      parsed = safeParseJSON(text);
    }

    if (!parsed) {
      throw new Error('Failed to parse AI response');
    }

    console.log('[AI] Parsed result:', parsed);

    return parsed;

  } catch (err) {
    console.error('[AI] analyzeReview FAILED:', err.message);

    // 🎯 fallback logic (không dùng AI)
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
- 3 đề xuất cải thiện rõ ràng
`;

  try {
    const text = await callGemini(DEFAULT_MODEL, prompt, apiKey);

    return text
      .replace(/```html/g, '')
      .replace(/```/g, '')
      .trim();

  } catch (err) {
    console.error('[AI] Summary FAILED:', err.message);
    return '<p>Không thể tạo phân tích AI.</p>';
  }
}

module.exports = {
  analyzeReview,
  summarizeWeeklyIssues
};