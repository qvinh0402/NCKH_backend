// Chatbot Service - Xử lý logic chính của chatbot

const { scenarios } = require('./chatbot.scenarios');
const { sanitizeMessage } = require('./chatbot.optimization');

class ChatbotService {
  constructor() {
    this.scenarios = Array.isArray(scenarios) ? scenarios : [];
    this.userSessions = new Map();
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

      const matchedScenario = this.findMatchingScenario(normalizedMessage);

      if (!matchedScenario) {
        this.logPerformance('No match', start);
        return this.getDefaultResponse();
      }

      try {
        const response = await matchedScenario.response(
          normalizedMessage,
          session
        );

        this.logPerformance(`Matched: ${matchedScenario.name}`, start);
        return response;

      } catch (scenarioError) {
        console.error(
          `[Scenario Error] ${matchedScenario.name}:`,
          scenarioError
        );

        return '❌ Xin lỗi, có lỗi xảy ra khi xử lý yêu cầu của bạn.';
      }

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

      // RESET lastIndex nếu regex có g
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
    .filter(s => s.name) // đảm bảo có name
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