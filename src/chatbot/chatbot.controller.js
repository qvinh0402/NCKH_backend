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

      const reply = await this.chatbotService.processMessage(
        message.trim(),
        finalUserId
      );

      return res.status(200).json({
        success: true,
        data: {
          reply: reply,
          suggestions: [],
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

  // ================================
  // GET /api/chatbot/history/:userId
  // Lấy lịch sử chat (chỉ cho user đã đăng nhập)
  // ================================
  async getHistory(req, res) {
    try {
      const { userId } = req.params;

      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'userId không hợp lệ'
        });
      }

      // Kiểm tra user phải đăng nhập (không phải guest)
      if (userId.startsWith('guest')) {
        return res.status(403).json({
          success: false,
          message: 'Chỉ user đã đăng nhập mới có thể xem lịch sử chat'
        });
      }

      // userId từ params là string, chuyển thành number nếu cần
      const userIdNum = parseInt(userId, 10);
      if (isNaN(userIdNum)) {
        return res.status(400).json({
          success: false,
          message: 'userId không hợp lệ'
        });
      }

      const history = await this.chatbotService.getHistory(userIdNum);

      return res.json({
        success: true,
        data: history,
        meta: {
          total: history.length,
          ttl: '24h'
        }
      });

    } catch (err) {
      console.error('[ChatbotController] getHistory error:', err);
      return res.status(500).json({
        success: false,
        message: 'Lỗi lấy lịch sử'
      });
    }
  }

  // ================================
  // DELETE /api/chatbot/history/:userId
  // Xóa lịch sử chat (chỉ cho user đã đăng nhập)
  // ================================
  async clearHistory(req, res) {
    try {
      const { userId } = req.params;

      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'userId không hợp lệ'
        });
      }

      // Kiểm tra user phải đăng nhập (không phải guest)
      if (userId.startsWith('guest')) {
        return res.status(403).json({
          success: false,
          message: 'Chỉ user đã đăng nhập mới có thể xóa lịch sử chat'
        });
      }

      // userId từ params là string, chuyển thành number
      const userIdNum = parseInt(userId, 10);
      if (isNaN(userIdNum)) {
        return res.status(400).json({
          success: false,
          message: 'userId không hợp lệ'
        });
      }

      await this.chatbotService.clearHistory(userIdNum);

      return res.json({
        success: true,
        message: 'Lịch sử chat đã được xóa'
      });

    } catch (err) {
      console.error('[ChatbotController] clearHistory error:', err);
      return res.status(500).json({
        success: false,
        message: 'Lỗi xóa lịch sử'
      });
    }
  }

  // ================================
  // GET /api/chatbot/conversations/:userId
  // Lấy danh sách các cuộc trò chuyện cũ
  // ================================
  async getConversations(req, res) {
    try {
      const { userId } = req.params;

      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'userId không hợp lệ'
        });
      }

      // Kiểm tra user phải đăng nhập (không phải guest)
      if (userId.startsWith('guest')) {
        return res.status(403).json({
          success: false,
          message: 'Chỉ user đã đăng nhập mới có thể xem lịch sử cuộc trò chuyện'
        });
      }

      // userId từ params là string, chuyển thành number
      const userIdNum = parseInt(userId, 10);
      if (isNaN(userIdNum)) {
        return res.status(400).json({
          success: false,
          message: 'userId không hợp lệ'
        });
      }

      const conversations = await this.chatbotService.getConversations(userIdNum);

      return res.json({
        success: true,
        data: conversations,
        meta: {
          total: conversations.length
        }
      });

    } catch (err) {
      console.error('[ChatbotController] getConversations error:', err);
      return res.status(500).json({
        success: false,
        message: 'Lỗi lấy danh sách cuộc trò chuyện'
      });
    }
  }

  // ================================
  // DELETE /api/chatbot/conversations/:conversationId
  // Xóa một cuộc trò chuyện cụ thể
  // ================================
  async deleteConversation(req, res) {
    try {
      const { conversationId } = req.params;

      if (!conversationId) {
        return res.status(400).json({
          success: false,
          message: 'conversationId không hợp lệ'
        });
      }

      // conversationId từ params là string, chuyển thành number
      const convIdNum = parseInt(conversationId, 10);
      if (isNaN(convIdNum)) {
        return res.status(400).json({
          success: false,
          message: 'conversationId không hợp lệ'
        });
      }

      const success = await this.chatbotService.deleteConversation(convIdNum);

      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy cuộc trò chuyện'
        });
      }

      return res.json({
        success: true,
        message: 'Cuộc trò chuyện đã được xóa'
      });

    } catch (err) {
      console.error('[ChatbotController] deleteConversation error:', err);
      return res.status(500).json({
        success: false,
        message: 'Lỗi xóa cuộc trò chuyện'
      });
    }
  }
}

module.exports = new ChatbotController();
