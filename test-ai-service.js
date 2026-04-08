// test-ai-service.js - Test multiple AI models from .env

const aiService = require('./src/services/aiService');
const aiReviewService = require('./src/services/aiReviewService');

// ===============================
// 1️⃣ CHECK AVAILABLE MODELS
// ===============================
async function testAvailableModels() {
  console.log('\n🧠 AVAILABLE AI MODELS:');
  console.log('='.repeat(50));
  
  const models = aiService.getAvailableModels();
  models.forEach(model => {
    console.log(`✓ ${model.name}`);
    console.log(`  Provider: ${model.provider}`);
    console.log(`  Model: ${model.model}`);
    console.log(`  Status: ${model.status}`);
    console.log('');
  });
}

// ===============================
// 2️⃣ TEST GROQ MODEL
// ===============================
async function testGroqModel() {
  console.log('\n🚀 TEST GROQ MODEL:');
  console.log('='.repeat(50));
  
  try {
    const response = await aiService.callGroq('Xin chào! Bạn là ai?');
    console.log('✅ Response:', response);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// ===============================
// 3️⃣ TEST OPENROUTER MODEL
// ===============================
async function testOpenRouterModel() {
  console.log('\n🚀 TEST OPENROUTER MODEL:');
  console.log('='.repeat(50));
  
  try {
    const response = await aiService.callOpenRouter('Hãy cho tôi biết về pizza!');
    console.log('✅ Response:', response);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// ===============================
// 4️⃣ TEST CALL AI (AUTO FALLBACK)
// ===============================
async function testCallAI() {
  console.log('\n🎯 TEST CALL AI (AUTO FALLBACK):');
  console.log('='.repeat(50));
  
  try {
    // Preferred GROQ
    const response1 = await aiService.callAI(
      'Hãy nói vài câu về pizza tuyệt vời!',
      'AUTO'  // AUTO | GROQ | OPENROUTER
    );
    console.log('✅ Response:', response1);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// ===============================
// 5️⃣ TEST ANALYZE REVIEW
// ===============================
async function testAnalyzeReview() {
  console.log('\n📊 TEST ANALYZE REVIEW:');
  console.log('='.repeat(50));
  
  try {
    const analysis = await aiReviewService.analyzeReview(
      2,  // Rating 1-5
      'Đồ ăn nguội, shipper giao chậm',  // Comment
      'AUTO'  // preferredModel
    );
    console.log('✅ Analysis:', JSON.stringify(analysis, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// ===============================
// 6️⃣ TEST GENERATE CHATBOT RESPONSE
// ===============================
async function testGenerateChatbotResponse() {
  console.log('\n💬 TEST GENERATE CHATBOT RESPONSE:');
  console.log('='.repeat(50));
  
  try {
    const response = await aiService.generateChatbotResponse(
      'Bạn có bao giờ bán pizza veggie không?',
      'Quán bán pizza tuyệt vời tại TPHCM',
      'AUTO'
    );
    console.log('✅ Response:', response);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// ===============================
// 7️⃣ TEST SUMMARIZE WEEKLY ISSUES
// ===============================
async function testSummarizeWeeklyIssues() {
  console.log('\n📈 TEST SUMMARIZE WEEKLY ISSUES:');
  console.log('='.repeat(50));
  
  const sampleReviews = [
    { rating: 5, comment: 'Đồ ăn tuyệt vời, giao hàng nhanh!' },
    { rating: 2, comment: 'Đồ ăn nguội, shipper giao chậm' },
    { rating: 3, comment: 'Bình thường, không tệ nhưng cũng không tốt' },
    { rating: 4, comment: 'Pizza ngon, nhưng cần cải thiện dịch vụ giao hàng' },
    { rating: 1, comment: 'Tệ lắm, đồ ăn bị hỏng, shipper xấu tính' }
  ];
  
  try {
    const summary = await aiReviewService.summarizeWeeklyIssues(sampleReviews, 'AUTO');
    console.log('✅ Summary:', summary);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// ===============================
// RUN ALL TESTS
// ===============================
async function runAllTests() {
  console.log('\n\n');
  console.log('🚀'.repeat(25));
  console.log('AI SERVICE TEST SUITE');
  console.log('🚀'.repeat(25));
  
  // Check available models first
  await testAvailableModels();
  
  // Only run tests if we have keys configured
  const models = aiService.getAvailableModels();
  const hasAvailable = models.some(m => m.status.includes('Available'));
  
  if (!hasAvailable) {
    console.error('\n⚠️  No AI models configured! Please add API keys to .env:');
    console.error('  - GROQ_API_KEY');
    console.error('  - OPENROUTER_API_KEY');
    return;
  }
  
  // Run individual tests
  await testGroqModel();
  await testOpenRouterModel();
  await testCallAI();
  await testAnalyzeReview();
  await testGenerateChatbotResponse();
  await testSummarizeWeeklyIssues();
  
  console.log('\n✅ All tests completed!');
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testAvailableModels,
  testGroqModel,
  testOpenRouterModel,
  testCallAI,
  testAnalyzeReview,
  testGenerateChatbotResponse,
  testSummarizeWeeklyIssues
};
