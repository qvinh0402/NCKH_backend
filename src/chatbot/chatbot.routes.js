// Chatbot Routes - PUBLIC (Không cần đăng nhập)
const express = require('express');
const chatbotController = require('./chatbot.controller');
const chatbotService = require('./chatbot.service');
const { trackResponseTime } = require('./chatbot.optimization');

const router = express.Router();

// Apply performance tracking middleware
router.use(trackResponseTime);

/**
 * POST /api/chatbot/message
 * Gửi tin nhắn đến chatbot (PUBLIC - Không cần đăng nhập)
 * Body: { message: string, userId?: string }
 */
router.post('/message', chatbotController.sendMessage.bind(chatbotController));

/**
 * GET /api/chatbot/session/:userId
 * Lấy thông tin session hiện tại (PUBLIC)
 */
router.get('/session/:userId', chatbotController.getSession.bind(chatbotController));

/**
 * DELETE /api/chatbot/session/:userId
 * Xóa session/giỏ hàng (PUBLIC)
 */
router.delete('/session/:userId', chatbotController.clearSession.bind(chatbotController));

/**
 * POST /api/chatbot/checkout
 * Thanh toán đơn hàng (PUBLIC - Không cần đăng nhập)
 * Body: { userId: string, paymentMethod: string, deliveryAddress?: object }
 */
router.post('/checkout', chatbotController.checkout.bind(chatbotController));

/**
 * GET /api/chatbot/debug/scenarios
 * Debug: Liệt kê tất cả scenarios (PUBLIC)
 */
router.get('/debug/scenarios', (req, res) => {
  try {
    const scenarios = chatbotService.listScenarios();
    res.json({
      success: true,
      count: scenarios.length,
      scenarios
    });
  } catch (error) {
    console.error('[Chatbot Debug] Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
