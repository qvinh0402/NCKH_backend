// aiReviewService.js

const sanitizeHtml = require('sanitize-html');

// 🔥 API KEYS
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// 🧠 MODELS (2026 - UPGRADED)
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const OPENROUTER_MODEL = 'meta-llama/llama-3.1-8b-instruct:free';

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
      temperature: 0.7,
      top_p: 0.9,
      max_tokens: 1024
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
    console.log('[AI] Analyzing review...');

    let text = await callAI(prompt);
    let parsed = safeParseJSON(text);

    if (!parsed) {
      console.warn('[AI] Retry with stricter format...');
      text = await callAI(prompt + '\nRETURN ONLY VALID JSON.');
      parsed = safeParseJSON(text);
    }

    if (!parsed) throw new Error('PARSE_FAILED');

    return parsed;

  } catch (err) {
    console.warn('[AI] Using fallback analysis');
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
Bạn là nhà phân tích kinh doanh dịch vụ giao hàng thực phẩm với kinh nghiệm 10 năm.
Hãy viết báo cáo điều hành (Executive Summary) dựa trên feedback khách hàng tuần này:

📊 **DỮ LIỆU PHÂN TÍCH:**
- Tổng phản hồi: ${data.totalReviews} khách
- Cảm xúc: ${JSON.stringify(data.sentiment)} (Positive/Negative/Neutral)
- Vấn đề chính: ${JSON.stringify(data.issues)}

📋 **YÊU CẦU VIẾT (tiếng Việt tự nhiên):**

1. **📊 Nhận định tổng thể** (1-2 câu):
   - Trạng thái chung: khách hàng có hài lòng không?
   - Xu hướng: đang cải thiện hay xấu đi?
   - Ví dụ: "Khách hàng hài lòng với chất lượng pizza, nhưng tốc độ giao hàng còn chậm"

2. **💪 Điểm mạnh chính** (1 điểm):
   - Cái gì khách yêu thích nhất?

3. **⚠️ Thách thức lớn nhất** (1 vấn đề):
   - Cái gì khách than phiền nhất?
   - Tác động kinh tế: mất mấy % khách do vấn đề này?

4. **✅ Hành động ưu tiên** (1 cách làm cụ thể):
   - Giải pháp thực tiễn có thể thực hiện trong tuần này
   - Ví dụ: "Tuyển thêm 3 shipper vào giờ cao điểm" hoặc "Kiểm tra chất lượng trước giao 100%"

💡 **PHONG CÁCH VIẾT:**
- Chuyên nghiệp, ngắn gọn, dễ hiểu
- Tránh từ chung chung như "tăng cường", "cải thiện", "theo dõi"
- Dùng con số khi có thể
- Viết cho ban quản lý, không phải khách hàng

📌 **ĐỊNH DẠNG HTML:**

<div>
  <p><strong>📊 Nhận định:</strong> [2-3 câu]</p>
  <p><strong>💪 Mạnh:</strong> [1-2 câu]</p>
  <p><strong>⚠️ Yếu:</strong> [1-2 câu]</p>
  <p><strong>✅ Hành động:</strong> [1-2 câu cụ thể]</p>
</div>
`;

  try {
    let text = await callAI(prompt);

    text = text
      .replace(/\`\`\`html/g, '')
      .replace(/\`\`\`/g, '')
      .trim();

    return sanitizeHtml(trimSummary(text), {
      allowedTags: ['div', 'p', 'b', 'strong', 'em', 'i']
    });

  } catch (err) {
    console.error('[AI] Summary error:', err.message);
    return '<div><p>⚠️ AI tạm thời không khả dụng. Vui lòng thử lại sau.</p></div>';
  }
}

module.exports = {
  analyzeReview,
  summarizeWeeklyIssues
};