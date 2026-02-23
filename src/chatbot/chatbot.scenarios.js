// Chatbot Scenarios for Pizza Delivery System
// Các kịch bản xử lý yêu cầu từ khách hàng

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ============================================
// 1. KỊCH BẢN XEM MENU / SẢN PHẨM
// ============================================
const viewMenuScenario = {
  name: 'viewMenu',
  patterns: [
    /có.*gì.*menu/i,
    /menu.*là.*gì/i,
    /các.*loại.*pizza/i,
    /danh.*sách.*món/i,
    /xem.*menu/i,
    /pizza.*gì.*ngon/i,
    /có.*gì.*để.*ăn/i
  ],
  response: async (userMessage, session) => {
    try {
      const foods = await prisma.monAn.findMany({
        where: { TrangThai: 'Active' },
        include: {
          LoaiMonAn: true,
          BienTheMonAn: {
            include: { Size: true },
            where: { TrangThai: 'Active' }
          }
        },
        orderBy: { MaMonAn: 'asc' }
      });

      if (!foods.length) {
        return '❌ Menu hiện không có sản phẩm nào. Vui lòng quay lại sau.';
      }

      const grouped = foods.reduce((acc, food) => {
        const category = food.LoaiMonAn.TenLoaiMonAn;
        if (!acc[category]) acc[category] = [];
        acc[category].push(food);
        return acc;
      }, {});

      let response = '📋 **MENU CỦA CHÚNG TÔI:**\n\n';
      Object.entries(grouped).forEach(([category, items]) => {
        response += `**${category}**\n`;
        items.forEach(item => {
          const price = item.BienTheMonAn[0]?.GiaBan || 'Liên hệ';
          response += `• ${item.TenMonAn} - ${price.toLocaleString('vi-VN')} đ\n`;
        });
        response += '\n';
      });

      response += '💬 Bạn muốn biết giá chi tiết về sản phẩm nào? Hỏi tôi nhé!';
      return response;
    } catch (error) {
      console.error('Error in viewMenu:', error);
      return '❌ Có lỗi khi tải menu. Vui lòng thử lại sau.';
    }
  }
};

// ============================================
// 2. KỊCH BẢN HỎI GIÁ CẢ
// ============================================
const askPriceScenario = {
  name: 'askPrice',
  patterns: [
    /giá.*(pizza|mì|khoai|pepsi|nước|combo).*/i,
    /bao.*nhiêu.*tiền.*/i,
    /.*giá.*bao.*nhiêu/i,
    /chi.*phí.*cho/i,
    /tính.*tiền.*/i
  ],
  response: async (userMessage, session) => {
    try {
      // Tìm tên sản phẩm trong tin nhắn
      const foods = await prisma.monAn.findMany({
        where: { TrangThai: 'Active' },
        include: { BienTheMonAn: { include: { Size: true } } }
      });

      const mentionedFood = foods.find(f =>
        userMessage.toLowerCase().includes(f.TenMonAn.toLowerCase())
      );

      if (!mentionedFood) {
        return '🤔 Bạn có thể nói rõ hơn sản phẩm nào? Tôi có:\n• Pizza\n• Mì Ý\n• Khoai Tây Chiên\n• Pepsi';
      }

      let priceInfo = `💰 **${mentionedFood.TenMonAn}**\n\n`;
      mentionedFood.BienTheMonAn.forEach(variant => {
        const size = variant.Size?.TenSize || 'Standard';
        const price = variant.GiaBan.toLocaleString('vi-VN');
        priceInfo += `• ${size}: ${price} đ\n`;
      });

      return priceInfo;
    } catch (error) {
      console.error('Error in askPrice:', error);
      return '❌ Không thể lấy thông tin giá. Vui lòng thử lại.';
    }
  }
};

