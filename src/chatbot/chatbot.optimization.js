// ============================================
// CHATBOT PERFORMANCE OPTIMIZATION
// ============================================

/**
 * Session cleanup - Remove inactive sessions every 30 minutes
 */
function setupSessionCleanup(userSessions) {
  setInterval(() => {
    const now = Date.now();
    const inactiveTimeout = 30 * 60 * 1000; // 30 minutes
    let cleaned = 0;

    for (const [userId, session] of userSessions.entries()) {
      if (now - session.lastActivity.getTime() > inactiveTimeout) {
        userSessions.delete(userId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[Cleanup] Removed ${cleaned} inactive sessions`);
    }
  }, 30 * 60 * 1000);
}

/**
 * Response time tracking middleware
 */
function trackResponseTime(req, res, next) {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    if (duration > 1000) {
      console.warn(`⚠️  Slow response: ${req.method} ${req.path} - ${duration}ms`);
    } else {
      console.log(`✅ Response: ${req.method} ${req.path} - ${duration}ms`);
    }
  });

  next();
}

/**
 * Message validation & sanitization
 */
function sanitizeMessage(message) {
  return message
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ\s?!]/g, '');
}

module.exports = {
  setupSessionCleanup,
  trackResponseTime,
  sanitizeMessage
};
