const { PrismaClient } = require('@prisma/client');
const { callAI } = require('../services/aiService');
const prisma = new PrismaClient();

// =============================
// HELPER: GỢI Ý
// =============================
function getSuggestions() {
  return `
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
    patterns: [
      /đắt nhất/i,
      /dat nhat/i,
      /món đắt/i,
      /mon dat/i
    ],

    response: async () => {
      const variant = await prisma.bienTheMonAn.findFirst({
        where: {
          TrangThai: "Active",
          MonAn: {
            MaLoaiMonAn: 1 // Pizza only
          }
        },
        orderBy: { GiaBan: "desc" },
        include: {
          MonAn: {
            select: {
              TenMonAn: true,
              MonAn_DanhMuc: {
                select: {
                  DanhMuc: {
                    select: { TenDanhMuc: true }
                  }
                }
              }
            }
          }
        }
      });

      if (!variant) {
        return "Hiện chưa có dữ liệu pizza nào." + getSuggestions();
      }

      const category = variant.MonAn.MonAn_DanhMuc[0]?.DanhMuc?.TenDanhMuc || "Khác";
      return `
PIZZA ĐẮT NHẤT HIỆN TẠI

Tên món: ${variant.MonAn.TenMonAn}
Loại: ${category}
Giá bán: ${formatPrice(variant.GiaBan)}

Đây là chiếc pizza có giá cao nhất trong danh mục đang kinh doanh.
` + getSuggestions();
    }
  },

  // =====================================================
  // 2️⃣ XEM MÓN RẺ NHẤT
  // =====================================================
  {
    name: "Xem món rẻ nhất",
    patterns: [
      /rẻ nhất/i,
      /re nhat/i,
      /món rẻ/i,
      /mon re/i
    ],

    response: async () => {
      const variant = await prisma.bienTheMonAn.findFirst({
        where: {
          TrangThai: "Active",
          MonAn: {
            MaLoaiMonAn: 1 // Pizza only
          }
        },
        orderBy: { GiaBan: "asc" },
        include: {
          MonAn: {
            select: {
              TenMonAn: true,
              MonAn_DanhMuc: {
                select: {
                  DanhMuc: {
                    select: { TenDanhMuc: true }
                  }
                }
              }
            }
          }
        }
      });

      if (!variant) {
        return "Hiện chưa có dữ liệu pizza nào." + getSuggestions();
      }

      const category = variant.MonAn.MonAn_DanhMuc[0]?.DanhMuc?.TenDanhMuc || "Khác";
      return `
PIZZA RẺ NHẤT HIỆN TẠI

Tên món: ${variant.MonAn.TenMonAn}
Loại: ${category}
Giá bán: ${formatPrice(variant.GiaBan)}

Đây là chiếc pizza có mức giá tiết kiệm nhất hiện đang bán.
` + getSuggestions();
    }
  },

  // =====================================================
  // 3️⃣ XEM MÓN BÁN CHẠY
  // =====================================================
  {
    name: "Xem món bán chạy",
    patterns: [
      /bán chạy/i,
      /ban chay/i,
      /món ngon/i,
      /mon ngon/i,
      /nên ăn gì/i,
      /nen an gi/i
    ],

    response: async () => {
      const bestSeller = await prisma.chiTietDonHang.groupBy({
        by: ['MaBienThe'],
        _sum: { SoLuong: true },
        orderBy: { _sum: { SoLuong: 'desc' } },
        take: 1,
        where: {
          BienTheMonAn: {
            MonAn: {
              MaLoaiMonAn: 1 // Pizza only
            }
          }
        }
      });

      if (!bestSeller.length) {
        return "Chưa có dữ liệu bán hàng cho pizza." + getSuggestions();
      }

      const variant = await prisma.bienTheMonAn.findUnique({
        where: { MaBienThe: bestSeller[0].MaBienThe },
        include: {
          MonAn: {
            select: {
              TenMonAn: true,
              MonAn_DanhMuc: {
                select: {
                  DanhMuc: {
                    select: { TenDanhMuc: true }
                  }
                }
              }
            }
          }
        }
      });

      if (!variant) {
        return "Không tìm thấy thông tin pizza bán chạy." + getSuggestions();
      }

      const category = variant.MonAn.MonAn_DanhMuc[0]?.DanhMuc?.TenDanhMuc || "Khác";
      return `
PIZZA BÁN CHẠY NHẤT

Tên món: ${variant.MonAn.TenMonAn}
Loại: ${category}

Đây là chiếc pizza được khách hàng đặt nhiều nhất trong thời gian gần đây.
` + getSuggestions();
    }
  },

  // =====================================================
  // 4️⃣ HƯỚNG DẪN ĐẶT HÀNG
  // =====================================================
  {
    name: "Hướng dẫn đặt hàng",
    patterns: [
      /dat hang/i,
      /đặt hàng/i,
      /mua pizza/i,
      /huong dan dat/i,
      /hướng dẫn đặt/i,
      /lam sao de dat hang/i
    ],

    response: async () => {

      return `
HƯỚNG DẪN ĐẶT HÀNG TẠI SECRET PIZZA

Bạn có thể đặt món rất dễ dàng chỉ với vài bước:

BƯỚC 1: MỞ MENU MÓN ĂN

Vào trang "Menu" để xem danh sách món pizza và các món khác.

BƯỚC 2: CHỌN MÓN ĂN

Chọn món bạn muốn đặt.

Tại trang chi tiết món ăn bạn có thể:
• Chọn kích thước   
• Chọn loại đế bánh   
• Chọn số lượng  

Sau đó nhấn nút "Thêm vào giỏ"

BƯỚC 3: KIỂM TRA GIỎ HÀNG

Vào trang "Giỏ hàng" để xem:
• Danh sách món đã chọn  
• Số lượng  
• Tổng tiền  

Bạn có thể:
• Tăng / giảm số lượng  
• Xóa món  
• Tiếp tục mua sắm  

Sau đó nhấn nút "Thanh toán"

BƯỚC 4: NHẬP THÔNG TIN GIAO HÀNG

Tại trang Thanh toán, bạn cần nhập:
• Họ tên  
• Số điện thoại  
• Địa chỉ giao hàng  
• Thành phố / Quận / Phường  
• Ghi chú (nếu có)

BƯỚC 5: CHỌN PHƯƠNG THỨC THANH TOÁN

Hiện hệ thống hỗ trợ:
• Tiền mặt (Thanh toán khi nhận hàng)  
• Chuyển khoản ngân hàng

BƯỚC 6: XÁC NHẬN ĐẶT HÀNG

Nhấn nút "Đặt hàng" để hoàn tất quá trình đặt món.

Sau khi đặt thành công, hệ thống sẽ hiển thị thông báo:
"Ho Ho Ho! Đơn hàng đã bay đi!"

Bạn có thể:
• Tiếp tục đặt món  
• Theo dõi đơn hàng

Cảm ơn bạn đã sử dụng Secret Pizza ❤️

LƯU Ý

• Đăng nhập tài khoản giúp lưu thông tin đặt hàng nhanh hơn  
• Nếu không đăng nhập, bạn vẫn có thể đặt hàng bình thường
` + getSuggestions();

    }
  },

  // =====================================================
  // 5️⃣ CÁCH KIỂM TRA ĐƠN HÀNG
  // =====================================================
  {
    name: "Cách kiểm tra đơn hàng",

    patterns: [
    /kiểm tra đơn/i,
    /kiem tra don/i,
    /tra cứu đơn/i,
    /tra cuu don/i,
    /xem đơn hàng/i,
    /xem don hang/i,
    /theo dõi đơn/i,
    /theo doi don/i
    ],

    response: async () => {

      return `
HƯỚNG DẪN KIỂM TRA ĐƠN HÀNG

Bạn có thể theo dõi đơn hàng theo 2 cách:

CÁCH 1: TRA CỨU BẰNG SỐ ĐIỆN THOẠI

Bước 1: Vào trang "Đơn hàng"

Bước 2: Nhập số điện thoại đã dùng khi đặt hàng

Ví dụ: 0909123456

Bước 3: Nhấn nút "Tra cứu"

Hệ thống sẽ hiển thị:
• Mã đơn hàng  
• Ngày đặt  
• Trạng thái đơn (Đang xử lý / Đã giao)  
• Trạng thái thanh toán  
• Tổng tiền  

Bạn có thể bấm "Chi tiết" để xem đầy đủ thông tin đơn hàng.

CÁCH 2: ĐĂNG NHẬP TÀI KHOẢN

Nếu bạn đăng nhập, hệ thống sẽ tự động hiển thị toàn bộ đơn hàng của bạn trong mục "Đơn hàng".

LƯU Ý

• Số điện thoại phải trùng với số khi đặt hàng  
• Nếu không thấy đơn hàng, hãy kiểm tra lại số điện thoại hoặc liên hệ bộ phận hỗ trợ để được giúp đỡ.

Cảm ơn bạn đã sử dụng Secret Pizza ❤️
` + getSuggestions();

    }
  },

  // =====================================================
  // 6️⃣ ĐÁNH GIÁ MÓN
  // =====================================================
  {
    name: "Hướng dẫn đánh giá món",

    patterns: [
    /danh gia mon/i,
    /huong dan danh gia mon/i,
    /review mon/i,
    /cach danh gia mon/i
  ],

    response: async () => {

      return `
HƯỚNG DẪN ĐÁNH GIÁ MÓN ĂN

Bạn có thể đánh giá món ăn trực tiếp trên trang chi tiết sản phẩm tại Secret Pizza.

TRƯỜNG HỢP 1: BẠN CHƯA ĐĂNG NHẬP

Bước 1  
Vào trang "MENU" của cửa hàng.

Bước 2  
Chọn món ăn mà bạn muốn xem hoặc đánh giá.

Bước 3  
Cuộn xuống phần "Đánh giá sản phẩm".

Bước 4  
Nhấn nút "Đăng nhập để đánh giá".

Bước 5  
Hệ thống sẽ chuyển bạn đến trang "Đăng nhập".  
Bạn nhập:

📧 Email  
🔒 Mật khẩu  

Sau đó nhấn "Đăng nhập" để tiếp tục.

TRƯỜNG HỢP 2: BẠN ĐÃ ĐĂNG NHẬP

Bước 1  
Vào trang MENU.

Bước 2  
Chọn món ăn mà bạn muốn đánh giá.

Bước 3  
Cuộn xuống phần "Đánh giá sản phẩm".

Bước 4  
Nhấn nút "Viết đánh giá".

Bước 5  
Nhập thông tin đánh giá:

⭐ Chọn số sao (1 - 5 sao)  
✏️ Nhập nhận xét về món ăn

Ví dụ:
- "Pizza rất ngon"
- "Đế bánh giòn và nhiều topping"
- "Giao hàng nhanh và bánh nóng"

Bước 6  
Nhấn "Gửi đánh giá" để hoàn tất.

KẾT QUẢ

Sau khi gửi thành công:

✔️ Đánh giá của bạn sẽ hiển thị trong danh sách đánh giá của sản phẩm  
✔️ Người dùng khác có thể xem nhận xét của bạn  

Cảm ơn bạn đã chia sẻ trải nghiệm với Secret Pizza ❤️

` + getSuggestions();

    }
  },

  // =====================================================
  // 7️⃣ ĐÁNH GIÁ ĐƠN HÀNG
  // =====================================================
  {
    name: "Hướng dẫn đánh giá đơn hàng",

    patterns: [
      /đánh giá đơn/i,
      /danh gia don/i,
      /đánh giá đơn hàng/i,
      /danh gia don hang/i,
      /review đơn/i,
      /review don/i,
      /huong dan danh gia don/i,
      /review don/i,
      /cach danh gia don/i
    ],

    response: async () => {

      return `
HƯỚNG DẪN ĐÁNH GIÁ ĐƠN HÀNG

Bạn có thể đánh giá đơn hàng sau khi đơn đã được giao thành công.

Các bước thực hiện:

Bước 1  
Truy cập trang "Đơn hàng" trên thanh menu.

Bước 2  
Tại danh sách đơn hàng của bạn, tìm đơn cần đánh giá.

Điều kiện:
Đơn phải có trạng thái "Đã giao".

Bước 3  
Nhấn nút "Đánh giá" ở bên phải đơn hàng.

Bước 4  
Hệ thống sẽ hiển thị cửa sổ "Đánh giá đơn hàng".

Bạn cần nhập:

⭐ Số sao đánh giá (1 - 5 sao)  
✏️ Bình luận về trải nghiệm của bạn

Ví dụ bình luận:
- "Ngon, shipper giao nhanh"
- "Thức ăn nóng và rất ngon"
- "Pizza ngon nhưng giao hơi chậm"

Bước 5  
Nhấn "Gửi đánh giá" để hoàn tất.

Sau khi gửi thành công:

• Hệ thống sẽ hiển thị thông báo "Cảm ơn bạn đã đánh giá!"  
• Nút "Đánh giá" sẽ chuyển thành "Đã đánh giá"

Cảm ơn bạn đã giúp Secret Pizza cải thiện dịch vụ ❤️
` + getSuggestions();

    }
  },

  // =====================================================
  // 8️⃣ CHI NHÁNH / CỬA HÀNG
  // =====================================================
  {
    name: "Thông tin chi nhánh",
    patterns: [
      /chi nhánh/i,
      /chi nhanh/i,
      /cửa hàng/i,
      /cua hang/i,
      /địa chỉ/i,
      /dia chi/i,
      /liên hệ/i,
      /lien he/i,
      /số điện thoại/i,
      /so dien thoai/i,
      /ở đâu/i,
      /o dau/i,
      /chúng ta ở /i,
      /chung ta o /i
    ],

    response: async () => {
      try {
        // Lấy danh sách chi nhánh từ database
        const branches = await prisma.coSo.findMany({
          select: {
            MaCoSo: true,
            TenCoSo: true,
            SoDienThoai: true,
            SoNhaDuong: true,
            PhuongXa: true,
            QuanHuyen: true,
            ThanhPho: true
          },
          orderBy: { MaCoSo: 'asc' }
        });

        if (!branches || branches.length === 0) {
          return `Xin lỗi, hiện tại không có thông tin chi nhánh nào. Vui lòng liên hệ hỗ trợ.` + getSuggestions();
        }

        // Định dạng thông tin chi nhánh
        let response = `
SECRET PIZZA - DANH SÁCH CHI NHÁNH

Hiện tại chúng tôi có ${branches.length} chi nhánh tại các địa điểm sau:

`;

        branches.forEach((branch, index) => {
          response += `
${index + 1}️⃣ ${branch.TenCoSo}
   📍 Địa chỉ: ${branch.SoNhaDuong}, ${branch.PhuongXa}, ${branch.QuanHuyen}, ${branch.ThanhPho}
   📞 Điện thoại: ${branch.SoDienThoai || 'N/A'}

`;
        });

        response += `
🕐 Giờ hoạt động: 10:00 - 22:00 (Tất cả các ngày)

Bạn có thể:
• Gọi trực tiếp đến chi nhánh gần nhất
• Đặt hàng qua app, giao hàng sẽ được chuẩn bị tại chi nhánh
• Ghé thăm trực tiếp để mua

Cảm ơn bạn đã chọn Secret Pizza ❤️
`;

        return response + getSuggestions();

      } catch (error) {
        console.error('[Chatbot] Chi nhánh error:', error);
        return `Xin lỗi, có lỗi khi lấy thông tin chi nhánh. Vui lòng thử lại sau.` + getSuggestions();
      }
    }
  },

  // =====================================================
  // 🤖 AI-POWERED RESPONSE (Groq)
  // =====================================================
  {
    name: "AI Response - Groq",
    patterns: [], // This is a fallback - matches anything not matched above
    isAIFallback: true,
    
    response: async (message) => {
      try {
        console.log('[Chatbot] Using AI fallback for message:', message.substring(0, 50));
        
        const context = `
Bạn là một trợ lý chatbot thân thiện cho Secret Pizza, một nhà hàng pizza tại thành phố Hồ Chí Minh, Việt Nam.
Bạn giúp khách hàng:
- Tìm kiếm và gọi món pizza, nước uống
- Hỏi về giá cả, combo
- Hướng dẫn cách đặt hàng
- Trả lời câu hỏi về cửa hàng

Hãy trả lời ngắn gọn, thân thiện, bằng tiếng Việt.
Câu hỏi từ khách: ${message}
`;

        const reply = await callAI(context, 'AUTO', {
          max_tokens: 256,
          temperature: 0.7
        });

        return reply + '\n' + getSuggestions();

      } catch (error) {
        console.error('[Chatbot AI Error]:', error.message);
        return `Xin lỗi, tôi không hiểu câu hỏi của bạn. 

Bạn có thể:
- Viết chi tiết hơn
- Chọn một trong các gợi ý dưới đây
` + getSuggestions();
      }
    }
  }

];

module.exports = { scenarios };