// Chatbot Repository - Xử lý tất cả database operations

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class ChatbotRepository {
  constructor() {
    this.HISTORY_TTL_MS = 24 * 60 * 60 * 1000; // 24 giờ
    this.MAX_HISTORY = 100; // Max tin nhắn mỗi user
    
    // Cleanup expired messages mỗi 1 giờ
    this.startCleanupTask();
  }

  // ============================================
  // CLEANUP TASK - Xóa tin nhắn hết hạn
  // ============================================

  startCleanupTask() {
    setInterval(() => {
      this.cleanupExpiredMessages();
    }, 60 * 60 * 1000); // 1 giờ
  }

  async cleanupExpiredMessages() {
    try {
      // Xóa tin nhắn hết hạn
      const result = await prisma.chatHistory.deleteMany({
        where: {
          HetHan: {
            lt: new Date()
          }
        }
      });

      // Xóa cuộc trò chuyện hết hạn
      await prisma.chatConversation.deleteMany({
        where: {
          HetHan: {
            lt: new Date()
          }
        }
      });

      if (result.count > 0) {
        console.log(`[ChatCleanup] Đã xóa ${result.count} tin nhắn hết hạn`);
      }
    } catch (error) {
      console.error('[ChatCleanup] Error:', error.message);
    }
  }

  // ============================================
  // CHAT HISTORY OPERATIONS
  // ============================================

  /**
   * Lưu tin nhắn vào database
   * @param {number} userId - ID người dùng
   * @param {string} from - "user" hoặc "bot"
   * @param {string} text - Nội dung tin nhắn
   * @returns {Promise<Object>} Tin nhắn đã lưu
   */
  async saveMessage(userId, from, text) {
    try {
      if (!userId || ![' user', 'bot'].includes(from) || !text) {
        console.warn('[ChatRepository] Invalid message data');
        return null;
      }

      const now = new Date();
      const expiryTime = new Date(now.getTime() + this.HISTORY_TTL_MS);

      const message = await prisma.chatHistory.create({
        data: {
          MaTaiKhoan: userId,
          LoaiTinNhan: from,
          NoiDung: text,
          ThoiGian: now,
          HetHan: expiryTime,
          TrangThai: 'Active'
        }
      });

      return {
        id: message.MaChatHistory,
        from: message.LoaiTinNhan,
        text: message.NoiDung,
        timestamp: message.ThoiGian
      };
    } catch (error) {
      console.error('[ChatRepository] saveMessage error:', error.message);
      return null;
    }
  }

  /**
   * Lấy lịch sử chat của user (chỉ tin còn hạn)
   * @param {number} userId - ID người dùng
   * @param {number} limit - Số tin nhắn tối đa
   * @returns {Promise<Array>} Danh sách tin nhắn
   */
  async getHistory(userId, limit = this.MAX_HISTORY) {
    try {
      if (!userId) return [];

      const now = new Date();

      const messages = await prisma.chatHistory.findMany({
        where: {
          MaTaiKhoan: userId,
          TrangThai: 'Active',
          HetHan: {
            gt: now // Chỉ lấy tin chưa hết hạn
          }
        },
        orderBy: {
          ThoiGian: 'asc'
        },
        take: limit
      });

      return messages.map(m => ({
        id: m.MaChatHistory,
        from: m.LoaiTinNhan,
        text: m.NoiDung,
        timestamp: m.ThoiGian
      }));
    } catch (error) {
      console.error('[ChatRepository] getHistory error:', error.message);
      return [];
    }
  }

  /**
   * Xóa tất cả lịch sử chat của user
   * @param {number} userId - ID người dùng
   * @returns {Promise<number>} Số tin nhắn đã xóa
   */
  async clearHistory(userId) {
    try {
      if (!userId) return 0;

      const result = await prisma.chatHistory.deleteMany({
        where: {
          MaTaiKhoan: userId
        }
      });

      return result.count;
    } catch (error) {
      console.error('[ChatRepository] clearHistory error:', error.message);
      return 0;
    }
  }

  /**
   * Xóa một tin nhắn cụ thể
   * @param {number} messageId - ID tin nhắn
   * @returns {Promise<boolean>}
   */
  async deleteMessage(messageId) {
    try {
      if (!messageId) return false;

      await prisma.chatHistory.delete({
        where: {
          MaChatHistory: messageId
        }
      });

      return true;
    } catch (error) {
      console.error('[ChatRepository] deleteMessage error:', error.message);
      return false;
    }
  }

  // ============================================
  // CONVERSATION OPERATIONS
  // ============================================

  /**
   * Tạo cuộc trò chuyện mới
   * @param {number} userId - ID người dùng
   * @param {Array} messages - Danh sách tin nhắn đầu tiên
   * @returns {Promise<Object>} Cuộc trò chuyện mới
   */
  async createConversation(userId, messages = []) {
    try {
      if (!userId) return null;

      const now = new Date();
      const expiryTime = new Date(now.getTime() + this.HISTORY_TTL_MS);

      // Lấy preview từ tin nhắn đầu tiên của user
      const userMessage = messages.find(m => m.from === 'user');
      const preview = userMessage
        ? userMessage.text.slice(0, 50)
        : 'Cuộc trò chuyện mới';

      const conversation = await prisma.chatConversation.create({
        data: {
          MaTaiKhoan: userId,
          GhiChuDau: preview.length < (userMessage?.text.length || 0)
            ? preview + '...'
            : preview,
          NgayTao: now,
          NgayCapNhat: now,
          HetHan: expiryTime,
          SoTinNhan: messages.length,
          TrangThai: 'Active'
        }
      });

      return {
        id: conversation.MaConversation,
        userId,
        preview: conversation.GhiChuDau,
        messageCount: conversation.SoTinNhan,
        timestamp: conversation.NgayTao
      };
    } catch (error) {
      console.error('[ChatRepository] createConversation error:', error.message);
      return null;
    }
  }

  /**
   * Lấy danh sách cuộc trò chuyện (chỉ còn hạn)
   * @param {number} userId - ID người dùng
   * @param {number} limit - Số cuộc tối đa
   * @returns {Promise<Array>} Danh sách cuộc trò chuyện
   */
  async getConversations(userId, limit = 50) {
    try {
      if (!userId) return [];

      const now = new Date();

      const conversations = await prisma.chatConversation.findMany({
        where: {
          MaTaiKhoan: userId,
          TrangThai: 'Active',
          HetHan: {
            gt: now // Chỉ lấy còn hạn
          }
        },
        orderBy: {
          NgayCapNhat: 'desc'
        },
        take: limit
      });

      return conversations.map(c => ({
        id: c.MaConversation,
        preview: c.GhiChuDau,
        messageCount: c.SoTinNhan,
        createdAt: c.NgayTao,
        updatedAt: c.NgayCapNhat
      }));
    } catch (error) {
      console.error('[ChatRepository] getConversations error:', error.message);
      return [];
    }
  }

  /**
   * Xóa một cuộc trò chuyện
   * @param {number} conversationId - ID cuộc trò chuyện
   * @returns {Promise<boolean>}
   */
  async deleteConversation(conversationId) {
    try {
      if (!conversationId) return false;

      await prisma.chatConversation.delete({
        where: {
          MaConversation: conversationId
        }
      });

      return true;
    } catch (error) {
      console.error('[ChatRepository] deleteConversation error:', error.message);
      return false;
    }
  }

  /**
   * Cập nhật cuộc trò chuyện
   * @param {number} conversationId - ID cuộc trò chuyện
   * @param {Object} data - Dữ liệu cập nhật
   * @returns {Promise<Object>}
   */
  async updateConversation(conversationId, data = {}) {
    try {
      if (!conversationId) return null;

      const conversation = await prisma.chatConversation.update({
        where: {
          MaConversation: conversationId
        },
        data: {
          ...data,
          NgayCapNhat: new Date()
        }
      });

      return conversation;
    } catch (error) {
      console.error('[ChatRepository] updateConversation error:', error.message);
      return null;
    }
  }

  // ============================================
  // STATISTICS
  // ============================================

  /**
   * Lấy thống kê chat của user
   * @param {number} userId - ID người dùng
   * @returns {Promise<Object>} Thống kê
   */
  async getStatistics(userId) {
    try {
      if (!userId) return null;

      const now = new Date();

      const totalMessages = await prisma.chatHistory.count({
        where: {
          MaTaiKhoan: userId,
          TrangThai: 'Active',
          HetHan: { gt: now }
        }
      });

      const totalConversations = await prisma.chatConversation.count({
        where: {
          MaTaiKhoan: userId,
          TrangThai: 'Active',
          HetHan: { gt: now }
        }
      });

      const userMessages = await prisma.chatHistory.count({
        where: {
          MaTaiKhoan: userId,
          LoaiTinNhan: 'user',
          TrangThai: 'Active',
          HetHan: { gt: now }
        }
      });

      const botMessages = await prisma.chatHistory.count({
        where: {
          MaTaiKhoan: userId,
          LoaiTinNhan: 'bot',
          TrangThai: 'Active',
          HetHan: { gt: now }
        }
      });

      return {
        totalMessages,
        totalConversations,
        userMessages,
        botMessages,
        ttl: '24h',
        timestamp: new Date()
      };
    } catch (error) {
      console.error('[ChatRepository] getStatistics error:', error.message);
      return null;
    }
  }

  // ============================================
  // CLEANUP ON APP SHUTDOWN
  // ============================================

  async shutdown() {
    try {
      await prisma.$disconnect();
      console.log('[ChatRepository] Disconnected from database');
    } catch (error) {
      console.error('[ChatRepository] Shutdown error:', error);
    }
  }
}

module.exports = new ChatbotRepository();
