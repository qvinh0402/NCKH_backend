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
// 📊 SUMMARY (FIX NGẮN GỌN)
// ===============================
async function summarizeWeeklyIssues(data) {
const prompt = `
Bạn là chuyên gia phân tích vận hành (Operations Analyst) trong lĩnh vực giao hàng thực phẩm, với hơn 10 năm kinh nghiệm.
Nhiệm vụ của bạn là viết báo cáo Executive Summary cho quản lý cấp cao dựa trên dữ liệu feedback khách hàng.

========================
📊 DỮ LIỆU ĐẦU VÀO
========================
- Tổng số phản hồi: ${data.totalReviews}
- Phân bố cảm xúc: ${JSON.stringify(data.sentiment)}
- Nhóm vấn đề chính: ${JSON.stringify(data.issues)}

========================
📌 YÊU CẦU PHÂN TÍCH
========================

1. 📊 NHẬN ĐỊNH TỔNG THỂ
- Đánh giá mức độ hài lòng chung (tốt / trung bình / kém)
- Xác định xu hướng chính (đang cải thiện hay suy giảm)
- Nêu rõ insight quan trọng nhất (không mô tả lại dữ liệu)

2. 💪 ĐIỂM MẠNH NỔI BẬT
- Xác định 1 yếu tố khách hàng đánh giá tích cực nhất
- Giải thích vì sao đây là lợi thế cạnh tranh

3. ⚠️ VẤN ĐỀ NGHIÊM TRỌNG NHẤT
- Xác định 1 vấn đề có ảnh hưởng lớn nhất
- Phân tích tác động: ảnh hưởng đến trải nghiệm hoặc doanh thu như thế nào
- Nếu có thể, ước lượng tỷ lệ khách bị ảnh hưởng (%)

4. 🎯 HÀNH ĐỘNG ƯU TIÊN (QUAN TRỌNG NHẤT)
- Đưa ra 1 hành động cụ thể, có thể triển khai ngay trong 7 ngày
- Hành động phải rõ ràng, đo lường được (tránh chung chung)
- Ưu tiên giải pháp có tác động trực tiếp đến vấn đề lớn nhất

========================
💡 NGUYÊN TẮC VIẾT
========================
- Không lặp lại số liệu một cách máy móc
- Không dùng từ mơ hồ: "cải thiện", "tăng cường", "nâng cao"
- Viết ngắn gọn nhưng phải có insight (WHY + IMPACT)
- Ưu tiên dùng số liệu (%) nếu suy luận được
- Không dùng dấu "..." hoặc viết dở dang
- Giọng văn chuyên nghiệp, dành cho quản lý (không phải khách hàng)

========================
📌 OUTPUT (HTML BẮT BUỘC)
========================

<div>
  <p><strong>📊 Nhận định:</strong> [2-3 câu có insight]</p>
  <p><strong>💪 Điểm mạnh:</strong> [1-2 câu, có lý do]</p>
  <p><strong>⚠️ Vấn đề:</strong> [1-2 câu, có tác động]</p>
  <p><strong>🎯 Hành động:</strong> [1-2 câu, cụ thể + đo lường được]</p>
</div>
`;

  try {
    let text = await callAI(prompt);

    text = text
      .replace(/\`\`\`html/g, '')
      .replace(/\`\`\`/g, '')
      .trim();

    return sanitizeHtml(text, {
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