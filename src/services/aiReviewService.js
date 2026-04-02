// aiReviewService.js

const sanitizeHtml = require('sanitize-html');

// 🔥 API KEYS
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// 🧠 MODELS (2026 OK)
const GROQ_MODEL = 'llama-3.1-8b-instant';
const OPENROUTER_MODEL = 'meta-llama/llama-3-8b-instruct:free';

// ===============================
// 🧠 CALL GROQ (MAIN)
// ===============================
async function callGroq(prompt) {
  if (!GROQ_API_KEY) throw new Error('NO_GROQ_KEY');

  console.log('[AI] Trying Groq...');

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2
    })
  });

  const data = await response.json();

  if (!response.ok) {
    console.warn('[AI] Groq failed:', data);
    throw new Error('GROQ_FAILED');
  }

  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('EMPTY_GROQ');

  console.log('[AI] Groq success');
  return text;
}

// ===============================
// 🧠 CALL OPENROUTER (BACKUP)
// ===============================
async function callOpenRouter(prompt) {
  if (!OPENROUTER_API_KEY) throw new Error('NO_OPENROUTER_KEY');

  console.log('[AI] Trying OpenRouter...');

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  const data = await response.json();

  if (!response.ok) {
    console.warn('[AI] OpenRouter failed:', data);
    throw new Error('OPENROUTER_FAILED');
  }

  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('EMPTY_OPENROUTER');

  console.log('[AI] OpenRouter success');
  return text;
}

// ===============================
// 🧠 CALL AI (MULTI PROVIDER)
// ===============================
async function callAI(prompt) {
  try {
    return await callGroq(prompt);
  } catch (err1) {
    console.warn('[AI] Groq failed → fallback OpenRouter');

    try {
      return await callOpenRouter(prompt);
    } catch (err2) {
      console.error('[AI] All AI failed');
      throw new Error('ALL_AI_FAILED');
    }
  }
}

// ===============================
// 🧹 SAFE JSON PARSE
// ===============================
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

// ===============================
// 🧠 ANALYZE REVIEW
// ===============================
async function analyzeReview(rating, comment) {
  const prompt = `
Analyze the following food delivery review.

Rating: ${rating}/5
Comment: "${comment || ''}"

IMPORTANT:
- Return ONLY pure JSON
- No markdown
- No explanation

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

    let text = await callAI(prompt);
    let parsed = safeParseJSON(text);

    if (!parsed) {
      console.warn('[AI] Retry...');
      text = await callAI(prompt + '\nONLY JSON.');
      parsed = safeParseJSON(text);
    }

    if (!parsed) throw new Error('PARSE_FAILED');

    return parsed;

  } catch (err) {
    console.warn('[AI] Using fallbackAnalysis');
    return fallbackAnalysis(rating, comment);
  }
}

// ===============================
// 🛟 FALLBACK LOCAL
// ===============================
function fallbackAnalysis(rating, comment) {
  const text = (comment || '').toLowerCase();

  return {
    Sentiment: rating >= 4 ? 'Positive' : rating <= 2 ? 'Negative' : 'Neutral',
    Severity: rating <= 2 ? 'Medium' : null,
    FoodIssue: text.includes('nguội') || text.includes('dở') ? comment : null,
    DriverIssue: text.includes('shipper') || text.includes('giao') ? comment : null,
    StoreIssue: text.includes('quán') ? comment : null,
    OtherIssue: null,
    MentionLate: text.includes('trễ') || text.includes('muộn')
  };
}

// ===============================
// ✂️ TRIM SUMMARY (chống dài)
// ===============================
function trimSummary(html) {
  const maxLength = 400;
  return html.length > maxLength ? html.slice(0, maxLength) + '...' : html;
}

// ===============================
// 📊 SUMMARY (FIX NGẮN GỌN)
// ===============================
async function summarizeWeeklyIssues(data) {
  const prompt = `
Dựa trên dữ liệu đánh giá, hãy viết báo cáo NGẮN GỌN bằng tiếng Việt.

Dữ liệu:
- Tổng: ${data.totalReviews}
- Sentiment: ${JSON.stringify(data.sentiment)}
- Issues: ${JSON.stringify(data.issues)}

YÊU CẦU:
- KHÔNG lặp lại số liệu
- Chỉ nêu insight quan trọng
- Tối đa 1-2 dòng mô tả
- Tối đa 2 đề xuất
- Ngắn gọn, dễ đọc

FORMAT HTML:
<h4>Nhận định</h4>
<p>...</p>

<h4>Đề xuất</h4>
<ul>
  <li>...</li>
  <li>...</li>
</ul>
`;

  try {
    let text = await callAI(prompt);

    text = text
      .replace(/```html/g, '')
      .replace(/```/g, '')
      .trim();

    return sanitizeHtml(trimSummary(text), {
      allowedTags: ['h4', 'ul', 'li', 'p', 'b', 'strong']
    });

  } catch (err) {
    return '<p>⚠️ AI tạm thời không khả dụng.</p>';
  }
}

module.exports = {
  analyzeReview,
  summarizeWeeklyIssues
};