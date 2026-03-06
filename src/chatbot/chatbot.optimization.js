// ============================================
// CHATBOT PERFORMANCE OPTIMIZATION
// ============================================

const DEFAULT_INACTIVE_TIMEOUT = 30 * 60 * 1000;
const DEFAULT_CLEANUP_INTERVAL = 30 * 60 * 1000;

let cleanupIntervalRef = null;

// ============================================
// SESSION CLEANUP
// ============================================

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

  if (cleanupIntervalRef) {
    clearInterval(cleanupIntervalRef);
  }

  cleanupIntervalRef = setInterval(() => {
    const now = Date.now();
    let cleaned = 0;

    for (const [userId, session] of userSessions.entries()) {
      if (!session || !session.lastActivity) {
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

// ============================================
// REMOVE VIETNAMESE ACCENTS
// ============================================

function removeVietnameseTones(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

// ============================================
// SANITIZE MESSAGE
// ============================================

function sanitizeMessage(message) {

  if (!message || typeof message !== 'string') {
    return '';
  }

  let cleaned = message
    .trim()
    .toLowerCase();

  // bỏ dấu tiếng Việt
  cleaned = removeVietnameseTones(cleaned);

  // loại bỏ ký tự đặc biệt
  cleaned = cleaned.replace(/[^a-z0-9\s?!.,]/g, '');

  // remove extra space
  cleaned = cleaned.replace(/\s+/g, ' ');

  return cleaned;
}

// ============================================

module.exports = {
  setupSessionCleanup,
  sanitizeMessage
};