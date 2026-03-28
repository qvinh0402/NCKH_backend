const service = require('./auth.service');

async function register(req, res) {
  try {
    const { email, hoTen, matKhau, soDienThoai } = req.body;
    const result = await service.register({ email, hoTen, matKhau, soDienThoai });
    
    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công',
      user: result.user,
      token: result.token
    });
  } catch (err) {
    console.error('register error:', err);
    const status = err.status || 500;
    res.status(status).json({
      success: false,
      message: err.message || 'Lỗi server nội bộ'
    });
  }
}

async function login(req, res) {
  try {
    const { email, matKhau } = req.body;
    const result = await service.login({ email, matKhau });
    
    res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      user: result.user,
      token: result.token
    });
  } catch (err) {
    console.error('login error:', err);
    const status = err.status || 500;
    res.status(status).json({
      success: false,
      message: err.message || 'Lỗi server nội bộ'
    });
  }
}

async function adminLogin(req, res) {
  try {
    const { email, matKhau } = req.body;
    const result = await service.adminLogin({ email, matKhau });
    
    res.status(200).json({
      success: true,
      message: 'Đăng nhập admin thành công',
      user: result.user,
      token: result.token
    });
  } catch (err) {
    console.error('admin login error:', err);
    const status = err.status || 500;
    res.status(status).json({
      success: false,
      message: err.message || 'Lỗi server nội bộ'
    });
  }
}

/**
 * GET /api/auth/check
 * Kiểm tra token và trả về thông tin user hiện tại
 */
async function checkAuth(req, res) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy token'
      });
    }

    const result = await service.checkAuth(token);
    
    res.status(200).json({
      success: true,
      message: 'Xác thực thành công',
      user: result.user
    });
  } catch (err) {
    console.error('check auth error:', err);
    const status = err.status || 500;
    res.status(status).json({
      success: false,
      message: err.message || 'Lỗi xác thực'
    });
  }
}

/**
 * POST /api/auth/logout
 * Xử lý đăng xuất (phía server chỉ cần trả về success, client sẽ xóa token)
 */
async function logout(req, res) {
  try {
    // Có thể thêm logic blacklist token ở đây nếu cần
    res.status(200).json({
      success: true,
      message: 'Đăng xuất thành công'
    });
  } catch (err) {
    console.error('logout error:', err);
    res.status(500).json({
      success: false,
      message: 'Lỗi đăng xuất'
    });
  }
}

module.exports = {
  register,
  login,
  adminLogin,
  checkAuth,
  logout,
};
