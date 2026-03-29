const bcrypt = require('bcrypt');
const repo = require('./auth.repository');

// ✅ Sửa lỗi: Thêm destructuring để lấy generateToken
const { generateToken } = require('./middleware/auth.middleware');

async function register({ email, hoTen, matKhau, soDienThoai }) {
  if (!email || !hoTen || !matKhau) {
    const e = new Error('Thiếu thông tin: email, hoTen, matKhau');
    e.status = 400;
    throw e;
  }

  // Check if email already exists
  const existing = await repo.findUserByEmail(email);
  if (existing) {
    const e = new Error('Email đã được sử dụng');
    e.status = 409;
    throw e;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(matKhau, 10);

  // Create user
  const { taiKhoan, nguoiDung } = await repo.createUser({
    email,
    hoTen,
    matKhau: hashedPassword,
    soDienThoai,
  });

  // Build user data
  const userData = {
    maTaiKhoan: taiKhoan.MaTaiKhoan,
    email: taiKhoan.Email,
    role: taiKhoan.Role,
    maNguoiDung: nguoiDung.MaNguoiDung,
    hoTen: nguoiDung.HoTen,
    soDienThoai: nguoiDung.SoDienThoai,
    soNhaDuong: nguoiDung.SoNhaDuong,
    phuongXa: nguoiDung.PhuongXa,
    quanHuyen: nguoiDung.QuanHuyen,
    thanhPho: nguoiDung.ThanhPho,
  };

  // Generate JWT token
  const token = generateToken(userData);

  return {
    user: userData,
    token
  };
}

async function login({ email, matKhau }) {
  if (!email || !matKhau) {
    const e = new Error('Thiếu thông tin: email, matKhau');
    e.status = 400;
    throw e;
  }

  // Find user by email
  const user = await repo.findUserByEmail(email);
  if (!user) {
    const e = new Error('Email hoặc mật khẩu không đúng');
    e.status = 401;
    throw e;
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(matKhau, user.MatKhau);
  if (!isValidPassword) {
    const e = new Error('Email hoặc mật khẩu không đúng');
    e.status = 401;
    throw e;
  }

  // Build user data
  const userData = {
    maTaiKhoan: user.MaTaiKhoan,
    email: user.Email,
    role: user.Role,
    maNguoiDung: user.NguoiDung?.MaNguoiDung,
    hoTen: user.NguoiDung?.HoTen,
    soDienThoai: user.NguoiDung?.SoDienThoai,
    soNhaDuong: user.NguoiDung?.SoNhaDuong,
    phuongXa: user.NguoiDung?.PhuongXa,
    quanHuyen: user.NguoiDung?.QuanHuyen,
    thanhPho: user.NguoiDung?.ThanhPho,
  };

  // Generate JWT token
  const token = generateToken(userData);

  return {
    user: userData,
    token
  };
}

async function adminLogin({ email, matKhau }) {
  if (!email || !matKhau) {
    const e = new Error('Thiếu thông tin: email, matKhau');
    e.status = 400;
    throw e;
  }

  // Find user by email
  const user = await repo.findUserByEmail(email);
  if (!user) {
    const e = new Error('Email hoặc mật khẩu không đúng');
    e.status = 401;
    throw e;
  }

  // Check if user is admin/shipper (not customer)
  const role = String(user.Role || '').toUpperCase();
  if (role === 'CUSTOMER') {
    const e = new Error('Tài khoản không có quyền truy cập hệ thống quản trị');
    e.status = 403;
    throw e;
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(matKhau, user.MatKhau);
  if (!isValidPassword) {
    const e = new Error('Email hoặc mật khẩu không đúng');
    e.status = 401;
    throw e;
  }

  // Build permissions based on role
  const permissions = getPermissionsByRole(role);

  // Build user data
  const userData = {
    maTaiKhoan: user.MaTaiKhoan,
    maCoSo: user.NguoiDung?.MaCoSo || null,
    email: user.Email,
    role: user.Role,
    maNguoiDung: user.NguoiDung?.MaNguoiDung,
    hoTen: user.NguoiDung?.HoTen,
    soDienThoai: user.NguoiDung?.SoDienThoai,
    soNhaDuong: user.NguoiDung?.SoNhaDuong,
    phuongXa: user.NguoiDung?.PhuongXa,
    quanHuyen: user.NguoiDung?.QuanHuyen,
    thanhPho: user.NguoiDung?.ThanhPho,
    permissions,
  };

  // Generate JWT token
  const token = generateToken(userData);

  return {
    user: userData,
    token
  };
}

/**
 * Kiểm tra token và trả về thông tin user
 */
async function checkAuth(token) {
  // ✅ Sửa lỗi: Thêm destructuring để lấy verifyToken
  const { verifyToken } = require('./middleware/auth.middleware');
  const decoded = verifyToken(token);
  
  if (!decoded) {
    const e = new Error('Token không hợp lệ hoặc đã hết hạn');
    e.status = 401;
    throw e;
  }

  // Kiểm tra user vẫn tồn tại trong DB
  const user = await repo.findUserByEmail(decoded.email);
  if (!user) {
    const e = new Error('Tài khoản không tồn tại');
    e.status = 401;
    throw e;
  }

  return {
    user: {
      maTaiKhoan: user.MaTaiKhoan,
      email: user.Email,
      role: user.Role,
      maNguoiDung: user.NguoiDung?.MaNguoiDung,
      hoTen: user.NguoiDung?.HoTen,
      soDienThoai: user.NguoiDung?.SoDienThoai,
    },
    decoded
  };
}

function getPermissionsByRole(role) {
  const roleUpper = String(role || '').toUpperCase();
  
  switch (roleUpper) {
    case 'SHIPPER':
      return ['Quản lý giao hàng'];
    
    case 'ADMIN':
      return [
        'Tổng quan chi nhánh',
        'Quản lý đơn hàng chi nhánh',
        'Quản lý đánh giá đơn hàng chi nhánh',
      ];
    
    case 'SUPER_ADMIN':
      return [
        'Tổng quan',
        'Quản lý sản phẩm',
        'Quản lý thể loại',
        'Quản lý danh mục',
        'Quản lý đơn hàng',
        'Quản lý ngườii dùng',
        'Quản lý tùy chọn',
        'Quản lý đánh giá món ăn',
        'Quản lý đánh giá đơn hàng',
        'Quản lý khuyến mãi',
        'Quản lý voucher',
        'Quản lý banner',
        'Quản lý combo',
        'Quản lý quà tặng',
      ];
    
    default:
      return [];
  }
}

module.exports = {
  register,
  login,
  adminLogin,
  checkAuth,
};