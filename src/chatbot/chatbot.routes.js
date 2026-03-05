// Chatbot Routes - PUBLIC (Không cần đăng nhập)

const express = require('express');
const chatbotController = require('./chatbot.controller');
const { scenarios } = require('./chatbot.scenarios');
const { trackResponseTime } = require('./chatbot.optimization');

const router = express.Router();

// ============================================
// GLOBAL MIDDLEWARE
// ============================================

router.use(trackResponseTime);

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
 * GET /api/chatbot/session/:userId
 */
router.get(
  '/session/:userId',
  chatbotController.getSession.bind(chatbotController)
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
 * Body: { userId: string, paymentMethod: string, deliveryAddress?: object }
 */
router.post(
  '/checkout',
  chatbotController.checkout.bind(chatbotController)
);

// ============================================
// DEBUG ROUTES (Đồng bộ với scenarios.js)
// ============================================

/**
 * GET /api/chatbot/debug/scenarios
 * Liệt kê regex pattern của tất cả scenarios
 */
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

/**
 * POST /api/chatbot/debug/test
 * Test nhanh 1 message không cần session
 * Body: { message: string }
 */
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