// ============================================
// 3. KỊCH BẢN ĐẶT HÀNG
// ============================================
const orderScenario = {
  name: 'order',
  patterns: [
    /muốn.*đặt.*/i,
    /cho.*tôi.*/i,
    /đặt.*/i,
    /muốn.*mua.*/i,
    /order.*/i,
    /tôi.*muốn.*/i
  ],
  response: async (userMessage, session) => {
    try {
      // Phân tích yêu cầu đặt hàng
      const foods = await prisma.monAn.findMany({
        where: { TrangThai: 'Active' },
        include: { BienTheMonAn: { include: { Size: true } } }
      });

      const orderItems = [];
      let orderSummary = '🛒 **ĐƠN HÀNG CỦA BẠN:**\n\n';
      let totalPrice = 0;

      foods.forEach(food => {
        if (userMessage.toLowerCase().includes(food.TenMonAn.toLowerCase())) {
          const qty = parseInt(userMessage.match(/(\d+)\s*(?:cái|cái|chiếc)/)?.[1]) || 1;
          const variant = food.BienTheMonAn[0];
          if (variant) {
            const subtotal = variant.GiaBan * qty;
            orderSummary += `${qty}x ${food.TenMonAn}\n`;
            orderSummary += `  💵 ${subtotal.toLocaleString('vi-VN')} đ\n\n`;
            totalPrice += subtotal;
            orderItems.push({ ...food, qty, variant });
          }
        }
      });

      if (!orderItems.length) {
        return '❓ Tôi chưa hiểu bạn muốn đặt gì. Bạn có thể nói rõ hơn không?\nVí dụ: "Cho tôi 1 Pizza Hải Sản"';
      }

      session.orderCart = orderItems;
      session.totalPrice = totalPrice;

      orderSummary += `**━━━━━━━━━━━━━━━━**\n`;
      orderSummary += `**Tổng cộng: ${totalPrice.toLocaleString('vi-VN')} đ**\n\n`;
      orderSummary += '✅ Bạn muốn:\n';
      orderSummary += '1️⃣ Thêm món khác\n';
      orderSummary += '2️⃣ Thanh toán ngay\n';
      orderSummary += '3️⃣ Hủy đơn';

      return orderSummary;
    } catch (error) {
      console.error('Error in order:', error);
      return '❌ Có lỗi khi xử lý đơn hàng. Vui lòng thử lại.';
    }
  }
};

// ============================================
// 4. KỊCH BẢN HỎI VỀ COMBO
// ============================================
const comboScenario = {
  name: 'combo',
  patterns: [
    /combo.*/i,
    /gói.*/i,
    /bộ.*/i,
    /combo.*nào/i
  ],
  response: async (userMessage, session) => {
    try {
      const combos = await prisma.combo.findMany({
        where: { TrangThai: 'Active' },
        include: {
          Combo_ChiTiet: {
            include: { BienTheMonAn: { include: { MonAn: true } } }
          }
        }
      });

      if (!combos.length) {
        return '😔 Hiện tại chúng tôi không có combo nào. Vui lòng xem menu thường.';
      }

      let comboInfo = '🎁 **CÁC COMBO ĐẶC BIỆT:**\n\n';
      combos.forEach(combo => {
        comboInfo += `**${combo.TenCombo}**\n`;
        comboInfo += `${combo.MoTa || 'Combo hấp dẫn'}\n`;
        comboInfo += `💰 Giá: ${combo.GiaCombo.toLocaleString('vi-VN')} đ\n`;
        comboInfo += `📝 Bao gồm:\n`;
        
        combo.Combo_ChiTiet.forEach(item => {
          comboInfo += `  • ${item.BienTheMonAn.MonAn.TenMonAn} (x${item.SoLuong})\n`;
        });
        comboInfo += '\n';
      });

      return comboInfo;
    } catch (error) {
      console.error('Error in combo:', error);
      return '❌ Không thể lấy thông tin combo.';
    }
  }
};

// ============================================
// 5. KỊCH BẢN HỎI VỀ KHUYẾN MÃI
// ============================================
const promotionScenario = {
  name: 'promotion',
  patterns: [
    /khuyến.*mãi/i,
    /giảm.*giá/i,
    /voucher/i,
    /mã.*code/i,
    /có.*gì.*rẻ/i
  ],
  response: async (userMessage, session) => {
    try {
      const now = new Date();
      const promotions = await prisma.khuyenMai.findMany({
        where: {
          TrangThai: 'Active',
          KMBatDau: { lte: now },
          KMKetThuc: { gte: now }
        }
      });

      const vouchers = await prisma.voucher.findMany({
        where: {
          TrangThai: 'Active',
          NgayBatDau: { lte: now },
          NgayKetThuc: { gte: now }
        }
      });

      let promoInfo = '🎉 **KHUYẾN MÃI HIỆN TẠI:**\n\n';

      if (promotions.length > 0) {
        promoInfo += '**📌 Khuyến mãi sản phẩm:**\n';
        promotions.forEach(promo => {
          const discount = promo.KMLoai === 'PERCENT'
            ? `Giảm ${promo.KMGiaTri}%`
            : `Giảm ${promo.KMGiaTri.toLocaleString('vi-VN')} đ`;
          promoInfo += `• **${promo.TenKhuyenMai}** - ${discount}\n`;
        });
      }

      if (vouchers.length > 0) {
        promoInfo += '\n**🎟️ Mã voucher:**\n';
        vouchers.forEach(voucher => {
          promoInfo += `• **${voucher.MaVoucher}**: ${voucher.MoTa}\n`;
        });
      }

      if (promotions.length === 0 && vouchers.length === 0) {
        promoInfo = '😕 Hiện tại không có khuyến mãi nào. Hãy quay lại sau nhé!';
      }

      return promoInfo;
    } catch (error) {
      console.error('Error in promotion:', error);
      return '❌ Không thể lấy thông tin khuyến mãi.';
    }
  }
};

