// Chatbot Controller - Xử lý request từ client
const chatbotService = require('./chatbot.service');

class ChatbotController {
  constructor() {
    this.chatbotService = chatbotService;
  }

  /**
   * POST /api/chatbot/message
   * Gửi tin nhắn đến chatbot (PUBLIC)
   */
  async sendMessage(req, res) {
    try {
      const { message, userId } = req.body;

      // Kiểm tra dữ liệu đầu vào
      if (!message || !message.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Tin nhắn không được để trống'
        });
      }

      // Nếu không có userId, sinh một cái tạm thời
      const finalUserId = userId || `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      console.log(`[ChatbotController] Message from ${finalUserId}: "${message}"`);

      // Xử lý tin nhắn
      const response = await chatbotService.processMessage(message, finalUserId);

      res.json({
        success: true,
        message: response,
        userId: finalUserId,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('[ChatbotController] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra. Vui lòng thử lại sau.'
      });
    }
  }

  /**
   * GET /api/chatbot/session/:userId
   * Lấy thông tin session (giỏ hàng) hiện tại (PUBLIC)
   */
  async getSession(req, res) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'Cần cung cấp userId'
        });
      }

      const session = chatbotService.getSession(userId);

      res.json({
        success: true,
        session: session || { orderCart: [], totalPrice: 0 }
      });
    } catch (error) {
      console.error('[ChatbotController] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra'
      });
    }
  }

  /**
   * DELETE /api/chatbot/session/:userId
   * Xóa session (giỏ hàng)
   */
  async clearSession(req, res) {
    try {
      const { userId } = req.params;
      chatbotService.clearSession(userId);

      res.json({
        success: true,
        message: 'Giỏ hàng đã được xóa'
      });
    } catch (error) {
      console.error('[ChatbotController] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra.'
      });
    }
  }

  /**
   * POST /api/chatbot/checkout
   * Thanh toán đơn hàng từ chatbot (PUBLIC)
   */
  async checkout(req, res) {
    try {
      const { userId, paymentMethod, deliveryAddress } = req.body;

      if (!userId || !paymentMethod) {
        return res.status(400).json({
          success: false,
          message: 'Cần cung cấp userId và paymentMethod'
        });
      }

      const session = chatbotService.getSession(userId);

      if (!session || session.orderCart.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Giỏ hàng rỗng'
        });
      }

      // Tạo mã đơn hàng
      const orderId = `ORD_${Date.now()}`;

      res.json({
        success: true,
        message: `✅ Đơn hàng #${orderId} đã được tạo thành công!`,
        orderId,
        total: session.totalPrice,
        paymentMethod
      });

      // Xóa session sau khi thanh toán
      chatbotService.clearSession(userId);
    } catch (error) {
      console.error('[ChatbotController] Checkout Error:', error);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra trong quá trình thanh toán.'
      });
    }
  }
}

module.exports = new ChatbotController();
