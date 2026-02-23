// Chatbot Controller - Xử lý request từ client
const chatbotService = require('./chatbot.service');

class ChatbotController {
  constructor() {
    this.chatbotService = chatbotService;
  }

  /**
   * POST /api/chatbot/message
   * Gửi tin nhắn đến chatbot
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

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'Cần cung cấp userId'
        });
      }

      console.log(`[ChatbotController] Processing message from user ${userId}: "${message}"`);

      // Xử lý tin nhắn
      const response = await chatbotService.processMessage(message, userId);

      res.json({
        success: true,
        message: response,
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
   * Lấy thông tin session (giỏ hàng) hiện tại
   */
  async getSession(req, res) {
    try {
      const { userId } = req.params;
      const session = chatbotService.getSession(userId);

      if (!session) {
        return res.json({
          success: true,
          session: {
            orderCart: [],
            totalPrice: 0
          }
        });
      }

      res.json({
        success: true,
        session: {
          orderCart: session.orderCart,
          totalPrice: session.totalPrice
        }
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
   * Thanh toán đơn hàng từ chatbot
   */
  async checkout(req, res) {
    try {
      const { userId, paymentMethod, deliveryAddress } = req.body;
      const session = chatbotService.getSession(userId);

      if (!session || !session.orderCart.length) {
        return res.status(400).json({
          success: false,
          message: 'Giỏ hàng trống'
        });
      }

      if (!paymentMethod || !deliveryAddress) {
        return res.status(400).json({
          success: false,
          message: 'Cần cung cấp phương thức thanh toán và địa chỉ giao'
        });
      }

      // TODO: Tạo đơn hàng trong database
      // Giả lập tạo đơn
      const orderId = Math.floor(Math.random() * 10000);

      res.json({
        success: true,
        message: `✅ Đơn hàng #${orderId} đã được tạo thành công!`,
        orderId,
        total: session.totalPrice
      });

      // Xóa session sau khi thanh toán
      chatbotService.clearSession(userId);
    } catch (error) {
      console.error('[ChatbotController] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra trong quá trình thanh toán.'
      });
    }
  }
}

module.exports = new ChatbotController();
