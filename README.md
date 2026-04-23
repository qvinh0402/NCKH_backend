# 🍕 SECRET PIZZA - BACKEND (E-Commerce với AI Chatbot)

> **Hệ thống quản lý bán hàng thương mại điện tử cho nhà hàng pizza với chatbot AI thông minh tích hợp Groq**

[![Node.js](https://img.shields.io/badge/Node.js-22.18.0-green)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-4.18.2-blue)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17.5-336791)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.8.0-2D3748)](https://www.prisma.io/)
[![Groq](https://img.shields.io/badge/Groq_AI-llama3.3-FF6B6B)](https://groq.com/)

---

## 📋 **MỤC LỤC**

- [🎯 Tổng Quan](#tổng-quan)
- [🏗️ Kiến Trúc Hệ Thống](#kiến-trúc-hệ-thống)
- [⚙️ Công Nghệ & Stack](#công-nghệ--stack)
- [📦 Cài Đặt & Setup](#cài-đặt--setup)
- [🚀 Chạy Ứng Dụng](#chạy-ứng-dụng)
- [🤖 Chatbot AI](#chatbot-ai)
- [📡 API Documentation](#api-documentation)
- [💾 Database Schema](#database-schema)
- [🔐 Authentication](#authentication)
- [⚙️ Configuration](#configuration)
- [🧪 Testing](#testing)
- [📁 Project Structure](#project-structure)
- [🤝 Contributing](#contributing)

---

## 🎯 **Tổng Quan**

**SECRET PIZZA Backend** là một hệ thống quản lý bán hàng thương mại điện tử hoàn chỉnh dành cho nhà hàng pizza, tích hợp:

✅ **E-Commerce Core**
- 🛒 Quản lý sản phẩm (Pizza, Combo, Nước uống)
- 📦 Quản lý đơn hàng & logistics
- 💳 Tích hợp thanh toán VNPay
- ⭐ Hệ thống đánh giá & bình luận

✅ **AI Chatbot**
- 🤖 Chatbot 8 kịch bản chuyên biệt
- 🧠 Xử lý NLP (Vietnamese support)
- 🎯 Gợi ý sản phẩm theo tính cách người dùng
- 🔌 Tích hợp Groq AI (llama-3.3-70b)
- 💾 Lưu lịch sử chat 24 giờ

✅ **Admin Management**
- 📊 Dashboard thống kê
- 👥 Quản lý tài khoản người dùng
- 🏪 Quản lý chi nhánh & khu vực giao hàng
- 🎁 Quản lý khuyến mãi & combo

---

## 🏗️ **Kiến Trúc Hệ Thống**

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Frontend)                     │
│              React / Next.js / Mobile App                │
└────────────────────────┬────────────────────────────────┘
                         │
                    API Requests
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    ┌─────────┐   ┌──────────────┐  ┌──────────────┐
    │ Auth    │   │   REST API   │  │  Chatbot API │
    │ API     │   │  (63 routes) │  │  (8 routes)  │
    └────┬────┘   └──────┬───────┘  └──────┬───────┘
         │                │                 │
         └────────────────┼─────────────────┘
                          │
            ┌─────────────┴──────────────┐
            │                            │
        ┌─────────────┐          ┌──────────────┐
        │  Services   │          │ AI Services  │
        │  • Auth     │          │ • Groq       │
        │  • Order    │          │ • OpenRouter │
        │  • Chat     │          │ • Context    │
        │  • Payment  │          │   Builder    │
        └──────┬──────┘          └───────┬──────┘
               │                         │
        ┌──────┴──────────────────────────┴─────┐
        │        Database (PostgreSQL)          │
        │  • 15+ tables                         │
        │  • Prisma ORM                         │
        │  • Indexed queries                    │
        └───────────────────────────────────────┘
```

---

## ⚙️ **Công Nghệ & Stack**

### **Backend Framework**
```
✅ Node.js 22.18.0         - JavaScript Runtime
✅ Express.js 4.18.2       - Web Framework
✅ Nodemon 3.0.1           - Development auto-reload
```

### **Database & ORM**
```
✅ PostgreSQL 17.5         - Relational Database
✅ Prisma 5.8.0            - ORM & Migrations
✅ pg 8.10.0               - PostgreSQL Driver
```

### **AI Integration**
```
✅ Groq API                - Primary AI (llama-3.3-70b)
✅ OpenRouter API          - Fallback AI (llama-3.1-8b)
✅ axios 1.6.2             - HTTP Client
```

### **Authentication & Security**
```
✅ JWT 9.0.2               - Token-based Auth
✅ bcryptjs 2.4.3          - Password Hashing
✅ dotenv 16.3.1           - Environment Variables
✅ cors 2.8.5              - CORS Protection
✅ cookie-parser 1.4.6     - Secure Cookies
```

### **Payment Integration**
```
✅ VNPay Sandbox           - Payment Gateway
✅ Transaction Management  - Order tracking
```

### **File Upload & Media**
```
✅ multer 1.4.5            - File Upload Middleware
✅ Express Static          - Image Serving
```

---

## 📦 **Cài Đặt & Setup**

### **1. Prerequisites**
```bash
# Node.js 22+
node --version

# PostgreSQL 17+
psql --version

# npm / pnpm
npm --version
# hoặc
pnpm --version
```

### **2. Clone Repository**
```bash
git clone https://github.com/qvinh0402/NCKH_backend.git
cd NCKH_backend
```

### **3. Install Dependencies**
```bash
# Sử dụng npm
npm install

# Hoặc sử dụng pnpm
pnpm install
```

### **4. Setup Environment Variables**
```bash
# Copy file example
cp .env.example .env

# Edit .env với thông tin của bạn
nano .env
```

**Các biến cần thiết:**
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/pizza_db"

# JWT
JWT_SECRET="your-jwt-secret-key-here"
JWT_EXPIRE="7d"

# Groq AI
GROQ_API_KEY="your-groq-api-key"

# OpenRouter AI (Fallback)
OPENROUTER_API_KEY="your-openrouter-key"

# VNPay
VNP_TMNCODE="sandbox-merchant-code"
VNP_HASH_SECRET="sandbox-hash-secret"
VNP_URL="https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
VNP_API="https://sandbox.vnpayment.vn/merchant_webapi/api/transaction"
VNP_RETURN_URL="http://localhost:3001/api/payment/vnpay-return"

# Server
PORT=3001
NODE_ENV="development"
```

### **5. Database Setup**
```bash
# Tạo database
createdb pizza_db

# Run migrations
npx prisma migrate deploy

# Seed sample data (optional)
npx prisma db seed
```

### **6. Verify Installation**
```bash
# Kiểm tra Prisma client
npx prisma generate

# List database tables
npx prisma studio
```

---

## 🚀 **Chạy Ứng Dụng**

### **Development Mode**
```bash
npm run dev
# hoặc
pnpm dev

# Server sẽ chạy tại http://localhost:3001
```

### **Production Mode**
```bash
# Build
npm run build

# Start
npm start
```

### **Testing**
```bash
# Run tests
npm test

# Coverage
npm run test:coverage
```

---

## 🤖 **Chatbot AI**

### **8 Kịch Bản Chuyên Biệt**

| # | Kịch bản | Trigger | Response |
|---|----------|---------|----------|
| 1️⃣ | Xem món bán chạy | "bán chạy", "nên ăn gì" | Top products từ DB |
| 2️⃣ | Hướng dẫn đặt hàng | "đặt hàng", "mua pizza" | Step-by-step guide |
| 3️⃣ | Kiểm tra đơn hàng | "kiem tra don", "xem don" | Order status & details |
| 4️⃣ | Đánh giá món | "danh gia mon", "review" | Food rating form |
| 5️⃣ | Đánh giá đơn hàng | "danh gia don hang" | Order feedback form |
| 6️⃣ | Gợi ý theo tính cách | "tính cách", "personality" | AI recommendation |
| 7️⃣ | Thông tin chi nhánh | "chi nhánh", "địa chỉ" | Store locations |
| 8️⃣ | AI Fallback | (Không match) | Groq AI response |

### **NLP Features**
✅ Vietnamese accent removal (á→a, ớ→o)
✅ Case-insensitive matching
✅ Multiple keyword patterns
✅ Personality detection
✅ Menu context injection

### **Example Conversation**

```
User: "Pizza bán chạy nhất là gì?"
Bot: "🍕 PIZZA BÁN CHẠY NHẤT\n\nTên: Pizza Siêu Topping Giăm Bông Dứa\n⭐ 4.7/5 | 312 lần bán\n💰 245,000đ"

User: "Gợi ý cho người năng động"
Bot: "✨ GỢI Ý THEO TÍNH CÁCH\n\n🔥 HOẠT BẬT, NĂNG ĐỘNG\n\n1️⃣ Pizza 5 Loại Thịt (LỚN) - 205,000đ\n2️⃣ Pizza Giăm Bông Dứa (LỚN) - 245,000đ\n3️⃣ Pizza Hải Sản (LỚN) - 265,000đ"
```

---

## 📡 **API Documentation**

### **Authentication Endpoints**

```http
POST /api/auth/register
  Request: { username, email, password, hoTen, soDienThoai }
  Response: { success, token, user }

POST /api/auth/login
  Request: { email, password }
  Response: { success, token, user }

POST /api/auth/refresh-token
  Response: { success, newToken }

GET /api/auth/profile
  Response: { success, user }

PUT /api/auth/profile
  Request: { hoTen, soDienThoai, diaChi }
  Response: { success, user }
```

### **Chatbot Endpoints**

```http
POST /api/chatbot/message
  Request: { message, userId }
  Response: { success, reply, timestamp, conversationId }

GET /api/chatbot/history/:userId
  Response: { success, messages, totalCount }

DELETE /api/chatbot/history/:userId
  Response: { success, deletedCount }

POST /api/ai/ask
  Request: { prompt, model? }
  Response: { success, response, model }
```

### **Food/Menu Endpoints**

```http
GET /api/foods
  Query: { category, minPrice, maxPrice, limit, page }
  Response: { success, foods, totalCount }

GET /api/foods/trending
  Response: { success, foods }

GET /api/foods/:id
  Response: { success, food }

POST /api/foods (Admin)
  Request: { tenMonAn, gia, moTa, loai }
  Response: { success, food }
```

### **Order Endpoints**

```http
GET /api/orders
  Response: { success, orders }

POST /api/orders
  Request: { items, diaChi, soDienThoai, ghiChu, payment }
  Response: { success, order, paymentUrl? }

GET /api/orders/:id
  Response: { success, order }

PUT /api/orders/:id
  Request: { trangthai }
  Response: { success, order }
```

### **Payment Endpoints**

```http
POST /api/payment/vnpay-create
  Request: { orderId, amount, orderInfo }
  Response: { success, paymentUrl, txnRef }

GET /api/payment/vnpay-return
  Query: { vnp_ResponseCode, vnp_TransactionNo }
  Response: { success, order }
```

### **Review Endpoints**

```http
POST /api/reviews
  Request: { type, itemId, soSao, nhanXet, hinhAnh? }
  Response: { success, review }

GET /api/reviews/food/:foodId
  Response: { success, reviews }

GET /api/reviews/order/:orderId
  Response: { success, reviews }
```

📖 **Full API List:** 63 endpoints across 11 categories (tham khảo PHỤ LỤC)

---

## 💾 **Database Schema**

### **Core Models (13 tables)**

```
TaiKhoan                 - User accounts
LoaiMonAn                - Food types (Pizza, Drinks...)
DanhMuc                  - Product categories
MonAn                    - Foods/Products
BienTheMonAn             - Food variants (size, crust)
DeBanh                   - Pizza sizes
Combo                    - Combo packages
DonHang                  - Orders
ChiTietDonHang           - Order items
ChatHistory              - Chat messages (24h TTL)
CoSo                     - Store branches
DanhGiaMonAn             - Food reviews
DanhGiaDonHang           - Order reviews
HoaDonThanhToan          - Payments
```

### **Key Features**
✅ UUID primary keys
✅ Foreign key relationships
✅ CASCADE delete on dependencies
✅ Indexed for fast queries
✅ Timestamps (CreatedAt, UpdatedAt)
✅ Status tracking

📊 **Full Schema:** PHỤ LỤC C (Database Schema)

---

## 🔐 **Authentication**

### **JWT Token Flow**

```
┌──────────────┐
│ User Login   │
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────┐
│ Validate Credentials (bcrypt)   │
└──────┬────────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Generate JWT Token               │
│ • Payload: userId, role          │
│ • Expiry: 7 days (configurable)  │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Store refresh token in DB        │
│ Return: access token + user info │
└──────────────────────────────────┘
```

### **Protected Routes**
```
Authorization: Bearer <JWT_TOKEN>
```

### **User Roles**
- 🛒 **CUSTOMER** - Regular users
- 🏪 **ADMIN** - Admin panel access
- 🚚 **DELIVERY** - Delivery staff

---

## ⚙️ **Configuration**

### **VNPay Integration**

**Required Environment Variables:**
```env
VNP_TMNCODE="your-merchant-code"
VNP_HASH_SECRET="your-hash-secret"
VNP_URL="https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
VNP_API="https://sandbox.vnpayment.vn/merchant_webapi/api/transaction"
VNP_RETURN_URL="http://localhost:3001/api/payment/vnpay-return"
```

**Payment Flow:**
1. User creates order with payment method "Chuyển Khoản"
2. API generates VNPay payment URL
3. Returns transaction metadata (txnRef, expireAt)
4. User redirected to VNPay sandbox
5. VNPay redirects back with response code
6. Verify response & update order status

**Testing:** Use VNPay sandbox credentials provided by stakeholder

### **AI Model Selection**

```javascript
// Auto fallback strategy
callAI(prompt)
  ├─ Try: Groq llama-3.3-70b (fast)
  └─ Fallback: OpenRouter llama-3.1-8b (if Groq fails)
```

### **Banner API**

- Endpoint: `GET /api/banners`
- Response: JSON array of relative paths
  ```json
  ["/images/Banner/1.jpg", "/images/Banner/2.jpg"]
  ```
- Files served via Express static middleware from `public/images/Banner`

---

## 🧪 **Testing**

### **Unit Tests**
```bash
npm test

# Specific test file
npm test -- chatbot.service.test.js

# Coverage report
npm run test:coverage
```

### **Integration Tests**
```bash
npm run test:integration

# Test chatbot scenarios
npm run test:chatbot
```

### **API Testing (Postman/Insomnia)**
- Import: `postman-collection.json`
- Select environment: `development` / `production`
- Run tests with mock data

---

## 📁 **Project Structure**

```
src/
├── chatbot/                      # AI Chatbot Module
│   ├── chatbot.controller.js     # API handlers
│   ├── chatbot.service.js        # Business logic
│   ├── chatbot.repository.js     # DB access
│   ├── chatbot.scenarios.js      # 8 scenarios (1400+ lines)
│   ├── chatbot.routes.js         # Routes
│   ├── chatbotEngine.js          # Pattern matching
│   ├── chatbot-ai-context.js     # Menu context builder
│   ├── chatbot-ai-wrapper.js     # AI wrapper
│   └── utils/
│       └── text.js               # Text processing
│
├── services/                     # Business Services
│   ├── aiService.js              # AI models manager
│   ├── aiReviewService.js        # Review analysis
│   └── emailService.js           # Email notifications
│
├── api/                          # API Routes
│   ├── auth/                     # Authentication
│   ├── foods/                    # Menu management
│   ├── orders/                   # Order management
│   ├── reviews/                  # Review system
│   ├── combos/                   # Combo management
│   ├── locations/                # Store locations
│   ├── payments/                 # Payment handling
│   ├── chat/                     # Chat API
│   ├── sizes/                    # Size options
│   ├── crusts/                   # Crust types
│   ├── promotions/               # Promotions
│   ├── vouchers/                 # Voucher system
│   ├── gifts/                    # Gift management
│   ├── variants/                 # Product variants
│   ├── options/                  # Product options
│   ├── banners/                  # Banners
│   ├── statistics/               # Analytics
│   ├── shipping/                 # Shipping
│   └── shipping.repository.js    # Shipping repo
│
├── middleware/                   # Custom Middleware
│   ├── auth.middleware.js        # Auth validation
│   ├── upload.js                 # File upload
│   ├── uploadCombo.js            # Combo upload
│   └── uploadGift.js             # Gift upload
│
├── utils/                        # Utilities
│   ├── geo.js                    # Geolocation
│   ├── goong.js                  # Map service
│   └── vnpay.js                  # VNPay integration
│
├── client.js                     # Prisma singleton
└── server.js                     # Entry point

prisma/
├── schema.prisma                 # Database schema
└── migrations/                   # DB migrations

public/
├── images/
│   ├── Banner/                   # Banner images
│   ├── AnhMonAn/                 # Food images
│   ├── AnhCombo/                 # Combo images
│   ├── QuaTang/                  # Gift images
│   └── ...

tests/
├── unit/                         # Unit tests
├── integration/                  # Integration tests
└── chatbot/                      # Chatbot tests

.env                              # Environment variables
.env.example                      # Environment template
package.json                      # Dependencies
README.md                         # This file
```

---

## 🤝 **Contributing**

### **Git Workflow**
```bash
# 1. Create feature branch
git checkout -b feature/chatbot-enhancement

# 2. Make changes
git add .

# 3. Commit with descriptive message
git commit -m "feat: add personality-based pizza recommendation"

# 4. Push to remote
git push origin feature/chatbot-enhancement

# 5. Create Pull Request
```

### **Code Standards**
- ✅ Use camelCase for variables/functions
- ✅ Use PascalCase for classes/models
- ✅ Add JSDoc comments for functions
- ✅ Write tests for new features
- ✅ Follow existing code style

### **Commit Message Format**
```
feat:     New feature
fix:      Bug fix
docs:     Documentation
style:    Code style changes
refactor: Code refactoring
perf:     Performance improvements
test:     Test additions
chore:    Build/dependency changes
```

---

## 📚 **Additional Resources**

### **Documentation**
- 📖 [Express.js Docs](https://expressjs.com/)
- 🗄️ [Prisma Docs](https://www.prisma.io/docs/)
- 🤖 [Groq API Docs](https://console.groq.com/docs)
- 💳 [VNPay Integration](https://sandbox.vnpayment.vn/)

### **Appendices**
- 📋 **PHỤ LỤC A** - Danh sách API đầy đủ (63 endpoints)
- 🔑 **PHỤ LỤC B** - Code mẫu quan trọng
- 🗄️ **PHỤ LỤC C** - Database schema (SQL/Prisma)
- 🤖 **PHỤ LỤC D** - Chatbot scenarios & examples

---

## 📞 **Support & Contact**

### **Project Information**
- **Repository:** https://github.com/qvinh0402/NCKH_backend
- **Owner:** qvinh0402
- **Branch:** main
- **Created:** April 2025

### **Issues & Bugs**
Please report issues via GitHub Issues with:
- Description of bug
- Steps to reproduce
- Expected vs actual behavior
- Environment info (Node version, OS, etc.)

### **Questions?**
Open a discussion or contact the development team

---

## 📄 **License**

This project is proprietary software for SECRET PIZZA. All rights reserved.

---

**Last Updated:** April 23, 2026
**Status:** ✅ Production Ready 🚀
 