// ============================================
// 6. KỊCH BẢN KIỂM TRA TRẠNG THÁI ĐƠN HÀNG
// ============================================
const orderStatusScenario = {
  name: 'orderStatus',
  patterns: [
    /đơn.*hàng.*của.*tôi/i,
    /kiểm.*tra.*đơn/i,
    /trạng.*thái.*đơn/i,
    /đơn.*(\d+)/i,
    /giao.*hàng.*chưa/i,
    /đơn.*ở.*đâu/i
  ],
  response: async (userMessage) => {
    try {
      const orderIdMatch = userMessage.match(/(\d+)/);
      if (!orderIdMatch) {
        return '🔍 Vui lòng cung cấp mã đơn hàng của bạn. Ví dụ: "Đơn 100"';
      }

      const orderId = parseInt(orderIdMatch[1]);
      const order = await prisma.donHang.findUnique({
        where: { MaDonHang: orderId },
        include: {
          LichSuTrangThaiDonHang: {
            orderBy: { ThoiGianCapNhat: 'desc' },
            take: 1
          },
          ChiTietDonHang: {
            include: { BienTheMonAn: { include: { MonAn: true } } }
          }
        }
      });

      if (!order) {
        return `❌ Không tìm thấy đơn hàng #${orderId}`;
      }

      const status = order.LichSuTrangThaiDonHang[0]?.TrangThai || 'Chưa rõ';
      const statusEmoji = getStatusEmoji(status);

      let orderInfo = `📦 **ĐƠN HÀNG #${order.MaDonHang}**\n\n`;
      orderInfo += `${statusEmoji} **Trạng thái:** ${status}\n`;
      orderInfo += `📅 **Ngày đặt:** ${new Date(order.NgayDat).toLocaleDateString('vi-VN')}\n`;
      orderInfo += `💰 **Tổng tiền:** ${order.TongTien.toLocaleString('vi-VN')} đ\n`;
      
      if (order.ThoiGianGiaoDuKien) {
        orderInfo += `⏰ **Dự kiến giao:** ${new Date(order.ThoiGianGiaoDuKien).toLocaleDateString('vi-VN')}\n`;
      }

      if (order.SoNhaDuongGiaoHang) {
        orderInfo += `📍 **Địa chỉ giao:** ${order.SoNhaDuongGiaoHang}, ${order.PhuongXaGiaoHang}, ${order.QuanHuyenGiaoHang}\n`;
      }

      orderInfo += '\n**Sản phẩm:**\n';
      order.ChiTietDonHang.forEach(item => {
        orderInfo += `• ${item.BienTheMonAn.MonAn.TenMonAn} (x${item.SoLuong})\n`;
      });

      return orderInfo;
    } catch (error) {
      console.error('Error in orderStatus:', error);
      return '❌ Có lỗi khi kiểm tra đơn hàng.';
    }
  }
};

// ============================================
// 7. KỊCH BẢN THANH TOÁN
// ============================================
const paymentScenario = {
  name: 'payment',
  patterns: [
    /thanh.*toán/i,
    /trả.*tiền/i,
    /phương.*thức.*thanh/i,
    /cách.*thanh.*toán/i,
    /tôi.*muốn.*trả/i
  ],
  response: async (session) => {
    if (!session.orderCart || session.orderCart.length === 0) {
      return '❌ Bạn chưa có đơn hàng nào. Vui lòng đặt hàng trước.';
    }

    let paymentInfo = '💳 **PHƯƠNG THỨC THANH TOÁN:**\n\n';
    paymentInfo += '1️⃣ **Tiền Mặt**\n';
    paymentInfo += '   • Thanh toán khi nhận hàng\n';
    paymentInfo += '   • Không cần trao đổi online\n\n';
    
    paymentInfo += '2️⃣ **Chuyển Khoản (VNPay)**\n';
    paymentInfo += '   • Thanh toán trực tuyến an toàn\n';
    paymentInfo += '   • Hỗ trợ các ngân hàng lớn\n\n';

    paymentInfo += '**Tổng tiền cần thanh toán:** ' + 
                   (session.totalPrice || 0).toLocaleString('vi-VN') + ' đ\n\n';
    paymentInfo += 'Bạn chọn phương thức nào? (Gõ "tiền mặt" hoặc "chuyển khoản")';

    return paymentInfo;
  }
};

