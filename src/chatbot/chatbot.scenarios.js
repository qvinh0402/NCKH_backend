const prisma = require('../client');

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
// HELPER: XỬ LÝ TEXT (KHÔNG DẤU)
// =============================
function removeVietnameseTones(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

function normalizeText(str) {
  return removeVietnameseTones(str)
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
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

---------------------------------

BƯỚC 1: MỞ MENU MÓN ĂN

Vào trang "Menu" để xem danh sách món pizza và các món khác.

---------------------------------

BƯỚC 2: CHỌN MÓN ĂN

Chọn món bạn muốn đặt.

Tại trang chi tiết món ăn bạn có thể:

• Chọn kích thước   
• Chọn loại đế bánh   
• Chọn số lượng  

Sau đó nhấn nút "Thêm vào giỏ"

---------------------------------

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

---------------------------------

BƯỚC 4: NHẬP THÔNG TIN GIAO HÀNG

Tại trang Thanh toán, bạn cần nhập:

• Họ tên  
• Số điện thoại  
• Địa chỉ giao hàng  
• Thành phố / Quận / Phường  
• Ghi chú (nếu có)

---------------------------------

BƯỚC 5: CHỌN PHƯƠNG THỨC THANH TOÁN

Hiện hệ thống hỗ trợ:

• Tiền mặt (Thanh toán khi nhận hàng)  
• Chuyển khoản ngân hàng

---------------------------------

BƯỚC 6: XÁC NHẬN ĐẶT HÀNG

Nhấn nút "Đặt hàng" để hoàn tất quá trình đặt món.

Sau khi đặt thành công, hệ thống sẽ hiển thị thông báo:

"Ho Ho Ho! Đơn hàng đã bay đi!"

Bạn có thể:

• Tiếp tục đặt món  
• Theo dõi đơn hàng

Cảm ơn bạn đã sử dụng Secret Pizza ❤️
---------------------------------

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

Ví dụ:
0909123456

Bước 3: Nhấn nút "Tra cứu"

Hệ thống sẽ hiển thị:

• Mã đơn hàng  
• Ngày đặt  
• Trạng thái đơn (Đang xử lý / Đã giao)  
• Trạng thái thanh toán  
• Tổng tiền  

Bạn có thể bấm "Chi tiết" để xem đầy đủ thông tin đơn hàng.

---------------------------------

CÁCH 2: ĐĂNG NHẬP TÀI KHOẢN

Nếu bạn đăng nhập, hệ thống sẽ tự động hiển thị toàn bộ đơn hàng của bạn trong mục "Đơn hàng".

---------------------------------

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

--------------------------------------------------

TRƯỜNG HỢP 1: BẠN CHƯA ĐĂNG NHẬP

Bước 1  
Vào trang **MENU** của cửa hàng.

Bước 2  
Chọn món ăn mà bạn muốn xem hoặc đánh giá.

Bước 3  
Cuộn xuống phần **Đánh giá sản phẩm**.

Bước 4  
Nhấn nút **"Đăng nhập để đánh giá"**.

Bước 5  
Hệ thống sẽ chuyển bạn đến trang **Đăng nhập**.  
Bạn nhập:

📧 Email  
🔒 Mật khẩu  

Sau đó nhấn **Đăng nhập** để tiếp tục.

--------------------------------------------------

TRƯỜNG HỢP 2: BẠN ĐÃ ĐĂNG NHẬP

Bước 1  
Vào trang **MENU**.

Bước 2  
Chọn món ăn mà bạn muốn đánh giá.

Bước 3  
Cuộn xuống phần **Đánh giá sản phẩm**.

Bước 4  
Nhấn nút **"Viết đánh giá"**.

Bước 5  
Nhập thông tin đánh giá:

⭐ Chọn số sao (1 - 5 sao)  
✏️ Nhập nhận xét về món ăn

Ví dụ:
- "Pizza rất ngon"
- "Đế bánh giòn và nhiều topping"
- "Giao hàng nhanh và bánh nóng"

Bước 6  
Nhấn **Gửi đánh giá** để hoàn tất.

--------------------------------------------------

KẾT QUẢ

Sau khi gửi thành công:

✔️ Đánh giá của bạn sẽ hiển thị trong danh sách đánh giá của sản phẩm  
✔️ Người dùng khác có thể xem nhận xét của bạn  

Cảm ơn bạn đã chia sẻ trải nghiệm với **Secret Pizza ❤️**

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
Truy cập trang **Đơn hàng** trên thanh menu.

Bước 2  
Tại danh sách đơn hàng của bạn, tìm đơn cần đánh giá.

Điều kiện:
Đơn phải có trạng thái **Đã giao**.

Bước 3  
Nhấn nút **"Đánh giá"** ở bên phải đơn hàng.

Bước 4  
Hệ thống sẽ hiển thị cửa sổ **Đánh giá đơn hàng**.

Bạn cần nhập:

⭐ **Số sao đánh giá (1 - 5 sao)**  
✏️ **Bình luận về trải nghiệm của bạn**

Ví dụ bình luận:
- "Ngon, shipper giao nhanh"
- "Thức ăn nóng và rất ngon"
- "Pizza ngon nhưng giao hơi chậm"

Bước 5  
Nhấn **Gửi đánh giá** để hoàn tất.

Sau khi gửi thành công:

• Hệ thống sẽ hiển thị thông báo **"Cảm ơn bạn đã đánh giá!"**  
• Nút **Đánh giá** sẽ chuyển thành **Đã đánh giá**

Cảm ơn bạn đã giúp Secret Pizza cải thiện dịch vụ ❤️
` + getSuggestions();

    }
  }

];

module.exports = { scenarios };