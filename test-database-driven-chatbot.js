// Test chatbot with database-driven menu context
const chatbotService = require('./src/chatbot/chatbot.service');

async function testDatabaseDrivenChatbot() {
  console.log('🧪 Testing Database-Driven Chatbot with Menu Context\n');

  const tests = [
    {
      message: 'Bạn có pizza nào rẻ mà ngon không?',
      description: 'Ask about cheap pizza'
    },
    {
      message: 'Tôi muốn ăn gì đó đặc biệt',
      description: 'Ask for special recommendation'
    },
    {
      message: 'Bạn bán mì Ý không?',
      description: 'Ask for non-existing item (Pasta)'
    },
    {
      message: 'Pizza Pepperoni hôm nay bao nhiêu tiền?',
      description: 'Ask about specific pizza price'
    },
    {
      message: 'Gợi ý một chiếc pizza cho bữa tiệc',
      description: 'Ask for party recommendation'
    }
  ];

  for (const test of tests) {
    try {
      console.log(`📝 User: "${test.message}" (${test.description})`);
      const reply = await chatbotService.processMessage(test.message, 'test-user-' + Math.random());
      console.log(`🤖 Bot: ${reply}\n`);
      console.log('---\n');
    } catch (error) {
      console.error(`❌ Error: ${error.message}\n`);
    }
  }

  console.log('✅ Test completed!');
  process.exit(0);
}

testDatabaseDrivenChatbot();
