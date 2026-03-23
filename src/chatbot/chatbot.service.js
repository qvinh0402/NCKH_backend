// Chatbot Service - Xử lý logic chính của chatbot

const { scenarios } = require('./chatbot.scenarios');
const { sanitizeMessage } = require('./chatbot.optimization');

class ChatbotService {
  constructor() {
    this.scenarios = Array.isArray(scenarios) ? scenarios : [];

    // session (giỏ hàng)
    this.userSessions = new Map();

    // lịch sử chat
    this.chatHistory = new Map();

    // config
    this.HISTORY_TTL = 24 * 60 * 60 * 1000; // 24h
    this.MAX_HISTORY = 100;

    // auto cleanup mỗi 1h
    this.startHistoryCleanup();
  }

  // ============================================
  // SESSION MANAGEMENT
  // ============================================

  createSession(userId) {
    const session = {
      userId,
      orderCart: [],
      totalPrice: 0,
      createdAt: new Date(),
      lastActivity: new Date()
    };

    this.userSessions.set(userId, session);
    return session;
  }

  getOrCreateSession(userId) {
    let session = this.userSessions.get(userId);
    if (!session) {
      session = this.createSession(userId);
    } else {
      session.lastActivity = new Date();
    }
    return session;
  }

  getSession(userId) {
    return this.userSessions.get(userId);
  }

  clearSession(userId) {
    this.userSessions.delete(userId);
  }

  updateSession(userId, data = {}) {
    const session = this.userSessions.get(userId);
    if (!session || typeof data !== 'object') return;

    Object.assign(session, data);
    session.lastActivity = new Date();
  }

  // ============================================
  // 🧠 CHAT HISTORY
  // ============================================

  isValidUser(userId) {
    return userId && typeof userId === 'string' && !userId.startsWith('guest');
  }

  saveMessage(userId, message) {
    // ❌ không lưu nếu chưa login
    if (!this.isValidUser(userId)) return;

    if (!this.chatHistory.has(userId)) {
      this.chatHistory.set(userId, []);
    }

    const history = this.chatHistory.get(userId);

    history.push({
      ...message,
      timestamp: new Date()
    });

    // giới hạn số lượng tin
    if (history.length > this.MAX_HISTORY) {
      history.shift();
    }
  }

  getHistory(userId) {
    if (!this.isValidUser(userId)) return [];

    const history = this.chatHistory.get(userId) || [];
    const now = Date.now();

    return history.filter(m => {
      return now - new Date(m.timestamp).getTime() < this.HISTORY_TTL;
    });
  }

  clearHistory(userId) {
    this.chatHistory.delete(userId);
  }

  startHistoryCleanup() {
    setInterval(() => {
      const now = Date.now();

      for (const [userId, messages] of this.chatHistory.entries()) {
        const filtered = messages.filter(m => {
          return now - new Date(m.timestamp).getTime() < this.HISTORY_TTL;
        });

        if (filtered.length === 0) {
          this.chatHistory.delete(userId);
        } else {
          this.chatHistory.set(userId, filtered);
        }
      }

      console.log('[HistoryCleanup] Done');
    }, 60 * 60 * 1000); // mỗi 1h
  }

  // ============================================
  // MAIN MESSAGE PROCESSOR
  // ============================================

  async processMessage(userMessage, userId) {
    const start = process.hrtime.bigint();

    try {
      if (!userMessage || typeof userMessage !== 'string') {
        return '❌ Tin nhắn không hợp lệ.';
      }

      const session = this.getOrCreateSession(userId);
      const normalizedMessage = sanitizeMessage(userMessage);

      if (!normalizedMessage) {
        return '❌ Tin nhắn không hợp lệ.';
      }

      // ✅ lưu user message
      this.saveMessage(userId, {
        from: 'user',
        text: userMessage
      });

      const matchedScenario = this.findMatchingScenario(normalizedMessage);

      let response;

      if (!matchedScenario) {
        this.logPerformance('No match', start);
        response = this.getDefaultResponse();
      } else {
        try {
          response = await matchedScenario.response(
            normalizedMessage,
            session
          );

          this.logPerformance(`Matched: ${matchedScenario.name}`, start);

        } catch (scenarioError) {
          console.error(
            `[Scenario Error] ${matchedScenario.name}:`,
            scenarioError
          );

          response = '❌ Xin lỗi, có lỗi xảy ra khi xử lý yêu cầu của bạn.';
        }
      }

      // ✅ lưu bot reply
      this.saveMessage(userId, {
        from: 'bot',
        text: response
      });

      return response;

    } catch (error) {
      console.error('[ChatbotService] Fatal Error:', error);
      return '❌ Có lỗi xảy ra. Vui lòng thử lại sau.';
    }
  }

  // ============================================
  // SCENARIO MATCHING
  // ============================================

  findMatchingScenario(message) {
    for (const scenario of this.scenarios) {
      if (!scenario.patterns || !Array.isArray(scenario.patterns)) continue;

      for (const pattern of scenario.patterns) {

        if (pattern.global) {
          pattern.lastIndex = 0;
        }

        if (pattern.test(message)) {
          return scenario;
        }
      }
    }
    return null;
  }

  // ============================================
  // DEFAULT RESPONSE
  // ============================================

  getDefaultResponse() {
    const availableScenarios = this.scenarios
      .filter(s => s.name)
      .map(s => `• ${s.name}`);

    const suggestionList = availableScenarios.length > 0
      ? availableScenarios.join('\n')
      : 'Hiện chưa có chức năng khả dụng.';

    return (
      `😊 **Xin lỗi, tôi chưa hiểu yêu cầu của bạn.**\n\n` +
      `Tôi có thể hỗ trợ bạn với các chức năng sau:\n\n` +
      `${suggestionList}\n\n` +
      `👉 Bạn muốn thực hiện chức năng nào? Hãy nhập rõ hơn nhé!`
    );
  }

  // ============================================
  // DEBUG
  // ============================================

  listScenarios() {
    return this.scenarios.map(s => ({
      name: s.name,
      patterns: Array.isArray(s.patterns)
        ? s.patterns.map(p => p.source)
        : [],
      patternCount: Array.isArray(s.patterns)
        ? s.patterns.length
        : 0
    }));
  }

  logPerformance(label, startTime) {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - startTime) / 1_000_000;

    if (durationMs > 1000) {
      console.warn(`⚠️ ${label} - ${durationMs.toFixed(2)}ms`);
    } else {
      console.log(`✅ ${label} - ${durationMs.toFixed(2)}ms`);
    }
  }
}

module.exports = new ChatbotService();