const { PrismaClient } = require('@prisma/client');
const { callAI } = require('../services/aiService');
const prisma = new PrismaClient();

// =============================
// HELPER: GỢI Ý
// =============================
function getSuggestions() {
  return `

---------------------------------
GỢI Ý:

1. Xem món đắt nhất
2. Xem món rẻ nhất
3. Xem món bán chạy
4. Hướng dẫn đặt hàng
5. Cách kiểm tra đơn hàng
6. Hướng dẫn đánh giá món
7. Hướng dẫn đánh giá đơn hàng
8. Thông tin chi nhánh

`;
}

// =============================
// HELPER: FORMAT GIÁ
// =============================
function formatPrice(price) {
  return Number(price).toLocaleString('vi-VN') + "đ";
}

// =============================
// SCENARIOS
// =============================
const scenarios = [

  // =====================================================
  // 1️⃣ XEM MÓN ĐẮT NHẤT
  // =====================================================
  {
    name: "Xem món đắt nhất",
    patterns: [/đắt nhất/i, /dat nhat/i, /món đắt/i, /mon dat/i],

    response: async () => {
      const variant = await prisma.bienTheMonAn.findFirst({
        where: { TrangThai: "Active" },
        orderBy: { GiaBan: "desc" },
        include: { MonAn: { select: { TenMonAn: true } } }
      });

      if (!variant) {
        return "Hiện chưa có dữ liệu món ăn." + getSuggestions();
      }

      return `
MÓN ĐẮT NHẤT HIỆN TẠI

Tên món: ${variant.MonAn.TenMonAn}
Giá bán: ${formatPrice(variant.GiaBan)}

Đây là món có giá cao nhất trong danh mục đang kinh doanh.
` + getSuggestions();
    }
  },

  // =====================================================
  // 2️⃣ XEM MÓN RẺ NHẤT
  // =====================================================
  {
    name: "Xem món rẻ nhất",
    patterns: [/rẻ nhất/i, /re nhat/i, /món rẻ/i, /mon re/i],

    response: async () => {
      const variant = await prisma.bienTheMonAn.findFirst({
        where: { TrangThai: "Active" },
        orderBy: { GiaBan: "asc" },
        include: { MonAn: { select: { TenMonAn: true } } }
      });

      if (!variant) {
        return "Hiện chưa có dữ liệu món ăn." + getSuggestions();
      }

      return `
MÓN RẺ NHẤT HIỆN TẠI

Tên món: ${variant.MonAn.TenMonAn}
Giá bán: ${formatPrice(variant.GiaBan)}

Đây là món có mức giá tiết kiệm nhất hiện đang bán.
` + getSuggestions();
    }
  },

  // =====================================================
  // 3️⃣ XEM MÓN BÁN CHẠY
  // =====================================================
  {
    name: "Xem món bán chạy",
    patterns: [/bán chạy/i, /ban chay/i, /món ngon/i, /mon ngon/i, /nên ăn gì/i, /nen an gi/i],

    response: async () => {
      const bestSeller = await prisma.chiTietDonHang.groupBy({
        by: ['MaBienThe'],
        _sum: { SoLuong: true },
        orderBy: { _sum: { SoLuong: 'desc' } },
        take: 1
      });

      if (!bestSeller.length) {
        return "Chưa có dữ liệu bán hàng." + getSuggestions();
      }

      const variant = await prisma.bienTheMonAn.findUnique({
        where: { MaBienThe: bestSeller[0].MaBienThe },
        include: { MonAn: { select: { TenMonAn: true } } }
      });

      if (!variant) {
        return "Không tìm thấy thông tin món bán chạy." + getSuggestions();
      }

      return `
MÓN BÁN CHẠY NHẤT

Tên món: ${variant.MonAn.TenMonAn}

Đây là món được khách hàng đặt nhiều nhất trong thời gian gần đây.
` + getSuggestions();
    }
  },

  // =====================================================
  // 4️⃣ HƯỚNG DẪN ĐẶT HÀNG
  // =====================================================
  {
    name: "Hướng dẫn đặt hàng",
    patterns: [/dat hang/i, /đặt hàng/i, /huong dan dat/i, /hướng dẫn đặt/i],

    response: async () => {
      return `
HƯỚNG DẪN ĐẶT HÀNG

Bạn có thể đặt món rất dễ dàng chỉ với vài bước:


BƯỚC 1: MỞ MENU

Vào trang "Menu" để xem danh sách món ăn.


BƯỚC 2: CHỌN MÓN

Chọn món bạn muốn đặt.

• Chọn kích thước  
• Chọn loại đế bánh  
• Chọn số lượng  

Nhấn "Thêm vào giỏ"


BƯỚC 3: KIỂM TRA GIỎ HÀNG

• Xem danh sách món  
• Cập nhật số lượng  
• Xem tổng tiền  

Nhấn "Thanh toán"


BƯỚC 4: NHẬP THÔNG TIN

• Họ tên  
• Số điện thoại  
• Địa chỉ  


BƯỚC 5: THANH TOÁN

• Tiền mặt  
• Chuyển khoản  


BƯỚC 6: XÁC NHẬN

Nhấn "Đặt hàng" để hoàn tất.

` + getSuggestions();
    }
  },

  // =====================================================
  // 5️⃣ KIỂM TRA ĐƠN
  // =====================================================
  {
    name: "Cách kiểm tra đơn hàng",
    patterns: [/kiểm tra đơn/i, /kiem tra don/i, /tra cứu/i, /theo dõi/i],

    response: async () => {
      return `
KIỂM TRA ĐƠN HÀNG

CÁCH 1: BẰNG SĐT

Bước 1: Vào trang "Đơn hàng"  

Bước 2: Nhập số điện thoại  

Bước 3: Nhấn "Tra cứu"  


CÁCH 2: ĐĂNG NHẬP

Xem trực tiếp trong mục "Đơn hàng"

` + getSuggestions();
    }
  },

  // =====================================================
  // 6️⃣ ĐÁNH GIÁ MÓN
  // =====================================================
  {
    name: "Hướng dẫn đánh giá món",
    patterns: [/danh gia mon/i, /review mon/i],

    response: async () => {
      return `
ĐÁNH GIÁ MÓN

Bước 1: Vào MENU  

Bước 2: Chọn món  

Bước 3: Nhấn "Viết đánh giá"  

Bước 4: Chọn sao + nhập nội dung  

Bước 5: Gửi đánh giá  

` + getSuggestions();
    }
  },

  // =====================================================
  // 7️⃣ ĐÁNH GIÁ ĐƠN
  // =====================================================
  {
    name: "Hướng dẫn đánh giá đơn hàng",
    patterns: [/danh gia don/i, /review don/i],

    response: async () => {
      return `
ĐÁNH GIÁ ĐƠN HÀNG

Bước 1: Vào "Đơn hàng"  

Bước 2: Chọn đơn đã giao  

Bước 3: Nhấn "Đánh giá"  

Bước 4: Nhập sao + bình luận  

Bước 5: Gửi  

` + getSuggestions();
    }
  },

  // =====================================================
  // 8️⃣ CHI NHÁNH
  // =====================================================
  {
    name: "Thông tin chi nhánh",
    patterns: [/chi nhánh/i, /địa chỉ/i, /cửa hàng/i],

    response: async () => {
      const branches = await prisma.coSo.findMany();

      if (!branches.length) {
        return "Không có chi nhánh." + getSuggestions();
      }

      let res = `DANH SÁCH CHI NHÁNH\n`;

      branches.forEach((b, i) => {
        res += `

${i + 1}. ${b.TenCoSo}

📍 ${b.SoNhaDuong}, ${b.QuanHuyen}  
📞 ${b.SoDienThoai || 'N/A'}

`;
      });

      return res + getSuggestions();
    }
  },

  // =====================================================
  // 🤖 AI FALLBACK
  // =====================================================
  {
    name: "AI Response",
    patterns: [],
    isAIFallback: true,

    response: async (message) => {
      try {
        const reply = await callAI(message);
        return reply + '\n' + getSuggestions();
      } catch {
        return "Xin lỗi, tôi không hiểu." + getSuggestions();
      }
    }
  }
];

module.exports = { scenarios };