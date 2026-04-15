// Test food filtering - verify category filtering works
const chatbotService = require('./src/chatbot/chatbot.service');

async function testFoodFiltering() {
  console.log('🧪 Testing Food Category Filtering\n');

  const tests = [
    { message: 'Xem món rẻ nhất', description: 'Cheapest (non-drink)' },
    { message: 'Xem món đắt nhất', description: 'Most expensive (non-drink)' },
    { message: 'Xem món bán chạy', description: 'Trending foods' }
  ];

  for (const test of tests) {
    try {
      console.log(`📝 User: "${test.message}" (${test.description})`);
      const reply = await chatbotService.processMessage(test.message, 'test-user');
      console.log(`🤖 Bot:\n${reply}\n`);
      console.log('---\n');
    } catch (error) {
      console.error(`❌ Error: ${error.message}\n`);
    }
  }

  console.log('✅ Test completed!');
  process.exit(0);
}

testFoodFiltering();
