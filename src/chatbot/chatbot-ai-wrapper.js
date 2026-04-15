// ============================================
// CHATBOT AI CONTEXT WRAPPER
// Wrapper để thêm menu context vào AI prompts
// ============================================

const { callAI } = require('../services/aiService');
const chatbotAIContext = require('./chatbot-ai-context');

/**
 * Gọi AI với context thực đơn từ database
 * Đảm bảo AI chỉ gợi ý món ăn có trong menu
 * 
 * @param {string} userMessage - Câu hỏi của người dùng
 * @param {string} preferredModel - 'GROQ' | 'OPENROUTER' | 'AUTO'
 * @returns {Promise<string>} Trả lời từ AI
 */
async function callAIWithMenuContext(userMessage, preferredModel = 'AUTO') {
  try {
    if (!userMessage || typeof userMessage !== 'string') {
      throw new Error('User message must be a non-empty string');
    }

    // Lấy context thực đơn từ database
    const menuContext = await chatbotAIContext.buildMenuContext();

    // Tạo prompt với menu context
    const systemPrompt = `
Bạn là một trợ lý chatbot thân thiện cho Secret Pizza, một nhà hàng pizza tại thành phố Hồ Chí Minh, Việt Nam.

${menuContext}

QUYẾT TẮC CHẶT CHẼ:
✅ CHỈ gợi ý món ăn CÓ TRONG THỰC ĐƠN ở trên
✅ Trả lời bằng tiếng Việt, ngắn gọn (2-3 câu)
✅ Thân thiện, hữu ích
✅ Nếu không tìm thấy, hãy gợi ý pizza có sẵn
❌ KHÔNG bịa danh mục, giá cả, hoặc món không có
❌ KHÔNG nói các menu không tồn tại
`;

    // Gọi AI với prompt kèm context
    const reply = await callAI(systemPrompt + '\n\nCâu hỏi từ khách: ' + userMessage, preferredModel, {
      max_tokens: 256,
      temperature: 0.7
    });

    return reply;

  } catch (error) {
    console.error('[ChatbotAIContext] callAIWithMenuContext error:', error.message);
    throw error;
  }
}

/**
 * Gọi AI với context giới hạn hơn - chỉ cho phép gợi ý pizza
 */
async function callAIForPizzaRecommendation(userMessage, preferredModel = 'AUTO') {
  try {
    if (!userMessage || typeof userMessage !== 'string') {
      throw new Error('User message must be a non-empty string');
    }

    const cheapest = await chatbotAIContext.getCheapestPizzas(5);
    const expensive = await chatbotAIContext.getExpensivePizzas(5);

    const cheapestList = cheapest.length > 0
      ? cheapest.map(p => `- ${p.name} (${p.category}): ${p.price.toLocaleString('vi-VN')}đ`).join('\n')
      : "Không có dữ liệu";

    const expensiveList = expensive.length > 0
      ? expensive.map(p => `- ${p.name} (${p.category}): ${p.price.toLocaleString('vi-VN')}đ`).join('\n')
      : "Không có dữ liệu";

    const systemPrompt = `
Bạn là một trợ lý chatbot cho Secret Pizza, chuyên gợi ý pizza.

CHỈ ĐƯỢC GỢI ÝNhững PIZZA NÀY:

📊 PIZZA RẺ NHẤT:
${cheapestList}

📊 PIZZA ĐẮT NHẤT:
${expensiveList}

QUYẾT TẮC:
✅ Chỉ gợi ý pizza từ danh sách trên
✅ Trả lời tiếng Việt, ngắn gọn (2-3 câu)
❌ KHÔNG bịa pizza hoặc giá cả không có

Câu hỏi: ${userMessage}
`;

    const reply = await callAI(systemPrompt, preferredModel, {
      max_tokens: 256,
      temperature: 0.7
    });

    return reply;

  } catch (error) {
    console.error('[ChatbotAIContext] callAIForPizzaRecommendation error:', error.message);
    throw error;
  }
}

module.exports = {
  callAIWithMenuContext,
  callAIForPizzaRecommendation
};
