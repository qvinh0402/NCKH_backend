// Test chatbot chi nhánh
const chatbotService = require('./src/chatbot/chatbot.service');

async function testBranches() {
  console.log('🧪 Testing Chatbot Branch Scenario\n');
  
  try {
    // Test với các câu hỏi về chi nhánh
    const questions = [
      'Bạn có chi nhánh nào?',
      'Cửa hàng ở đâu?',
      'Địa chỉ Secret Pizza',
      'Liên hệ chi nhánh',
      'Điện thoại cửa hàng'
    ];

    for (const question of questions) {
      console.log(`📝 User: ${question}`);
      const reply = await chatbotService.processMessage(question, 'test_user_123');
      console.log(`🤖 Bot: ${reply.substring(0, 200)}...\n`);
    }

    console.log('✅ Test completed!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testBranches();
