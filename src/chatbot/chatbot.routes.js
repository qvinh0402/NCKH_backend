// Chatbot Routes - PUBLIC (Không cần đăng nhập)

const express = require('express');
const chatbotController = require('./chatbot.controller');
const { scenarios } = require('./chatbot.scenarios');
const optimization = require('./chatbot.optimization');
const { authenticateToken, optionalAuth } = require('../api/auth/middleware/auth.middleware');

const router = express.Router();

// ============================================
// GLOBAL MIDDLEWARE
// ============================================

// Kiểm tra middleware có tồn tại không để tránh crash
if (
  optimization &&
  typeof optimization.trackResponseTime === "function"
) {
  router.use(optimization.trackResponseTime);
} else {
  console.warn("[Chatbot] trackResponseTime middleware not found");
}

// ============================================
// CHAT ENDPOINTS - PUBLIC
// ============================================

/**
 * POST /api/chatbot/message
 * Gửi tin nhắn đến chatbot - Không cần đăng nhập
 * Body: { message: string, userId?: string }
 */
router.post(
  '/message',
  optionalAuth, // Cho phép cả guest và user đăng nhập
  chatbotController.sendMessage.bind(chatbotController)
);

// ============================================
// CHAT HISTORY ENDPOINTS - PROTECTED (Cần đăng nhập)
// ============================================

/**
 * GET /api/chatbot/history/:userId
 * Lấy lịch sử chat - YÊU CẦU ĐĂNG NHẬP
 * Cache 24h trên server
 */
router.get(
  '/history/:userId',
  authenticateToken, // Bắt buộc đăng nhập
  chatbotController.getHistory.bind(chatbotController)
);

/**
 * DELETE /api/chatbot/history/:userId
 * Xóa lịch sử chat - YÊU CẦU ĐĂNG NHẬP
 */
router.delete(
  '/history/:userId',
  authenticateToken, // Bắt buộc đăng nhập
  chatbotController.clearHistory.bind(chatbotController)
);

// ============================================
// CONVERSATIONS ENDPOINTS - PROTECTED (Cần đăng nhập)
// ============================================

/**
 * GET /api/chatbot/conversations/:userId
 * Lấy danh sách cuộc trò chuyện - YÊU CẦU ĐĂNG NHẬP
 */
router.get(
  '/conversations/:userId',
  authenticateToken,
  chatbotController.getConversations.bind(chatbotController)
);

/**
 * DELETE /api/chatbot/conversations/:conversationId
 * Xóa cuộc trò chuyện - YÊU CẦU ĐĂNG NHẬP
 */
router.delete(
  '/conversations/:conversationId',
  authenticateToken,
  chatbotController.deleteConversation.bind(chatbotController)
);

// ============================================
// SESSION ENDPOINTS
// ============================================

/**
 * DELETE /api/chatbot/session/:userId
 * Xóa session (giỏ hàng)
 */
router.delete(
  '/session/:userId',
  optionalAuth,
  chatbotController.clearSession.bind(chatbotController)
);

/**
 * POST /api/chatbot/checkout
 * Thanh toán
 */
router.post(
  '/checkout',
  optionalAuth,
  chatbotController.checkout.bind(chatbotController)
);

// ============================================
// DEBUG ROUTES
// ============================================

router.get('/debug/scenarios', (req, res) => {
  try {

    const simplified = scenarios.map((s, index) => ({
      id: index + 1,
      patterns: s.patterns.map(p => p.toString())
    }));

    res.json({
      success: true,
      totalScenarios: simplified.length,
      scenarios: simplified
    });

  } catch (error) {

    console.error('[Chatbot Debug] Scenario Error:', error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/debug/test', async (req, res) => {

  try {

    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required"
      });
    }

    for (const scenario of scenarios) {

      if (scenario.patterns.some(pattern => pattern.test(message))) {

        const response = await scenario.response(message);

        return res.json({
          success: true,
          matched: true,
          response
        });
      }
    }

    return res.json({
      success: true,
      matched: false,
      response: "Xin lỗi, tôi chưa hiểu câu hỏi của bạn."
    });

  } catch (error) {

    console.error('[Chatbot Debug] Test Error:', error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
