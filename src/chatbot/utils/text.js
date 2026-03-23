// utils/text.js

// bỏ dấu tiếng Việt
export function removeVietnameseTones(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

// chuẩn hóa text
export function normalizeText(str) {
  return removeVietnameseTones(str)
    .replace(/[^\w\s]/g, "") // bỏ ký tự đặc biệt
    .replace(/\s+/g, " ")    // bỏ khoảng trắng dư
    .trim();
}