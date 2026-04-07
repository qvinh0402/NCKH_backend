const { PrismaClient } = require('@prisma/client');
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
6. Đánh giá món
---------------------------------
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
    patterns: [/dat nhat/i],
    response: async () => {
      const variant = await prisma.bienTheMonAn.findFirst({
        where: { TrangThai: "Active" },
        orderBy: { GiaBan: "desc" },
        include: {
          MonAn: { select: { TenMonAn: true } }
        }
      });

      if (!variant) {
        return "Hiện chưa có dữ liệu món ăn." + getSuggestions();
      }

      return `
MÓN ĐẮT NHẤT HIỆN TẠI

Tên món: ${variant.MonAn.TenMonAn}
Giá bán: ${formatPrice(variant.GiaBan)}

Đây là món có giá cao nhất trong danh mục đang kinh doanh.
`
      + getSuggestions();
    }
  },

  // =====================================================
  // 2️⃣ XEM MÓN RẺ NHẤT
  // =====================================================
  {
    name: "Xem món rẻ nhất",
    patterns: [/re nhat/i],
    response: async () => {
      const variant = await prisma.bienTheMonAn.findFirst({
        where: { TrangThai: "Active" },
        orderBy: { GiaBan: "asc" },
        include: {
          MonAn: { select: { TenMonAn: true } }
        }
      });

      if (!variant) {
        return "Hiện chưa có dữ liệu món ăn." + getSuggestions();
      }

      return `
MÓN RẺ NHẤT HIỆN TẠI

Tên món: ${variant.MonAn.TenMonAn}
Giá bán: ${formatPrice(variant.GiaBan)}

Đây là món có mức giá tiết kiệm nhất hiện đang bán.
`
      + getSuggestions();
    }
  },

  // =====================================================
  // 3️⃣ XEM MÓN BÁN CHẠY
  // =====================================================
  {
    name: "Xem món bán chạy",
    patterns: [/ban chay|co gi ngon|nen an gi/i],
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
        include: {
          MonAn: { select: { TenMonAn: true } }
        }
      });

      if (!variant) {
        return "Không tìm thấy thông tin món bán chạy." + getSuggestions();
      }

      return `
MÓN BÁN CHẠY NHẤT

Tên món: ${variant.MonAn.TenMonAn}

Đây là món được khách hàng đặt nhiều nhất trong thời gian gần đây.
`
      + getSuggestions();
    }
  },

  // =====================================================
  // 4️⃣ HƯỚNG DẪN ĐẶT HÀNG
  // =====================================================
  {
    name: "Hướng dẫn đặt hàng",
    patterns: [/dat hang|huong dan dat/i],
    response: async () => {
      return `
HƯỚNG DẪN ĐẶT HÀNG

Bước 1: Nhập tên món + số lượng
Ví dụ:
"Cho tôi 2 Pizza Hải Sản"

Bước 2: Kiểm tra giỏ hàng
Gõ: "Xem giỏ hàng"

Bước 3: Cung cấp thông tin giao hàng:
- Họ và tên
- Số điện thoại
- Địa chỉ nhận hàng

Phương thức thanh toán:
- Thanh toán khi nhận hàng (COD)

Sau khi đặt thành công, hệ thống sẽ cung cấp mã đơn hàng để bạn theo dõi.
`
      + getSuggestions();
    }
  },

  // =====================================================
  // 5️⃣ CÁCH KIỂM TRA ĐƠN HÀNG
  // =====================================================
  {
    name: "Cách kiểm tra đơn hàng",
    patterns: [/kiem tra don/i],
    response: async () => {
      return `
KIỂM TRA TRẠNG THÁI ĐƠN HÀNG

Bước 1: Nhập cú pháp:
"Kiểm tra đơn 0901234567"

Trong đó:
- 0901234567 là số điện thoại bạn dùng khi đặt hàng.

Bước 2: Hệ thống sẽ hiển thị:
- Mã đơn
- Trạng thái (Đang xử lý / Đang giao / Hoàn thành)
- Tổng tiền

Lưu ý:
Số điện thoại phải trùng với thông tin lúc đặt hàng.
`
      + getSuggestions();
    }
  },

  // =====================================================
  // 6️⃣ ĐÁNH GIÁ MÓN
  // =====================================================
  {
    name: "Đánh giá món",
    patterns: [/danh gia/i],
    response: async () => {
      return `
ĐÁNH GIÁ MÓN ĂN

Bạn có thể gửi đánh giá theo cú pháp:
"Đánh giá Pizza Hải Sản 5 sao"

Hoặc:
"Đánh giá Burger bò: rất ngon"

Hệ thống sẽ ghi nhận:
- Tên món
- Nội dung đánh giá
- Mức độ hài lòng

Phản hồi của bạn giúp chúng tôi cải thiện chất lượng dịch vụ.

Cảm ơn bạn đã ủng hộ ❤️
`
      + getSuggestions();
    }
  }

];

module.exports = { scenarios };