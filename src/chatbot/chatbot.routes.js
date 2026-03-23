// Chatbot Routes - PUBLIC (Không cần đăng nhập)

const express = require('express');
const chatbotController = require('./chatbot.controller');
const { scenarios } = require('./chatbot.scenarios');
const optimization = require('./chatbot.optimization');

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
// CHAT ENDPOINTS
// ============================================

/**
 * POST /api/chatbot/message
 * Gửi tin nhắn đến chatbot
 * Body: { message: string, userId?: string }
 */
router.post(
  '/message',
  chatbotController.sendMessage.bind(chatbotController)
);

/**
 * GET /api/chatbot/history/:userId
 * Lấy lịch sử chat (chỉ cho user đã đăng nhập, cache 24h)
 */
router.get(
  '/history/:userId',
  chatbotController.getHistory.bind(chatbotController)
);

/**
 * DELETE /api/chatbot/history/:userId
 * Xóa lịch sử chat (chỉ cho user đã đăng nhập)
 */
router.delete(
  '/history/:userId',
  chatbotController.clearHistory.bind(chatbotController)
);

/**
 * DELETE /api/chatbot/session/:userId
 */
router.delete(
  '/session/:userId',
  chatbotController.clearSession.bind(chatbotController)
);

/**
 * POST /api/chatbot/checkout
 */
router.post(
  '/checkout',
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
