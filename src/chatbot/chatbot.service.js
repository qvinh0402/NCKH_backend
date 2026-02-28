// Chatbot Service - Xử lý logic chính của chatbot
const scenarios = require('./chatbot.scenarios');

class ChatbotService {
  constructor() {
    this.scenarios = scenarios.scenarios;
    this.userSessions = new Map(); // Lưu trữ session của người dùng
  }

  /**
   * Xử lý tin nhắn từ khách hàng (PUBLIC)
   * @param {string} userMessage - Tin nhắn từ khách hàng
   * @param {string} userId - ID người dùng
   * @returns {Promise<string>} - Phản hồi từ chatbot
   */
  async processMessage(userMessage, userId) {
    const startTime = Date.now();
    try {
      // Lấy hoặc tạo session cho người dùng
      let session = this.userSessions.get(userId);
      if (!session) {
        session = {
          userId,
          orderCart: [],
          totalPrice: 0,
          createdAt: new Date()
        };
        this.userSessions.set(userId, session);
      }

      // Chuẩn hóa tin nhắn
      const normalizedMessage = userMessage.trim();

      // Tìm scenario phù hợp
      for (const scenario of this.scenarios) {
        for (const pattern of scenario.patterns) {
          if (pattern.test(normalizedMessage)) {
            const matchTime = Date.now();
            console.log(`[✅ Chatbot] Matched: ${scenario.name} (${matchTime - startTime}ms)`);
            try {
              const response = await scenario.response(normalizedMessage, session);
              const responseTime = Date.now() - startTime;
              console.log(`[✅ Response] ${scenario.name} (${responseTime}ms)`);
              return response;
            } catch (error) {
              console.error(`[❌ Chatbot] Error in ${scenario.name}:`, error);
              return '❌ Xin lỗi, có lỗi xảy ra khi xử lý yêu cầu của bạn. Vui lòng thử lại!';
            }
          }
        }
      }

      // Nếu không tìm thấy scenario nào
      const noMatchTime = Date.now() - startTime;
      console.log(`[⚠️  Chatbot] No match for: "${normalizedMessage}" (${noMatchTime}ms)`);
      return this.getDefaultResponse();
    } catch (error) {
      console.error('[❌ ChatbotService] Error:', error);
      return '❌ Có lỗi xảy ra. Vui lòng thử lại sau.';
    }
  }

  /**
   * Phản hồi mặc định khi không tìm thấy scenario phù hợp
   */
  getDefaultResponse() {
    return `😊 **Xin lỗi, tôi chưa hiểu yêu cầu của bạn.**\n\n` +
           `Tôi có thể giúp bạn với:\n` +
           `🍕 Xem menu và giá cả\n` +
           `🛒 Đặt hàng\n` +
           `📦 Kiểm tra đơn hàng\n` +
           `🎁 Khuyến mãi & voucher\n` +
           `💬 Khiếu nại & hỗ trợ\n` +
           `⭐ Đánh giá\n\n` +
           `Bạn muốn làm gì? Hãy nói rõ hơn nhé! 😄`;
  }

  /**
   * Lấy thông tin session của người dùng
   */
  getSession(userId) {
    return this.userSessions.get(userId);
  }

  /**
   * Xóa session của người dùng
   */
  clearSession(userId) {
    this.userSessions.delete(userId);
  }

  /**
   * Cập nhật session
   */
  updateSession(userId, data) {
    const session = this.userSessions.get(userId);
    if (session) {
      Object.assign(session, data);
    }
  }

  /**
   * Liệt kê tất cả scenarios (dùng cho debug)
   */
  listScenarios() {
    return this.scenarios.map(s => ({
      name: s.name,
      patterns: s.patterns.map(p => p.source),
      patternCount: s.patterns.length
    }));
  }
};

module.exports = new ChatbotService();
