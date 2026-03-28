// Auth Middleware - Xác thực JWT và kiểm tra quyền truy cập

const jwt = require('jsonwebtoken');

// Secret key cho JWT - nên lưu trong env
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Middleware xác thực JWT token
 * Kiểm tra token từ header Authorization: Bearer <token>
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Không tìm thấy token xác thực'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token đã hết hạn',
        expired: true
      });
    }
    return res.status(403).json({
      success: false,
      message: 'Token không hợp lệ'
    });
  }
}

/**
 * Middleware kiểm tra user đã đăng nhập (optional)
 * Không block request nếu không có token, chỉ gắn user vào req nếu có
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch (err) {
      // Ignore error - user sẽ là undefined
    }
  }
  next();
}

/**
 * Middleware kiểm tra role admin
 */
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Yêu cầu đăng nhập'
    });
  }

  const role = String(req.user.role || '').toUpperCase();
  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Không có quyền truy cập'
    });
  }
  next();
}

/**
 * Middleware kiểm tra role super admin
 */
function requireSuperAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Yêu cầu đăng nhập'
    });
  }

  const role = String(req.user.role || '').toUpperCase();
  if (role !== 'SUPER_ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Không có quyền truy cập'
    });
  }
  next();
}

/**
 * Tạo JWT token cho user
 */
function generateToken(user) {
  return jwt.sign(
    {
      maTaiKhoan: user.maTaiKhoan,
      email: user.email,
      role: user.role,
      maNguoiDung: user.maNguoiDung,
      hoTen: user.hoTen
    },
    JWT_SECRET,
    { expiresIn: '24h' } // Token hết hạn sau 24h
  );
}

/**
 * Verify token và trả về decoded data
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

module.exports = {
  authenticateToken,
  optionalAuth,
  requireAdmin,
  requireSuperAdmin,
  generateToken,
  verifyToken,
  JWT_SECRET
};
