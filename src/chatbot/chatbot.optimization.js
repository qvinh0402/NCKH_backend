// ============================================
// CHATBOT PERFORMANCE OPTIMIZATION
// ============================================

const DEFAULT_INACTIVE_TIMEOUT = 30 * 60 * 1000; // 30 phút
const DEFAULT_CLEANUP_INTERVAL = 30 * 60 * 1000; // 30 phút

let cleanupIntervalRef = null;

/**
 * Session cleanup
 * Tự động xóa session không hoạt động
 */
function setupSessionCleanup(
  userSessions,
  {
    inactiveTimeout = DEFAULT_INACTIVE_TIMEOUT,
    cleanupInterval = DEFAULT_CLEANUP_INTERVAL
  } = {}
) {
  if (!userSessions || typeof userSessions.entries !== 'function') {
    throw new Error('userSessions must be a Map');
  }

  // Tránh tạo nhiều interval nếu function bị gọi nhiều lần
  if (cleanupIntervalRef) {
    clearInterval(cleanupIntervalRef);
  }

  cleanupIntervalRef = setInterval(() => {
    const now = Date.now();
    let cleaned = 0;

    for (const [userId, session] of userSessions.entries()) {
      if (
        !session ||
        !session.lastActivity ||
        !(session.lastActivity instanceof Date)
      ) {
        userSessions.delete(userId);
        cleaned++;
        continue;
      }

      const inactiveTime = now - session.lastActivity.getTime();

      if (inactiveTime > inactiveTimeout) {
        userSessions.delete(userId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(
        `[SessionCleanup] Removed ${cleaned} inactive sessions | Remaining: ${userSessions.size}`
      );
    }
  }, cleanupInterval);

  return cleanupIntervalRef;
}

/**
 * Stop cleanup manually (optional)
 */
function stopSessionCleanup() {
  if (cleanupIntervalRef) {
    clearInterval(cleanupIntervalRef);
    cleanupIntervalRef = null;
  }
}

/**
 * Response time tracking middleware (High precision)
 */
function trackResponseTime(req, res, next) {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1_000_000;

    const logData = `${req.method} ${req.originalUrl} - ${durationMs.toFixed(
      2
    )}ms - ${res.statusCode}`;

    if (durationMs > 1000) {
      console.warn(`⚠️ Slow response: ${logData}`);
    } else {
      console.log(`✅ ${logData}`);
    }
  });

  next();
}

/**
 * Message validation & sanitization
 */
function sanitizeMessage(message) {
  if (!message || typeof message !== 'string') {
    return '';
  }

  return message
    .trim()
    .toLowerCase()
    .normalize('NFC')
    .replace(
      /[^a-z0-9àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ\s?!.,]/g,
      ''
    )
    .replace(/\s+/g, ' '); // loại bỏ khoảng trắng dư
}

module.exports = {
  setupSessionCleanup,
  stopSessionCleanup,
  trackResponseTime,
  sanitizeMessage
};