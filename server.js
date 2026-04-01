// --- IMPORT CÁC THƯ VIỆN CẦN THIẾT ---
const axios = require('axios');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// --- IMPORT CÁC ROUTES CỦA ỨNG DỤNG ---
const authRoutes = require('./src/api/auth/auth.routes');
const categoryRoutes = require('./src/api/categories/category.routes');
const typeRoutes = require('./src/api/types/type.routes');
const foodRoutes = require('./src/api/foods/food.routes');
const variantRoutes = require('./src/api/variants/variant.routes');
const crustRoutes = require('./src/api/crusts/crust.routes');
const branchRoutes = require('./src/api/branch/branch.routes');
const shippingRoutes = require('./src/api/order/shipping.routes');
const voucherRoutes = require('./src/api/vouchers/voucher.routes');
const orderRoutes = require('./src/api/order/order.routes');
const bannerRoutes = require('./src/api/banners/banner.routes');
const comboRoutes = require('./src/api/combos/combo.routes');
const paymentRoutes = require('./src/api/payment/payment.routes');
const reviewRoutes = require('./src/api/reviews/review.routes');
const userRoutes = require('./src/api/users/user.routes');
const promotionRoutes = require('./src/api/promotions/promotion.routes');
const sizeRoutes = require('./src/api/sizes/size.routes');
const optionRoutes = require('./src/api/options/option.routes');
const giftRoutes = require('./src/api/gifts/gift.routes');
const chatRoutes = require('./src/api/chat/chat.routes');
const chatbotRoutes = require('./src/chatbot/chatbot.routes');

// --- KHỞI TẠO EXPRESS APP ---
const app = express();

// --- CẤU HÌNH MIDDLEWARE ---
app.use(cors());

// ✅ Sửa lỗi Express v5: thêm urlencoded TRƯỚC json, và cả 2 đều cần có
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));

// Debug middleware - kiểm tra request (có thể xóa sau khi test xong)
app.use((req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Body:', req.body);
  }
  next();
});

app.use(express.static('public'));

// --- ĐỊNH NGHĨA CÁC API ROUTES ---
// Route cơ bản để kiểm tra server có đang "sống" hay không
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API is running healthy!' });
});

// Sử dụng routes đã tách riêng
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/types', typeRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/variants', variantRoutes);
app.use('/api/crusts', crustRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/vouchers', voucherRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/combos', comboRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/users', userRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/sizes', sizeRoutes);
app.use('/api/options', optionRoutes);
app.use('/api/gifts', giftRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/chatbot', chatbotRoutes);

// ==============================
// 🌍 LOCATION API (FIX CORS)
// ==============================

// Lấy danh sách tỉnh/thành
app.get('/api/location/provinces', async (req, res) => {
  try {
    const r = await axios.get('https://provinces.open-api.vn/api/p/');
    res.json(r.data);
  } catch (err) {
    console.error('Provinces error:', err.message);
    res.status(500).json({ message: 'Lỗi lấy tỉnh/thành' });
  }
});

// Lấy quận/huyện theo tỉnh
app.get('/api/location/districts', async (req, res) => {
  try {
    const { p } = req.query;

    const r = await axios.get(
      `https://provinces.open-api.vn/api/p/${p}?depth=2`
    );

    res.json(r.data.districts || []);
  } catch (err) {
    console.error('Districts error:', err.message);
    res.status(500).json({ message: 'Lỗi lấy quận/huyện' });
  }
});

// Lấy phường/xã theo quận
app.get('/api/location/wards', async (req, res) => {
  try {
    const { d } = req.query;

    const r = await axios.get(
      `https://provinces.open-api.vn/api/d/${d}?depth=2`
    );

    res.json(r.data.wards || []);
  } catch (err) {
    console.error('Wards error:', err.message);
    res.status(500).json({ message: 'Lỗi lấy phường/xã' });
  }
});

// --- ERROR HANDLING ---
// Xử lý lỗi 404
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Route không tồn tại' });
});

// Xử lý lỗi chung
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Lỗi server nội bộ'
  });
});

// --- KHỞI ĐỘNG SERVER ---
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Server SECRET PIZZA đang chạy tại cổng ${PORT}`);
});