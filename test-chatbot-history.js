// Test Chatbot History System
// Test kích hoạt với: node test-chatbot-history.js

const axios = require('axios');

const API_URL = 'http://localhost:3001/api/chatbot';
const TEST_USER_ID = 123; // Mock user ID (từ token)
const TEST_TOKEN = 'Bearer mock-token-123'; // Mock token

// Colors for console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(color, label, message) {
  console.log(`${color}[${label}]${colors.reset} ${message}`);
}

// ============================================
// TEST 1: Send message as guest (không lưu)
// ============================================
async function test1_GuestMessage() {
  log(colors.blue, 'TEST 1', 'Guest Message (không lưu vào DB)');
  
  try {
    const response = await axios.post(`${API_URL}/message`, {
      message: 'Xem món đắt nhất'
      // Không gửi userId → sẽ generate guest ID
    });

    if (response.data.success && response.data.data.userId.startsWith('guest')) {
      log(colors.green, '✓ PASS', `Guest ID generated: ${response.data.data.userId}`);
      log(colors.cyan, 'INFO', `Bot reply: ${response.data.data.reply}`);
      return true;
    } else {
      log(colors.red, '✗ FAIL', 'Guest message handling failed');
      return false;
    }
  } catch (error) {
    log(colors.red, '✗ ERROR', error.message);
    return false;
  }
}

// ============================================
// TEST 2: Send message as logged-in user (lưu)
// ============================================
async function test2_UserMessage() {
  log(colors.blue, 'TEST 2', 'User Message (lưu vào DB 24h)');
  
  try {
    const response = await axios.post(`${API_URL}/message`, {
      message: 'Xem món rẻ nhất',
      userId: TEST_USER_ID
    });

    if (response.data.success && response.data.data.userId === TEST_USER_ID) {
      log(colors.green, '✓ PASS', `Message saved for user ${TEST_USER_ID}`);
      log(colors.cyan, 'INFO', `Bot reply: ${response.data.data.reply}`);
      return true;
    } else {
      log(colors.red, '✗ FAIL', 'User message handling failed');
      return false;
    }
  } catch (error) {
    log(colors.red, '✗ ERROR', error.message);
    return false;
  }
}

// ============================================
// TEST 3: Get chat history (protected)
// ============================================
async function test3_GetHistory() {
  log(colors.blue, 'TEST 3', 'Get Chat History (protected endpoint)');
  
  try {
    const response = await axios.get(`${API_URL}/history/${TEST_USER_ID}`, {
      headers: {
        'Authorization': TEST_TOKEN
      }
    });

    if (response.data.success && Array.isArray(response.data.data)) {
      log(colors.green, '✓ PASS', `Retrieved ${response.data.data.length} messages`);
      
      // Hiển thị messages
      response.data.data.slice(-3).forEach((msg, idx) => {
        log(colors.cyan, 'MSG', `[${msg.from}] ${msg.text}`);
      });
      
      log(colors.cyan, 'META', `TTL: ${response.data.meta.ttl}`);
      return true;
    } else {
      log(colors.red, '✗ FAIL', 'History retrieval failed');
      return false;
    }
  } catch (error) {
    log(colors.red, '✗ ERROR', error.message);
    return false;
  }
}

// ============================================
// TEST 4: Guest cannot access history
// ============================================
async function test4_GuestCannotAccessHistory() {
  log(colors.blue, 'TEST 4', 'Guest should NOT access history');
  
  try {
    const response = await axios.get(`${API_URL}/history/guest_123_abc`, {
      headers: {
        'Authorization': TEST_TOKEN
      }
    });

    log(colors.red, '✗ FAIL', 'Guest should not be able to access history');
    return false;
  } catch (error) {
    if (error.response?.status === 403) {
      log(colors.green, '✓ PASS', `Guest blocked: ${error.response.data.message}`);
      return true;
    } else {
      log(colors.red, '✗ ERROR', error.message);
      return false;
    }
  }
}

