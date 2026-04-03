# ChatShortcut.jsx - Hướng dẫn bổ sung

## 📋 Tổng quan
ChatShortcut.jsx được cung cấp hoàn chỉnh. Tất cả các phần cần thiết đã có, bao gồm:
- ✅ Cache management (24h TTL)
- ✅ Authentication context integration
- ✅ Chat message management
- ✅ Message history loading/saving
- ✅ Conversations management
- ✅ Token handling với fallback localStorage
- ✅ Auto-scroll, bubble animation, suggestions

## 🔄 API Endpoints được sử dụng

### Chat Messages
```
POST   /api/chatbot/message
GET    /api/chatbot/history/:userId
DELETE /api/chatbot/history/:userId
```

### Conversations (cuộc trò chuyện cũ)
```
GET    /api/chatbot/conversations/:userId
DELETE /api/chatbot/conversations/:conversationId
```

### Session
```
GET    /api/chatbot/session/:userId
DELETE /api/chatbot/session/:userId
POST   /api/chatbot/checkout
```

## ✅ Backend Implementation (HOÀN THÀNH)

Các phương thức sau đã được thêm:

### 1. chatbot.controller.js
- `getConversations(req, res)` - Lấy danh sách cuộc trò chuyện
- `deleteConversation(req, res)` - Xóa cuộc trò chuyện

### 2. chatbot.service.js
- `getConversations(userId)` - Lấy conversations từ history
- `getConversationPreview(messages)` - Tạo preview cho conversation
- `deleteConversation(conversationId)` - Xóa conversation

### 3. chatbot.routes.js
- `GET /api/chatbot/conversations/:userId` (Protected)
- `DELETE /api/chatbot/conversations/:conversationId` (Protected)

## 🚀 Sử dụng ChatShortcut Component

### Import
```jsx
import ChatShortcut from './components/ChatShortcut/ChatShortcut';
```

### Sử dụng trong Layout
```jsx
<ChatShortcut />
```

## 📝 Các tính năng chính

### 1. Chat Messages
- Gửi/nhận tin nhắn (công khai, không cần đăng nhập)
- Hiển thị gợi ý động dựa trên nội dung
- Loading state indicator

### 2. Lịch sử Chat (Chỉ login)
- Tự động tải lịch sử 24h từ server
- Lưu cache localStorage
- Refresh button để làm mới

### 3. Cuộc trò chuyện (Chỉ login)
- Nhóm messages thành các conversations
- Preview + timestamp
- Xóa conversations riêng lẻ
- Tải lại conversation khi click

### 4. Authentication
- Hỗ trợ guest users (không lưu history)
- Kiểm tra token từ AuthContext + fallback localStorage
- Xử lý token hết hạn (401 response)

### 5. Cache & Performance
- Cache 24h cho history
- Tránh request trùng lặp
- Auto-scroll smooth
- Bubble text rotation (10s)

## 🔐 Token Management

### Fallback Logic
```javascript
const token = auth.token || localStorage.getItem('auth_token');
```

Component sẽ:
1. Lấy token từ AuthContext trước
2. Nếu không có, lấy từ localStorage
3. Tự động gửi token trong Authorization header

### Xử lý Unauthorized
Nếu API trả về 401:
- Reset messages về trạng thái ban đầu
- Xóa cache
- Hiển thị thông báo đăng nhập lại

## 🎨 CSS Classes (Cần tạo ChatShortcut.module.css)

```css
.wrapper
.miniBubble
.miniHeader
.miniText
.bubbleClose
.chatWindow
.chatHeader
.headerActions
.iconBtn
.headerClose
.guestNotice
.chatBody
.msgUser
.msgBot
.typing
.dots
.suggestionBox
.suggestionBtn
.loadingIndicator
.chatFooter
.disclaimer
.fab
.historyPanel
.historyHeader
.historyClose
.historyList
.historyItem
.historyItemContent
.historyItemPreview
.historyItemTime
.historyItemDelete
.noHistory
```

## 🐛 Troubleshooting

### Lịch sử không load
- Kiểm tra token có hợp lệ?
- Xem console: `[ChatHistory] Loading with token: Có/Không`
- Backend có endpoint `/api/chatbot/history/:userId`?

### Conversations không hiển thị
- Kiểm tra user đã login?
- Có messages trong history?
- Backend có endpoint `/api/chatbot/conversations/:userId`?

### Cache không work
- Browser local storage enabled?
- Xem DevTools: Application → Local Storage → chat_cache

### Token hết hạn
- Thông báo sẽ hiển thị: "⚠️ Phiên đăng nhập đã hết hạn"
- User cần đăng nhập lại
- Component sẽ reset history

## 📱 Mobile Responsive

Component tự động responsive với:
- Fixed position bottom-right
- FAB button (bubble)
- Flexible chat window width
- Touch-friendly buttons

## 🔄 State Flow

```
User Types Message
  ↓
setLoading(true)
  ↓
POST /api/chatbot/message
  ↓
Receive Reply
  ↓
Save to messages state
saveCache() → localStorage
  ↓
Auto-scroll + Show suggestions
  ↓
setLoading(false)
```

## 📊 Data Structures

### Message Object
```javascript
{
  from: 'user' | 'bot',
  text: string,
  timestamp: Date (optional)
}
```

### Conversation Object
```javascript
{
  id: string,
  messages: Message[],
  preview: string,
  timestamp: Date,
  messageCount: number
}
```

### Session Object
```javascript
{
  orderCart: [],
  totalPrice: number,
  userId: string,
  createdAt: Date,
  lastActivity: Date
}
```

## 🎯 Next Steps

1. **Tạo CSS file** `ChatShortcut.module.css` với styles
2. **Test Component**:
   - Chat như guest (không login)
   - Chat như user (có login)
   - Xem history & conversations
   - Xóa history/conversations
   - Refresh history
3. **Tối ưu**:
   - Thêm error boundaries
   - Implement infinite scroll cho conversations
   - Thêm search functionality
4. **Database Integration** (Future):
   - Lưu conversations vào DB thay vì in-memory
   - Implement persistence layer

## 📚 API Response Format

### Chat Message Response
```json
{
  "success": true,
  "data": {
    "reply": "string",
    "userId": "string",
    "timestamp": "ISO-8601",
    "suggestions": ["suggestion1", "suggestion2"]
  }
}
```

### History Response
```json
{
  "success": true,
  "data": [
    { "from": "user", "text": "...", "timestamp": "..." },
    { "from": "bot", "text": "...", "timestamp": "..." }
  ],
  "meta": { "total": 10, "ttl": "24h" }
}
```

### Conversations Response
```json
{
  "success": true,
  "data": [
    {
      "id": "conv_...",
      "messages": [...],
      "preview": "...",
      "timestamp": "...",
      "messageCount": 5
    }
  ],
  "meta": { "total": 3 }
}
```

---

**⚠️ Lưu ý quan trọng:**
- Không có endpoint `/conversations/:conversationId` để lấy chi tiết (hiện tại), chỉ dùng messages từ list
- Conversation deletion hiện tại là mock, cần implement database persistence
- Backend giới hạn max 100 messages/user (HISTORY_TTL = 24h)
- Guest users không thể save history
