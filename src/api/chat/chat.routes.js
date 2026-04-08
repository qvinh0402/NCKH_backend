const express = require('express');
const router = express.Router();
const chatController = require('./chat.controller');

// Primary: Use Groq with fallback
router.post('/', chatController.chatWithGroq);

// Legacy: Keep Gemini endpoint for backward compatibility
router.post('/gemini', chatController.chatWithGemini);

module.exports = router;
