// Display full response
const chatbotService = require('./src/chatbot/chatbot.service');

async function showFullResponse() {
  try {
    const reply = await chatbotService.processMessage('Chi nhánh của bạn ở đâu?', 'test_user');
    console.log('🤖 CHATBOT RESPONSE:\n');
    console.log(reply);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

showFullResponse();
