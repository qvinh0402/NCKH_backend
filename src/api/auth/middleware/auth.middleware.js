// Auth Middleware - Xác thực JWT và kiểm tra quyền truy cập

const jwt = require('jsonwebtoken');

// Secret key cho JWT - nên lưu trong env
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Middleware xác thực JWT token
 * Kiểm tra token từ header Authorization: Bearer <token>
 */
function authenticateToken(req, res, next) {
  console.log('=== authenticateToken DEBUG ===');
  console.log('URL:', req.originalUrl);
  console.log('Method:', req.method);
  console.log('Authorization Header:', req.headers['authorization']);
  
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  console.log('Token extracted:', token ? token.substring(0, 20) + '...' : 'Không có token');
  console.log('JWT_SECRET used:', JWT_SECRET ? JWT_SECRET.substring(0, 10) + '...' : 'Không có');

  if (!token) {
    console.log('❌ Lỗi: Không tìm thấy token trong header');
    return res.status(401).json({
      success: false,
      message: 'Không tìm thấy token xác thực'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ Token hợp lệ!');
    console.log('Decoded:', {
      maTaiKhoan: decoded.maTaiKhoan,
      email: decoded.email,
      role: decoded.role,
      iat: decoded.iat,
      exp: decoded.exp
    });
    req.user = decoded;
    next();
  } catch (err) {
    console.log('❌ Lỗi verify token:', err.name, '-', err.message);
    
    if (err.name === 'TokenExpiredError') {
      console.log('Token expired at:', err.expiredAt);
      return res.status(401).json({
        success: false,
        message: 'Token đã hết hạn',
        expired: true
      });
    }
    
    if (err.name === 'JsonWebTokenError') {
      console.log('JWT Error - Secret mismatch hoặc token bị sửa');
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
  console.log('=== optionalAuth DEBUG ===');
  console.log('Authorization Header:', req.headers['authorization']);
  
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log('✅ Optional auth - Token hợp lệ:', decoded.email);
      req.user = decoded;
    } catch (err) {
      console.log('⚠️ Optional auth - Token không hợp lệ (bỏ qua):', err.message);
      // Ignore error - user sẽ là undefined
    }
  } else {
    console.log('ℹ️ Optional auth - Không có token (guest)');
  }
  next();
}

/**
 * Middleware kiểm tra role admin
 */
function requireAdmin(req, res, next) {
  console.log('=== requireAdmin DEBUG ===');
  console.log('req.user:', req.user);
  
  if (!req.user) {
    console.log('❌ Không có req.user - Chưa đăng nhập');
    return res.status(401).json({
      success: false,
      message: 'Yêu cầu đăng nhập'
    });
  }

  const role = String(req.user.role || '').toUpperCase();
  console.log('User role:', role);
  
  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    console.log('❌ Role không đủ quyền:', role);
    return res.status(403).json({
      success: false,
      message: 'Không có quyền truy cập'
    });
  }
  
  console.log('✅ Admin access granted');
  next();
}

/**
 * Middleware kiểm tra role super admin
 */
function requireSuperAdmin(req, res, next) {
  console.log('=== requireSuperAdmin DEBUG ===');
  console.log('req.user:', req.user);
  
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Yêu cầu đăng nhập'
    });
  }

  const role = String(req.user.role || '').toUpperCase();
  console.log('User role:', role);
  
  if (role !== 'SUPER_ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Không có quyền truy cập'
    });
  }
  
  console.log('✅ SuperAdmin access granted');
  next();
}

/**
 * Tạo JWT token cho user
 */
function generateToken(user) {
  console.log('=== generateToken DEBUG ===');
  console.log('User input:', {
    maTaiKhoan: user.maTaiKhoan,
    email: user.email,
    role: user.role
  });
  console.log('JWT_SECRET used:', JWT_SECRET ? JWT_SECRET.substring(0, 10) + '...' : 'Không có');
  
  const token = jwt.sign(
    {
      maTaiKhoan: user.maTaiKhoan,
      email: user.email,
      role: user.role,
      maNguoiDung: user.maNguoiDung,
      hoTen: user.hoTen
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  console.log('✅ Token generated:', token.substring(0, 30) + '...');
  return token;
}

/**
 * Verify token và trả về decoded data
 */
function verifyToken(token) {
  console.log('=== verifyToken DEBUG ===');
  console.log('Token input:', token ? token.substring(0, 20) + '...' : 'Không có');
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ Verify success:', decoded.email);
    return decoded;
  } catch (err) {
    console.log('❌ Verify failed:', err.message);
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