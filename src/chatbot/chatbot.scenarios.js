// Chatbot Scenarios - Fixed & Complete
// Các kịch bản xử lý yêu cầu từ khách hàng

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ============================================
// HELPERS: XỬ LÝ TIẾNG VIỆT KHÔNG DẤU
// ============================================
function removeAccents(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

// ============================================
// CACHE & HELPERS
// ============================================
const foodCache = { data: null, timestamp: 0, ttl: 5 * 60 * 1000 };

async function getCachedFoods() {
  const now = Date.now();
  if (foodCache.data && now - foodCache.timestamp < foodCache.ttl) return foodCache.data;
  try {
    const foods = await prisma.monAn.findMany({
      where: { TrangThai: 'Active' },
      include: {
        LoaiMonAn: true,
        BienTheMonAn: { include: { Size: true }, where: { TrangThai: 'Active' } }
      }
    });
    
    // ĐIỂM CẦN SỬA: Thêm thuộc tính tenKhongDau ở đây
    foodCache.data = foods.map(f => ({
      ...f,
      tenKhongDau: removeAccents(f.TenMonAn) 
    }));
    
    foodCache.timestamp = now;
    return foodCache.data;
  } catch (e) {
    return foodCache.data || [];
  }
}

// CANCEL ORDER
// ============================================
const cancelScenario = {
  name: 'cancel',
  // Mở rộng patterns để nhận diện tốt hơn ý định của khách
  patterns: [
    /hủy/i, /huy/i, /xóa/i, /xoa/i, 
    /hủy đơn/i, /huy don/i, /dọn giỏ/i, /don gio/i,
    /3️⃣/i, /^3$/i
  ],
  response: async (userMessage, session) => {
    // 1. Kiểm tra xem giỏ hàng có dữ liệu hay không
    const hasItems = session.orderCart && session.orderCart.length > 0;

    if (!hasItems) {
      return '❌ Giỏ hàng của bạn vốn đã trống rồi nè! Bạn có muốn xem Menu để chọn món không? 🍕';
    }

    // 2. Thực hiện "Deep Clean" - Xóa sạch mọi dữ liệu liên quan đến phiên đặt hàng hiện tại
    session.orderCart = [];           // Xóa danh sách món
    session.totalPrice = 0;           // Reset tổng tiền
    session.deliveryInfo = null;      // Xóa thông tin giao hàng đã nhập
    session.awaitingDeliveryInfo = false; // Tắt trạng thái chờ nhập thông tin
    session.orderedAt = null;         // Reset thời gian (nếu có)

    // 3. Phản hồi xác nhận rõ ràng cho khách hàng
    return '🗑️ **XÁC NHẬN: ĐÃ HỦY GIỎ HÀNG THÀNH CÔNG!**\n\n' +
           'Toàn bộ các món ăn đã được xóa khỏi hệ thống. Giỏ hàng của bạn hiện đang trống. 🧹\n\n' +
           '👉 Bạn có thể gõ **"Menu"** hoặc **"Gợi ý"** để bắt đầu chọn món mới nhé! 😊';
  }
};

// ============================================
// HANDLE DELIVERY INFO INPUT
// ============================================
const handleDeliveryInput = {
  name: 'handleDeliveryInput',
  patterns: [/tên\s*:|sđt\s*:|địa\s*chỉ\s*:/i],
  response: async (userMessage, session) => {
    if (!session.awaitingDeliveryInfo) {
      return null; // Không xử lý nếu không ở trạng thái chờ thông tin giao hàng
    }

    // Parse thông tin giao hàng
    const parseResult = await parseDeliveryInfo(userMessage, session);
    
    if (!parseResult.success) {
      return parseResult.message;
    }

    // Lưu thông tin giao hàng vào session
    session.deliveryInfo = parseResult.data;
    session.awaitingDeliveryInfo = false;

    // Xác nhận thông tin
    let response = '✅ **THÔNG TIN ĐÃ LƯU!**\n\n';
    response += '📝 **KIỂM TRA THÔNG TIN:**\n';
    response += `• **Tên:** ${parseResult.data.tenNguoiNhan}\n`;
    response += `• **SĐT:** ${parseResult.data.soDienThoai}\n`;
    response += `• **Địa chỉ:** ${parseResult.data.soNhaDuong}, ${parseResult.data.phuongXa}, ${parseResult.data.quanHuyen}, ${parseResult.data.thanhPho}\n`;
    response += `• **Chi nhánh:** ${parseResult.data.tenCoSo}\n\n`;

    response += '🛒 **ĐƠN HÀNG CỦA BẠN:**\n';
    session.orderCart.forEach((item, idx) => {
      response += `${idx + 1}. ${item.soLuong}x ${item.tenMonAn} - ${item.thanhTien.toLocaleString('vi-VN')}đ\n`;
    });

    response += `\n💰 **TỔNG TIỀN:** ${session.totalPrice.toLocaleString('vi-VN')} đ\n\n`;

    response += '✅ **TIẾP TỤC:**\n';
    response += 'Gõ "thanh toán" hoặc "thanh toán ngay" để hoàn tất đơn hàng';

    return response;
  }
};

// ============================================
// ORDER - Đặt hàng với tích hợp Database
// ============================================
const orderScenario = {
  name: 'order',
  patterns: [/đặt/i, /cho.*tôi/i, /order/i, /muốn.*mua/i],
  response: async (userMessage, session) => {
    try {
      const foods = await getCachedFoods();
      if (!foods.length) {
        return '❌ Menu hiện không có sản phẩm. Vui lòng thử lại sau.';
      }

      // Phân tích yêu cầu: tìm sản phẩm và số lượng
      let foundItems = [];
      let totalPrice = 0;

      // Tìm tất cả sản phẩm được nhắc đến trong tin nhắn
      foods.forEach(food => {
        if (userMessage.toLowerCase().includes(food.TenMonAn.toLowerCase())) {
          // Lấy số lượng từ tin nhắn (ví dụ: "1 pizza", "2 cái", etc.)
          const qtyMatch = userMessage.match(new RegExp(`(\\d+)\\s*(?:cái|chiếc|ly|đĩa|phần)?\\s*${food.TenMonAn}`, 'i'));
          const qty = qtyMatch ? parseInt(qtyMatch[1]) : 1;
          
          const price = food.BienTheMonAn[0]?.GiaBan || 0;
          const subtotal = price * qty;

          foundItems.push({
            maBienThe: food.BienTheMonAn[0]?.MaBienThe,
            maMonAn: food.MaMonAn,
            tenMonAn: food.TenMonAn,
            soLuong: qty,
            donGia: price,
            thanhTien: subtotal
          });

          totalPrice += subtotal;
        }
      });

      // Nếu không tìm thấy sản phẩm nào
      if (foundItems.length === 0) {
        return `❓ Tôi không tìm thấy sản phẩm nào trong yêu cầu của bạn.\n\n` +
               `Các sản phẩm có sẵn:\n` +
               foods.slice(0, 5).map(f => `• ${f.TenMonAn}`).join('\n') +
               `\n\nBạn muốn đặt gì? Ví dụ: "Cho tôi 1 pizza hải sản, 2 tiramisu"`;
      }

      // Lưu vào session
      session.orderCart = foundItems;
      session.totalPrice = totalPrice;
      session.orderedAt = new Date();

      // Tạo danh sách đơn hàng
      let orderList = '🛒 **ĐƠN HÀNG CỦA BẠN:**\n\n';
      foundItems.forEach((item, idx) => {
        orderList += `${idx + 1}. ${item.soLuong}x ${item.tenMonAn}\n`;
        orderList += `   💵 ${item.thanhTien.toLocaleString('vi-VN')} đ\n`;
      });

      orderList += `\n**━━━━━━━━━━━━━━━━**\n`;
      orderList += `**Tổng cộng: ${totalPrice.toLocaleString('vi-VN')} đ**\n\n`;
      orderList += '✅ **Bước tiếp theo:**\n';
      orderList += '1️⃣ Thêm món khác\n';
      orderList += '2️⃣ Thanh toán ngay\n';
      orderList += '3️⃣ Hủy đơn';

      return orderList;
    } catch (error) {
      console.error('[Order] Error:', error);
      return '❌ Có lỗi khi xử lý đơn hàng. Vui lòng thử lại.';
    }
  }
};

function getStatusEmoji(status) {
  const map = {
    'Đang chờ xác nhận': '⏳', 'Đang xử lý': '🔄', 'Chờ giao hàng': '📦',
    'Đang giao': '🚴', 'Đã giao': '✅', 'Khách hàng đã hủy': '❌'
  };
  return map[status] || '❓';
}

// ============================================
// 0. GREETING
// ============================================
const greetingScenario = {
  name: 'greeting',
  patterns: [/xin.*chào/i, /hello/i, /hi/i, /làm.*sao/i, /giúp.*tôi/i],
  response: async (userMessage, session) => {
    return '👋 **CHÀO BẠN!** Chào mừng đến **SECRET PIZZA**\n\n' +
           '😊 Tôi có thể giúp bạn:\n\n' +
           '🍕 Xem menu & giá\n🤖 Gợi ý\n🛒 Đặt hàng\n📦 Kiểm tra đơn\n' +
           '🎁 Khuyến mãi\n💳 Thanh toán\n⭐ Đánh giá\n\n' +
           'Bạn muốn làm gì? 😄';
  }
};

// ============================================
// 1. VIEW MENU
// ============================================
const viewMenuScenario = {
  name: 'viewMenu',
  patterns: [/menu/i, /danh.*sách/i, /xem/i, /có.*gì/i],
  response: async (userMessage, session) => {
    try {
      const foods = await getCachedFoods();
      if (!foods.length) return '❌ Menu trống';
      
      let response = '📋 **MENU:**\n\n';
      foods.slice(0, 5).forEach(f => {
        response += `• ${f.TenMonAn}\n`;
      });
      return response;
    } catch (e) {
      return '❌ Lỗi tải menu';
    }
  }
};

// ============================================
// 2. ASK PRICE
// ============================================
const askPriceScenario = {
  name: 'askPrice',
  patterns: [/giá/i, /bao.*nhiêu/i, /tính.*tiền/i],
  response: async (userMessage, session) => {
    return '💰 **GIÁ CẢ:**\n\nVui lòng chọn sản phẩm để biết giá chi tiết!';
  }
};

// ============================================
// 3. RECOMMENDATION
// ============================================
const recommendationScenario = {
  name: 'recommendation',
  patterns: [/gợi.*ý/i, /nên.*ăn/i, /có gì ngon/i, /bạn gợi ý/i],
  response: async (userMessage, session) => {
    try {
      const foods = await getCachedFoods();
      if (!foods.length) {
        return '❌ Hiện tại không có món ăn để gợi ý';
      }

      // Lấy 2-3 món ngẫu nhiên
      const shuffled = foods.sort(() => 0.5 - Math.random());
      const recommended = shuffled.slice(0, Math.min(3, foods.length));

      let response = '🤖 **GỢI Ý MÓN ĂN CHO BẠN:**\n\n';
      recommended.forEach((food, idx) => {
        const price = food.BienTheMonAn[0]?.GiaBan || 0;
        response += `${idx + 1}. **${food.TenMonAn}** - ${price.toLocaleString('vi-VN')}đ\n`;
        if (food.MoTa) {
          response += `   ${food.MoTa}\n`;
        }
        response += '\n';
      });

      response += '💡 Bạn muốn thêm những món này vào giỏ không? Hãy nói "Cho tôi [tên món]"';
      return response;
    } catch (error) {
      console.error('[Recommendation] Error:', error);
      return '🤖 **GỢI Ý MÓN ĂN:**\n\n1. Pizza Hải Sản - 325.000đ\n2. Tiramisu - 85.000đ';
    }
  }
};


// ============================================
// 5. ADD MORE ITEMS
// ============================================
const addMoreScenario = {
  name: 'addMore',
  patterns: [/thêm.*món/i, /thêm/i, /nữa/i, /1️⃣/i, /^1$/i],
  response: async (userMessage, session) => {
    // 1. Kiểm tra giỏ hàng trống
    if (!session.orderCart || session.orderCart.length === 0) {
      return '❌ Bạn chưa có đơn hàng nào.\n\n🍕 Hãy bắt đầu bằng cách nói: "Cho tôi 1 pizza"';
    }

    try {
      const foods = await getCachedFoods();
      if (!foods.length) return '❌ Menu hiện không có sản phẩm.';

      const msgLower = userMessage.toLowerCase();
      let addedItems = [];
      let addedPrice = 0;

      // 2. Tìm sản phẩm dựa trên danh sách món ăn
      const msgNoAccent = removeAccents(userMessage); // Chuẩn hóa tin nhắn khách gửi

      foods.forEach(food => {
        const foodNameLower = food.TenMonAn.toLowerCase();
        const foodNameNoAccent = food.tenKhongDau;
    
      if (userMessage.toLowerCase().includes(foodNameLower) || msgNoAccent.includes(foodNameNoAccent)) {          // Regex linh hoạt hơn để bắt số lượng đứng trước tên món
          // Ví dụ: "thêm 2 pizza", "cho 5 cái pizza"
          const qtyRegex = new RegExp(`(\\d+)\\s*(?:cái|chiếc|ly|đĩa|phần)?\\s*${foodNameLower}`, 'i');
          const qtyMatch = userMessage.match(qtyRegex);
          const qty = qtyMatch ? parseInt(qtyMatch[1]) : 1;

          const price = food.BienTheMonAn[0]?.GiaBan || 0;
          const subtotal = price * qty;

          addedItems.push({
            maBienThe: food.BienTheMonAn[0]?.MaBienThe,
            maMonAn: food.MaMonAn,
            tenMonAn: food.TenMonAn,
            soLuong: qty,
            donGia: price,
            thanhTien: subtotal
          });

          addedPrice += subtotal;
        }
      });

      // 3. Xử lý kết quả tìm kiếm
      if (addedItems.length === 0) {
        // Nếu user chỉ gõ chung chung "thêm món nữa", hiển thị menu gợi ý
        let response = '❓ **BẠN MUỐN THÊM MÓN NÀO?**\n\n';
        response += 'Gợi ý cho bạn:\n';
        foods.slice(0, 5).forEach(f => {
          response += `• ${f.TenMonAn} (${f.BienTheMonAn[0]?.GiaBan.toLocaleString('vi-VN')}đ)\n`;
        });
        response += '\n💬 **Ví dụ:** "Thêm 2 pizza hải sản"';
        return response;
      }

      // 4. Cộng dồn vào giỏ hàng hiện tại (Kiểm tra nếu trùng món thì cộng số lượng thay vì thêm dòng mới)
      addedItems.forEach(newItem => {
        const existingItem = session.orderCart.find(item => item.maBienThe === newItem.maBienThe);
        if (existingItem) {
          existingItem.soLuong += newItem.soLuong;
          existingItem.thanhTien += newItem.thanhTien;
        } else {
          session.orderCart.push(newItem);
        }
      });

      session.totalPrice += addedPrice;

      // 5. Tạo phản hồi tổng hợp
      let response = '✅ **ĐÃ THÊM VÀO GIỎ HÀNG!**\n\n';
      response += '📋 **ĐƠN HÀNG HIỆN TẠI:**\n';
      session.orderCart.forEach((item, idx) => {
        response += `${idx + 1}. ${item.soLuong}x ${item.tenMonAn} - ${item.thanhTien.toLocaleString('vi-VN')}đ\n`;
      });

      response += `\n**━━━━━━━━━━━━━━━━**\n`;
      response += `**Tổng cộng: ${session.totalPrice.toLocaleString('vi-VN')} đ**\n\n`;
      response += '1️⃣ Thêm món khác\n2️⃣ Thanh toán ngay\n3️⃣ Hủy đơn';

      return response;

    } catch (error) {
      console.error('[AddMore] Error:', error);
      return '❌ Có lỗi khi cập nhật đơn hàng.';
    }
  }
};

// ============================================
// 6. COLLECT DELIVERY INFO - Thu thập thông tin giao hàng
// ============================================
const deliveryInfoScenario = {
  name: 'deliveryInfo',
  patterns: [/thanh.*toán/i, /thanh.*toán.*ngay/i, /payment/i, /2️⃣/i, /^2$/i],
  response: async (userMessage, session) => {
    if (!session.orderCart || session.orderCart.length === 0) {
      return '❌ Bạn chưa có đơn hàng nào!';
    }

    // Nếu chưa có thông tin giao hàng, yêu cầu nhập
    if (!session.deliveryInfo) {
      let response = '📋 **THÔNG TIN GIAO HÀNG**\n\n';
      response += 'Vui lòng cung cấp thông tin để giao hàng:\n\n';
      response += '1️⃣ **Tên người nhận:** (Ví dụ: "Tên: Nguyễn Văn A")\n';
      response += '2️⃣ **Số điện thoại:** (Ví dụ: "SĐT: 0901234567")\n';
      response += '3️⃣ **Địa chỉ giao:** (Ví dụ: "Địa chỉ: 123 Nguyễn Hữu Cảnh, P.Tân Định, Q.1, TP.HCM")\n\n';
      response += '💬 Bạn có thể gửi tất cả thông tin cùng lúc.\n';
      response += '📝 **Ví dụ:** "Tên: Nguyễn Văn A, SĐT: 0901234567, Địa chỉ: 123 Nguyễn Hữu Cảnh, P.Tân Định, Q.1, TP.HCM"';
      
      session.awaitingDeliveryInfo = true;
      return response;
    }

    // Nếu đã có thông tin giao hàng, tiếp tục checkout
    return await checkoutWithDeliveryInfo(session);
  }
};

// ============================================
// PARSE & VALIDATE DELIVERY INFO
// ============================================
async function parseDeliveryInfo(userMessage, session) {
  // Parse thông tin từ tin nhắn
  // Format: "Tên: ..., SĐT: ..., Địa chỉ: ..."
  
  const tenMatch = userMessage.match(/tên\s*:\s*(.+?)(?=,\s*sđt|$)/i);
  const sdtMatch = userMessage.match(/sđt\s*:\s*(.+?)(?=,\s*địa|$)/i);
  const diaChiMatch = userMessage.match(/địa\s*chỉ\s*:\s*(.+?)$/i);

  if (!tenMatch || !sdtMatch || !diaChiMatch) {
    return {
      success: false,
      message: '❌ Thông tin không đầy đủ!\n\n' +
               '📝 Vui lòng cung cấp đầy đủ:\n' +
               '• Tên: [tên người nhận]\n' +
               '• SĐT: [số điện thoại]\n' +
               '• Địa chỉ: [đầy đủ địa chỉ]\n\n' +
               '**Ví dụ:** "Tên: Nguyễn Văn A, SĐT: 0901234567, Địa chỉ: 123 Nguyễn Hữu Cảnh, P.Tân Định, Q.1, TP.HCM"'
    };
  }

  const ten = tenMatch[1].trim();
  const sdt = sdtMatch[1].trim();
  let diaChi = diaChiMatch[1].trim();

  // Validate SĐT
  const sdtRegex = /^(0|\+84)[0-9]{9,10}$/;
  if (!sdtRegex.test(sdt)) {
    return {
      success: false,
      message: '❌ Số điện thoại không hợp lệ!\n\nVui lòng nhập số điện thoại từ 10-11 số (Ví dụ: 0901234567)'
    };
  }

  // Parse địa chỉ: tách ra từng phần
  // Format: "số nhà, phường, quận, thành phố"
  const parts = diaChi.split(',').map(p => p.trim());
  
  if (parts.length < 3) {
    return {
      success: false,
      message: '❌ Địa chỉ không đầy đủ!\n\n' +
               'Vui lòng cung cấp: Số nhà/đường, Phường/Xã, Quận/Huyện, Thành phố\n\n' +
               '**Ví dụ:** "123 Nguyễn Hữu Cảnh, P.Tân Định, Q.1, TP.HCM"'
    };
  }

  const soNha = parts[0];
  const phuongXa = parts[parts.length - 3] || '';
  const quanHuyen = parts[parts.length - 2] || '';
  const thanhPho = parts[parts.length - 1] || '';

  // Xác định cơ sở dựa trên thành phố
  let maCoSo = 1; // Mặc định
  let tenCoSo = 'Cơ sở chính';

  const thanhPhoLower = thanhPho.toLowerCase();
  if (thanhPhoLower.includes('hà nội') || thanhPhoLower.includes('hanoi')) {
    maCoSo = 1;
    tenCoSo = 'Chi nhánh Hà Nội';
  } else if (
    thanhPhoLower.includes('hồ chí minh') || 
    thanhPhoLower.includes('hcm') || 
    thanhPhoLower.includes('saigon') ||
    thanhPhoLower.includes('sài gòn')
  ) {
    maCoSo = 2;
    tenCoSo = 'Chi nhánh TP.HCM';
  }

  return {
    success: true,
    data: {
      tenNguoiNhan: ten,
      soDienThoai: sdt,
      soNhaDuong: soNha,
      phuongXa: phuongXa,
      quanHuyen: quanHuyen,
      thanhPho: thanhPho,
      maCoSo: maCoSo,
      tenCoSo: tenCoSo
    }
  };
}

// ============================================
// 6. CHECKOUT WITH DELIVERY INFO
// ============================================
async function checkoutWithDeliveryInfo(session) {
  if (!session.deliveryInfo) {
    return '❌ Thông tin giao hàng chưa được lưu. Vui lòng thử lại.';
  }

  try {
    const deliveryInfo = session.deliveryInfo;
    const items = session.orderCart.map(item => ({
      maBienThe: item.maBienThe,
      soLuong: item.soLuong,
      donGia: item.donGia,
      thanhTien: item.thanhTien,
      loai: 'SP'
    }));

    // Tạo đơn hàng với thông tin giao hàng
    const donHang = await prisma.donHang.create({
      data: {
        MaCoSo: deliveryInfo.maCoSo,
        NgayDat: new Date(),
        TienTruocGiamGia: session.totalPrice,
        TienGiamGia: 0,
        TongTien: session.totalPrice,
        PhiShip: 0,
        GhiChu: 'Đơn hàng từ chatbot',
        TenNguoiNhan: deliveryInfo.tenNguoiNhan,
        SoDienThoaiGiaoHang: deliveryInfo.soDienThoai,
        SoNhaDuongGiaoHang: deliveryInfo.soNhaDuong,
        PhuongXaGiaoHang: deliveryInfo.phuongXa,
        QuanHuyenGiaoHang: deliveryInfo.quanHuyen,
        ThanhPhoGiaoHang: deliveryInfo.thanhPho
      }
    });

    // Tạo chi tiết đơn hàng
    for (const item of items) {
      await prisma.chiTietDonHang.create({
        data: {
          MaDonHang: donHang.MaDonHang,
          MaBienThe: item.maBienThe,
          SoLuong: item.soLuong,
          DonGia: item.donGia,
          ThanhTien: item.thanhTien,
          Loai: item.loai
        }
      });
    }

    // Tạo lịch sử trạng thái đơn
    await prisma.lichSuTrangThaiDonHang.create({
      data: {
        MaDonHang: donHang.MaDonHang,
        TrangThai: 'Đang chờ xác nhận',
        ThoiGianCapNhat: new Date(),
        GhiChu: 'Đơn hàng mới tạo từ chatbot'
      }
    });

    // Tạo bản ghi thanh toán
    await prisma.thanhToan.create({
      data: {
        MaDonHang: donHang.MaDonHang,
        PhuongThuc: 'Tiền Mặt',
        SoTien: session.totalPrice,
        TrangThai: 'Chưa thanh toán',
        ThoiGian: new Date()
      }
    });

    // Tạo phản hồi thành công
    let response = '✅ **ĐƠN HÀNG ĐÃ ĐƯỢC TẠO THÀNH CÔNG!**\n\n';
    response += `📌 **Mã đơn hàng:** #${donHang.MaDonHang}\n\n`;
    
    response += '📋 **CHI TIẾT ĐƠN HÀNG:**\n';
    session.orderCart.forEach((item, idx) => {
      response += `${idx + 1}. ${item.soLuong}x ${item.tenMonAn} - ${item.thanhTien.toLocaleString('vi-VN')}đ\n`;
    });

    response += `\n💰 **TỔNG TIỀN:** ${session.totalPrice.toLocaleString('vi-VN')} đ\n`;
    response += `💳 **PHƯƠNG THỨC:** Tiền Mặt\n`;
    response += `📍 **TRẠNG THÁI:** Đang chờ xác nhận\n\n`;

    response += '👤 **THÔNG TIN GIAO HÀNG:**\n';
    response += `• **Tên:** ${deliveryInfo.tenNguoiNhan}\n`;
    response += `• **SĐT:** ${deliveryInfo.soDienThoai}\n`;
    response += `• **Địa chỉ:** ${deliveryInfo.soNhaDuong}, ${deliveryInfo.phuongXa}, ${deliveryInfo.quanHuyen}, ${deliveryInfo.thanhPho}\n`;
    response += `• **Chi nhánh:** ${deliveryInfo.tenCoSo}\n\n`;

    response += '✨ Cảm ơn bạn đã đặt hàng tại **SECRET PIZZA**!\n';
    response += '📞 Chúng tôi sẽ liên hệ xác nhận đơn hàng trong 5 phút.';

    // Xóa thông tin session sau khi lưu
    session.orderCart = [];
    session.totalPrice = 0;
    session.deliveryInfo = null;
    session.awaitingDeliveryInfo = false;

    return response;
  } catch (error) {
    console.error('[Checkout] Error creating order:', error);
    return '❌ Có lỗi khi tạo đơn hàng. Vui lòng thử lại sau.';
  }
}




// ============================================
// 8. COMBO
// ============================================
const comboScenario = {
  name: 'combo',
  patterns: [/combo/i, /gói/i, /bộ/i],
  response: async (userMessage, session) => {
    return '🎁 **COMBO:**\n\n• Combo Family - 500.000đ';
  }
};

// ============================================
// 9. PROMOTION
// ============================================
const promotionScenario = {
  name: 'promotion',
  patterns: [/khuyến.*mãi/i, /voucher/i, /giảm.*giá/i],
  response: async (userMessage, session) => {
    return '🎉 **KHUYẾN MÃI:**\n\n• Giảm 10% cho đơn > 200.000đ';
  }
};

// ============================================
// 10. ORDER STATUS
// ============================================
const orderStatusScenario = {
  name: 'orderStatus',
  patterns: [/trạng.*thái/i, /đơn.*ở.*đâu/i, /giao.*chưa/i],
  response: async (userMessage, session) => {
    // Tìm SĐT trong tin nhắn hoặc session
    const sdtMatch = userMessage.match(/(0|\+84)[0-9]{9,10}/);
    const sdt = sdtMatch ? sdtMatch[0] : session.deliveryInfo?.soDienThoai;

    if (!sdt) return '🔍 Cho mình xin **Số điện thoại** để check đơn nhé!';

    const order = await prisma.donHang.findFirst({
        where: { SoDienThoaiGiaoHang: sdt },
        orderBy: { NgayDat: 'desc' },
        include: { LichSuTrangThaiDonHang: { orderBy: { ThoiGianCapNhat: 'desc' }, take: 1 } }
    });

    if (!order) return '❌ Không thấy đơn nào của số này ạ.';
    return `📦 Đơn #${order.MaDonHang}: **${order.LichSuTrangThaiDonHang[0].TrangThai}**`;
  }
};

// ============================================
// 11. DELIVERY
// ============================================
const deliveryScenario = {
  name: 'delivery',
  patterns: [/giao.*hàng/i, /bao.*lâu/i, /phí.*giao/i],
  response: async (userMessage, session) => {
    return '🚚 **GIAO HÀNG:**\n\n⚡ 20-60 phút\n💰 Miễn phí (đơn > 200k)';
  }
};

// ============================================
// 12. STORE INFO
// ============================================
const storeInfoScenario = {
  name: 'storeInfo',
  patterns: [/cửa.*hàng/i, /địa.*chỉ/i, /liên.*hệ/i, /hotline/i],
  response: async (userMessage, session) => {
    return '🏪 **THÔNG TIN CỬA HÀNG:**\n\n📍 259/18 Hàn Hải Nguyên\n☎️ 02411112222';
  }
};

// ============================================
// 13. MEMBER
// ============================================
const memberScenario = {
  name: 'member',
  patterns: [/thành.*viên/i, /điểm/i, /vip/i],
  response: async (userMessage, session) => {
    return '👑 **THÀNH VIÊN:**\n\n🏅 Bronze: Giảm 5%\n🏅 Silver: Giảm 10%';
  }
};

// ============================================
// 14. FEEDBACK
// ============================================
const feedbackScenario = {
  name: 'feedback',
  patterns: [/đánh.*giá/i, /feedback/i, /nhận.*xét/i],
  response: async (userMessage, session) => {
    return '⭐ **ĐÁNH GIÁ:**\n\nCảm ơn bạn đã sử dụng dịch vụ của chúng tôi!';
  }
};

// ============================================
// 15. COMPLAINT
// ============================================
const complaintScenario = {
  name: 'complaint',
  patterns: [/khiếu.*nại/i, /sai/i, /trễ/i, /hỗ.*trợ/i],
  response: async (userMessage, session) => {
    return '😔 **KHIẾU NẠI:**\n\n📞 Hotline: 02411112222\n⏰ 8:00-22:00';
  }
};

// ============================================
// EXPORT
// ============================================
module.exports = {
  scenarios: [
    cancelScenario,         // 1. Luôn check lệnh Hủy trước để giải phóng session
    handleDeliveryInput,    // 2. Check input thông tin nếu đang trong luồng thanh toán
    orderStatusScenario,    // 3. Check trạng thái đơn (thường chứa SĐT cụ thể)
    orderScenario,          // 4. Đặt hàng mới
    addMoreScenario,        // 5. Thêm món vào giỏ
    deliveryInfoScenario,   // 6. Luồng nhấn nút Thanh toán
    viewMenuScenario,       // 7. Xem Menu
    askPriceScenario,       // 8. Hỏi giá
    recommendationScenario, // 9. Gợi ý
    comboScenario,
    promotionScenario,
    greetingScenario,       // 10. Chào hỏi (để sau cùng vì pattern rộng)
    deliveryScenario,
    storeInfoScenario,
    memberScenario,
    feedbackScenario,
    complaintScenario
  ],
  getStatusEmoji,
  getCachedFoods,
  parseDeliveryInfo,
  checkoutWithDeliveryInfo
};