// ============================================
// TEST 5: Get conversations
// ============================================
async function test5_GetConversations() {
  log(colors.blue, 'TEST 5', 'Get Conversations (protected)');
  
  try {
    const response = await axios.get(`${API_URL}/conversations/${TEST_USER_ID}`, {
      headers: {
        'Authorization': TEST_TOKEN
      }
    });

    if (response.data.success && Array.isArray(response.data.data)) {
      log(colors.green, '✓ PASS', `Retrieved ${response.data.data.length} conversations`);
      
      response.data.data.slice(0, 2).forEach((conv) => {
        log(colors.cyan, 'CONV', `Preview: ${conv.preview} (${conv.messageCount} messages)`);
      });
      
      return true;
    } else {
      log(colors.red, '✗ FAIL', 'Conversations retrieval failed');
      return false;
    }
  } catch (error) {
    log(colors.red, '✗ ERROR', error.message);
    return false;
  }
}

// ============================================
// TEST 6: Clear history
// ============================================
async function test6_ClearHistory() {
  log(colors.blue, 'TEST 6', 'Clear History (delete all messages)');
  
  try {
    const response = await axios.delete(`${API_URL}/history/${TEST_USER_ID}`, {
      headers: {
        'Authorization': TEST_TOKEN
      }
    });

    if (response.data.success) {
      log(colors.green, '✓ PASS', response.data.message);
      
      // Verify history is empty
      const historyResponse = await axios.get(`${API_URL}/history/${TEST_USER_ID}`, {
        headers: { 'Authorization': TEST_TOKEN }
      });
      
      if (historyResponse.data.data.length === 0) {
        log(colors.green, '✓ VERIFIED', 'History is empty after delete');
        return true;
      } else {
        log(colors.red, '✗ FAIL', 'History still contains messages');
        return false;
      }
    } else {
      log(colors.red, '✗ FAIL', 'Clear history failed');
      return false;
    }
  } catch (error) {
    log(colors.red, '✗ ERROR', error.message);
    return false;
  }
}

// ============================================
// TEST 7: Auth validation
// ============================================
async function test7_AuthValidation() {
  log(colors.blue, 'TEST 7', 'Authentication Validation');
  
  try {
    // Try without token
    await axios.get(`${API_URL}/history/${TEST_USER_ID}`);
    log(colors.red, '✗ FAIL', 'Should require authentication');
    return false;
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      log(colors.green, '✓ PASS', 'Auth required for protected endpoints');
      return true;
    } else {
      log(colors.red, '✗ ERROR', error.message);
      return false;
    }
  }
}

// ============================================
// MAIN TEST RUNNER
// ============================================
async function runAllTests() {
  console.log('\n' + '='.repeat(60));
  console.log('🤖 CHATBOT HISTORY SYSTEM TEST SUITE');
  console.log('='.repeat(60) + '\n');

  const tests = [
    { name: 'Guest Message', fn: test1_GuestMessage },
    { name: 'User Message (Auto-Save)', fn: test2_UserMessage },
    { name: 'Get History', fn: test3_GetHistory },
    { name: 'Guest Cannot Access History', fn: test4_GuestCannotAccessHistory },
    { name: 'Get Conversations', fn: test5_GetConversations },
    { name: 'Clear History', fn: test6_ClearHistory },
    { name: 'Auth Validation', fn: test7_AuthValidation }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test.fn();
      passed += result ? 1 : 0;
      failed += result ? 0 : 1;
    } catch (error) {
      console.error(`Unexpected error in ${test.name}:`, error);
      failed++;
    }
    console.log(''); // Line break
  }

  // Summary
  console.log('='.repeat(60));
  console.log(`📊 TEST SUMMARY`);
  console.log('='.repeat(60));
  log(colors.green, 'PASSED', `${passed}/${tests.length}`);
  log(colors.red, 'FAILED', `${failed}/${tests.length}`);
  
  if (failed === 0) {
    log(colors.green, '✓ ALL TESTS PASSED', '🎉');
  } else {
    log(colors.yellow, '⚠ SOME TESTS FAILED', 'Check output above');
  }
  
  console.log('='.repeat(60) + '\n');
}

// Run tests
runAllTests().catch(console.error);
