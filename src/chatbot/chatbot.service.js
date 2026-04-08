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
  // CONVERSATIONS MANAGEMENT
  // ============================================

  getConversations(userId) {
    if (!this.isValidUser(userId)) return [];

    const history = this.chatHistory.get(userId) || [];
    
    if (history.length === 0) return [];

    // Nhóm tin nhắn thành các cuộc trò chuyện
    // Mỗi cuộc trò chuyện được tách biệt nếu cách nhau > 5 phút
    const conversations = [];
    let currentConversation = [];
    let lastTimestamp = null;
    const TIMEOUT_MS = 5 * 60 * 1000; // 5 phút

    for (const msg of history) {
      const msgTime = new Date(msg.timestamp).getTime();

      if (
        lastTimestamp &&
        msgTime - lastTimestamp > TIMEOUT_MS
      ) {
        // Tạo cuộc trò chuyện mới
        if (currentConversation.length > 0) {
          conversations.push({
            id: `conv_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
            messages: [...currentConversation],
            preview: this.getConversationPreview(currentConversation),
            timestamp: currentConversation[0].timestamp,
            messageCount: currentConversation.length
          });
        }
        currentConversation = [];
      }

      currentConversation.push(msg);
      lastTimestamp = msgTime;
    }

    // Thêm cuộc trò chuyện cuối cùng
    if (currentConversation.length > 0) {
      conversations.push({
        id: `conv_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        messages: [...currentConversation],
        preview: this.getConversationPreview(currentConversation),
        timestamp: currentConversation[0].timestamp,
        messageCount: currentConversation.length
      });
    }

    // Sắp xếp theo thời gian mới nhất đầu
    return conversations.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );
  }

  getConversationPreview(messages) {
    if (messages.length === 0) return 'Cuộc trò chuyện';

    // Lấy tin nhắn đầu tiên của user
    const userMsg = messages.find(m => m.from === 'user');
    if (!userMsg) return 'Cuộc trò chuyện';

    const preview = userMsg.text.slice(0, 50);
    return preview.length < userMsg.text.length ? preview + '...' : preview;
  }

  deleteConversation(conversationId) {
    // Note: Trong thực tế cần lưu conversations vào DB
    // Hiện tại chỉ hỗ trợ cấu trúc này, cần mở rộng
    console.warn('[ChatbotService] deleteConversation: Cần implement lưu DB');
    return true;
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
          // Pass the original message to AI scenarios
          const responseArg = matchedScenario.isAIFallback ? userMessage : normalizedMessage;
          response = await matchedScenario.response(
            responseArg,
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
    let aiFallbackScenario = null;

    for (const scenario of this.scenarios) {
      // Save AI fallback scenario for later
      if (scenario.isAIFallback) {
        aiFallbackScenario = scenario;
        continue;
      }

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

    // Return AI fallback scenario if no pattern matched
    return aiFallbackScenario || null;
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