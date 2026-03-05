// Chatbot Controller - Xử lý request từ client
const chatbotService = require('./chatbot.service');
const crypto = require('crypto');

class ChatbotController {
  constructor() {
    this.chatbotService = chatbotService;
  }

  // ================================
  // Helpers
  // ================================
  generateGuestId() {
    return `guest_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }

  generateOrderId() {
    return `ORD_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  }

  // ================================
  // POST /api/chatbot/message
  // ================================
  async sendMessage(req, res) {
    try {
      const { message, userId } = req.body;

      if (!message || typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Tin nhắn không hợp lệ'
        });
      }

      const finalUserId = userId && typeof userId === 'string'
        ? userId
        : this.generateGuestId();

      console.log(`[Chatbot] ${finalUserId}: ${message}`);

      const response = await this.chatbotService.processMessage(
        message.trim(),
        finalUserId
      );

      return res.status(200).json({
        success: true,
        data: {
          reply: response,
          userId: finalUserId,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('[ChatbotController] sendMessage error:', error);

      return res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra. Vui lòng thử lại sau.'
      });
    }
  }

  // ================================
  // GET /api/chatbot/session/:userId
  // ================================
  async getSession(req, res) {
    try {
      const { userId } = req.params;

      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'userId không hợp lệ'
        });
      }

      const session = this.chatbotService.getSession(userId);

      return res.status(200).json({
        success: true,
        data: session || {
          orderCart: [],
          totalPrice: 0
        }
      });

    } catch (error) {
      console.error('[ChatbotController] getSession error:', error);

      return res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra'
      });
    }
  }

  // ================================
  // DELETE /api/chatbot/session/:userId
  // ================================
  async clearSession(req, res) {
    try {
      const { userId } = req.params;

      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'userId không hợp lệ'
        });
      }

      this.chatbotService.clearSession(userId);

      return res.status(200).json({
        success: true,
        message: 'Giỏ hàng đã được xóa'
      });

    } catch (error) {
      console.error('[ChatbotController] clearSession error:', error);

      return res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra.'
      });
    }
  }

  // ================================
  // POST /api/chatbot/checkout
  // ================================
  async checkout(req, res) {
    try {
      const { userId, paymentMethod, deliveryAddress } = req.body;

      if (!userId || !paymentMethod) {
        return res.status(400).json({
          success: false,
          message: 'Cần cung cấp userId và paymentMethod'
        });
      }

      const session = this.chatbotService.getSession(userId);

      if (!session || !session.orderCart || session.orderCart.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Giỏ hàng rỗng'
        });
      }

      const orderId = this.generateOrderId();

      // TODO: Ở production nên lưu order vào DB tại đây

      // Xóa session sau khi thanh toán thành công
      this.chatbotService.clearSession(userId);

      return res.status(200).json({
        success: true,
        data: {
          orderId,
          total: session.totalPrice,
          paymentMethod,
          deliveryAddress: deliveryAddress || null
        },
        message: `Đơn hàng #${orderId} đã được tạo thành công`
      });

    } catch (error) {
      console.error('[ChatbotController] checkout error:', error);

      return res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra trong quá trình thanh toán.'
      });
    }
  }
}

module.exports = new ChatbotController();