// ============================================
// 8. KỊCH BẢN KHIẾU NẠI/HỖ TRỢ
// ============================================
const complaintScenario = {
  name: 'complaint',
  patterns: [
    /khiếu.*nại/i,
    /không.*hài.*lòng/i,
    /sai.*đơn/i,
    /giao.*trễ/i,
    /hỏng.*rồi/i,
    /cần.*giúp/i,
    /hỗ.*trợ/i
  ],
  response: async (userMessage, session) => {
    let response = '😔 **CHÚNG TÔI XIN LỖI!**\n\n';
    response += 'Chúng tôi hiểu bạn gặp vấn đề. Để giải quyết:\n\n';
    response += '1️⃣ **Cung cấp mã đơn hàng** của bạn\n';
    response += '2️⃣ **Mô tả chi tiết** vấn đề gặp phải\n';
    response += '3️⃣ **Chúng tôi sẽ liên hệ trong vòng 24h**\n\n';
    
    response += '📞 **LIÊN HỆ TRỰC TIẾP:**\n';
    response += '• **Hà Nội:** 02411112222\n';
    response += '• **TP. HCM:** 02833334444\n\n';
    
    response += '⏰ **Giờ hỗ trợ:** 8:00 - 22:00 hàng ngày';

    return response;
  }
};

// ============================================
// 9. KỊCH BẢN ĐÁNH GIÁ/FEEDBACK
// ============================================
const feedbackScenario = {
  name: 'feedback',
  patterns: [
    /đánh.*giá/i,
    /nhận.*xét/i,
    /feedback/i,
    /ý.*kiến/i,
    /để.*lại.*comment/i
  ],
  response: async (userMessage, session) => {
    let feedbackPrompt = '⭐ **ĐÁNH GIÁ SẢN PHẨM/DỊCH VỤ**\n\n';
    feedbackPrompt += 'Chúng tôi rất muốn nghe ý kiến của bạn!\n\n';
    feedbackPrompt += '📝 **Vui lòng cung cấp:**\n';
    feedbackPrompt += '1️⃣ Mã đơn hàng (hoặc sản phẩm)\n';
    feedbackPrompt += '2️⃣ Số sao (1-5 ⭐)\n';
    feedbackPrompt += '3️⃣ Nhận xét chi tiết\n\n';
    feedbackPrompt += '📌 **Ví dụ:**\n';
    feedbackPrompt += '"Đơn 100, 5 sao, Pizza rất ngon, giao nhanh!"';

    return feedbackPrompt;
  }
};

// ============================================
// 10. KỊCH BẢN CHÀO HỎI / MẶC ĐỊNH
// ============================================
const greetingScenario = {
  name: 'greeting',
  patterns: [
    /xin.*chào/i,
    /hello/i,
    /hi/i,
    /làm.*sao/i,
    /giúp.*tôi/i,
    /tôi.*cần.*gì/i
  ],
  response: async (userMessage, session) => {
    let response = '👋 **CHÀO BẠN!** Chào mừng đến với **SECRET PIZZA**\n\n';
    response += '😊 Tôi có thể giúp bạn:\n\n';
    response += '🍕 Xem menu & giá cả\n';
    response += '🛒 Đặt hàng & thanh toán\n';
    response += '📦 Kiểm tra trạng thái đơn\n';
    response += '🎁 Thông tin khuyến mãi\n';
    response += '💬 Khiếu nại & hỗ trợ\n';
    response += '⭐ Để lại đánh giá\n\n';
    response += 'Bạn muốn làm gì nhỉ? 😄';

    return response;
  }
};

// ============================================
// HÀM HỖ TRỢ
// ============================================
function getStatusEmoji(status) {
  const statusMap = {
    'Đang chờ xác nhận': '⏳',
    'Đang xử lý': '🔄',
    'Chờ giao hàng': '📦',
    'Đang giao': '🚴',
    'Đã giao': '✅',
    'Khách hàng đã hủy': '❌',
    'Đã hủy': '❌',
    'Chờ thanh toán': '💳',
    'Chờ duyệt đơn': '⏳'
  };
  return statusMap[status] || '❓';
}

function parseOrderRequest(message) {
  // Phân tích cơ bản yêu cầu đặt hàng
  const quantities = message.match(/(\d+)\s*(?:cái|chiếc|ly|đĩa)/g);
  return quantities || [];
}

// ============================================
// EXPORT
// ============================================
module.exports = {
  scenarios: [
    greetingScenario,
    viewMenuScenario,
    askPriceScenario,
    comboScenario,
    promotionScenario,
    orderScenario,
    orderStatusScenario,
    paymentScenario,
    feedbackScenario,
    complaintScenario
  ],
  getStatusEmoji,
  parseOrderRequest
};
