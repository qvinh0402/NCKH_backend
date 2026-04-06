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
Bạn là chuyên gia tư vấn chiến lược (Strategy Consultant) trong ngành giao hàng thực phẩm, với kinh nghiệm phân tích dữ liệu vận hành và tối ưu trải nghiệm khách hàng.

Nhiệm vụ: Viết Executive Summary mang tính phân tích sâu (insight-driven), giúp ban quản lý ra quyết định nhanh.

========================
📊 DỮ LIỆU ĐẦU VÀO
========================
- Tổng số phản hồi: ${data.totalReviews}
- Phân bố cảm xúc: ${JSON.stringify(data.sentiment)}
- Nhóm vấn đề: ${JSON.stringify(data.issues)}

========================
🧠 YÊU CẦU PHÂN TÍCH SÂU
========================

1. 📊 NHẬN ĐỊNH CHIẾN LƯỢC (KEY INSIGHT)
- Không mô tả lại dữ liệu
- Xác định insight quan trọng nhất (1 câu)
- Trả lời: "Điều gì đang thực sự xảy ra?" (WHY)
- Nếu có thể, suy luận xu hướng (tăng/giảm)

2. 🔍 PHÂN TÍCH NGUYÊN NHÂN GỐC (ROOT CAUSE)
- Vấn đề chính đến từ đâu? (Food / Driver / Store / Late)
- Liên hệ logic giữa các vấn đề (ví dụ: giao trễ → đồ ăn nguội → review xấu)
- Không liệt kê — phải giải thích

3. ⚠️ ĐÁNH GIÁ TÁC ĐỘNG (BUSINESS IMPACT)
- Vấn đề ảnh hưởng đến trải nghiệm như thế nào?
- Ước lượng tỷ lệ khách bị ảnh hưởng (% nếu có thể suy luận)
- Ưu tiên tác động đến:
  + Tỷ lệ quay lại (retention)
  + Đánh giá sao (rating)
  + Doanh thu gián tiếp

4. 💪 ĐIỂM TÍCH CỰC CÓ GIÁ TRỊ
- Không chỉ nói "tốt"
- Phải trả lời: tại sao đây là lợi thế cạnh tranh?

5. 🎯 HÀNH ĐỘNG ƯU TIÊN (ACTIONABLE)
- Đưa ra 1 hành động cụ thể nhất
- Có thể triển khai trong 7 ngày
- Có thể đo lường (KPI rõ ràng)
- Ưu tiên xử lý nguyên nhân gốc, không chỉ triệu chứng

========================
💡 NGUYÊN TẮC VIẾT
========================
- Viết như báo cáo cho CEO
- Ngắn gọn nhưng phải có chiều sâu
- Mỗi câu phải có giá trị (insight hoặc quyết định)
- Không dùng từ chung chung: "cải thiện", "tăng cường"
- Không dùng dấu "..."
- Ưu tiên số liệu (%) nếu suy luận được
- Không lặp lại dữ liệu đầu vào

========================
📌 OUTPUT (HTML BẮT BUỘC)
========================

<div>
  <p><strong>📊 Insight chính:</strong> [1-2 câu, trả lời WHY]</p>
  <p><strong>🔍 Nguyên nhân:</strong> [1-2 câu logic cause-effect]</p>
  <p><strong>⚠️ Tác động:</strong> [1-2 câu, có % hoặc ảnh hưởng kinh doanh]</p>
  <p><strong>💪 Điểm mạnh:</strong> [1 câu có giá trị]</p>
  <p><strong>🎯 Hành động:</strong> [1-2 câu, cụ thể + KPI]</p>
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