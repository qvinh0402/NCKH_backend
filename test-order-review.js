// Ví dụ test API đánh giá đơn hàng
// Có thể chạy file này với: node test-order-review.js

const BASE_URL = 'http://localhost:3000/api/orders';

// ============================================
// Test Case 1: Đánh giá đơn hàng với đầy đủ thông tin
// ============================================
async function test1_RateOrderFullInfo() {
  console.log('\n=== Test 1: Đánh giá đơn hàng với đầy đủ thông tin ===');
  
  const orderId = 15; // Thay bằng ID đơn hàng thực tế đã được giao
  
  const requestBody = {
    MaNguoiDung: 1,
    SoSao: 5,
    BinhLuan: "Giao hàng nhanh, đồ ăn ngon, shipper thân thiện!"
  };

  try {
    const response = await fetch(`${BASE_URL}/${orderId}/rate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ Test 1 PASSED');
    } else {
      console.log('❌ Test 1 FAILED:', data.message);
    }
  } catch (error) {
    console.error('❌ Test 1 ERROR:', error.message);
  }
}

// ============================================
// Test Case 2: Đánh giá chỉ với số sao (không có bình luận)
// ============================================
async function test2_RateOrderOnlyRating() {
  console.log('\n=== Test 2: Đánh giá chỉ với số sao ===');
  
  const orderId = 20; // Thay bằng ID đơn hàng thực tế đã được giao
  
  const requestBody = {
    SoSao: 4
  };

  try {
    const response = await fetch(`${BASE_URL}/${orderId}/rate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ Test 2 PASSED');
    } else {
      console.log('❌ Test 2 FAILED:', data.message);
    }
  } catch (error) {
    console.error('❌ Test 2 ERROR:', error.message);
  }
}

// ============================================
// Test Case 3: Lấy thông tin đánh giá của đơn hàng
// ============================================
async function test3_GetOrderReview() {
  console.log('\n=== Test 3: Lấy thông tin đánh giá ===');
  
  const orderId = 15; // ID đơn hàng đã được đánh giá ở test 1
  
  try {
    const response = await fetch(`${BASE_URL}/${orderId}/review`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ Test 3 PASSED');
    } else {
      console.log('❌ Test 3 FAILED:', data.message);
    }
  } catch (error) {
    console.error('❌ Test 3 ERROR:', error.message);
  }
}

// ============================================
// Test Case 4: Đánh giá thấp với lý do cụ thể
// ============================================
async function test4_RateOrderLowScore() {
  console.log('\n=== Test 4: Đánh giá thấp với lý do ===');
  
  const orderId = 25; // Thay bằng ID đơn hàng thực tế đã được giao
  
  const requestBody = {
    MaNguoiDung: 5,
    SoSao: 2,
    BinhLuan: "Giao hàng chậm, đồ ăn hơi nguội khi nhận được"
  };

  try {
    const response = await fetch(`${BASE_URL}/${orderId}/rate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ Test 4 PASSED');
    } else {
      console.log('❌ Test 4 FAILED:', data.message);
    }
  } catch (error) {
    console.error('❌ Test 4 ERROR:', error.message);
  }
}

// ============================================
// Test Case 5: Validation - Số sao không hợp lệ
// ============================================
async function test5_InvalidRating() {
  console.log('\n=== Test 5: Validation - Số sao không hợp lệ ===');
  
  const orderId = 30;
  
  const requestBody = {
    SoSao: 6 // Invalid: phải từ 1-5
  };

  try {
    const response = await fetch(`${BASE_URL}/${orderId}/rate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (!response.ok && data.message.includes('1 đến 5')) {
      console.log('✅ Test 5 PASSED - Validation hoạt động đúng');
    } else {
      console.log('❌ Test 5 FAILED - Validation không hoạt động');
    }
  } catch (error) {
    console.error('❌ Test 5 ERROR:', error.message);
  }
}

// ============================================
// Test Case 6: Đánh giá đơn hàng đã được đánh giá
// ============================================
async function test6_AlreadyReviewed() {
  console.log('\n=== Test 6: Đánh giá đơn hàng đã được đánh giá ===');
  
  const orderId = 15; // Đơn hàng đã được đánh giá ở test 1
  
  const requestBody = {
    SoSao: 3,
    BinhLuan: "Thử đánh giá lại"
  };

  try {
    const response = await fetch(`${BASE_URL}/${orderId}/rate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (!response.ok && data.message.includes('đã được đánh giá')) {
      console.log('✅ Test 6 PASSED - Không cho phép đánh giá 2 lần');
    } else {
      console.log('❌ Test 6 FAILED');
    }
  } catch (error) {
    console.error('❌ Test 6 ERROR:', error.message);
  }
}

// ============================================
// Chạy tất cả tests
// ============================================
async function runAllTests() {
  console.log('🚀 Bắt đầu test API đánh giá đơn hàng...\n');
  console.log('📌 Lưu ý: Đảm bảo server đang chạy tại', BASE_URL);
  console.log('📌 Thay đổi orderId trong code để test với đơn hàng thực tế\n');

  await test1_RateOrderFullInfo();
  await test2_RateOrderOnlyRating();
  await test3_GetOrderReview();
  await test4_RateOrderLowScore();
  await test5_InvalidRating();
  await test6_AlreadyReviewed();

  console.log('\n✨ Hoàn thành tất cả tests!\n');
}

// Chạy tests
runAllTests().catch(console.error);
