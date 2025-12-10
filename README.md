
# 🚀 KanbanFlow SaaS - Project Management System

KanbanFlow là một ứng dụng quản lý công việc hiện đại theo phong cách Trello, hỗ trợ kéo thả (Drag & Drop), cập nhật thời gian thực (Real-time), quản lý đa dự án (Multi-board) và giao diện Dark Mode tuyệt đẹp.

![KanbanFlow Preview](https://via.placeholder.com/800x400?text=KanbanFlow+Preview+Dashboard)

## 🌟 Tính năng chính

-   **Quản lý Bảng (Boards):** Tạo, sửa, xóa không giới hạn các bảng công việc.
-   **Kanban Board:** Kéo thả thẻ (Card) và danh sách (List) mượt mà.
-   **Real-time Collaboration:** Đồng bộ dữ liệu tức thì giữa các người dùng thông qua WebSocket.
-   **Chi tiết thẻ:** Gán thành viên, dán nhãn màu, checklist, ngày hết hạn, bình luận.
-   **Bảo mật:** Xác thực người dùng bằng JWT (JSON Web Tokens).
-   **Giao diện:** UI/UX hiện đại, hỗ trợ Light/Dark mode, Responsive.
-   **Đa ngôn ngữ:** Hỗ trợ Tiếng Anh và Tiếng Việt.

---

## 🛠️ Công nghệ sử dụng

### Backend
-   **Node.js** & **Express.js**: RESTful API framework.
-   **MongoDB** & **Mongoose**: Cơ sở dữ liệu NoSQL.
-   **Socket.io**: Xử lý kết nối thời gian thực.
-   **JWT**: Xác thực và phân quyền.

### Frontend
-   **React 19** & **TypeScript**: Thư viện UI và ngôn ngữ lập trình.
-   **Tailwind CSS**: Styling framework.
-   **@hello-pangea/dnd**: Thư viện Kéo thả (Drag & Drop).
-   **Framer Motion**: Hiệu ứng chuyển động (Animations).
-   **Lucide React**: Bộ icon hiện đại.

---

## ⚙️ Yêu cầu hệ thống

Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã cài đặt:
1.  **Node.js**: Phiên bản 16.x hoặc mới hơn.
2.  **MongoDB**: Có thể cài đặt MongoDB Community Server tại máy (Localhost) hoặc sử dụng MongoDB Atlas (Cloud).
3.  **Git**: Để quản lý mã nguồn.

---

## 📦 Hướng dẫn Cài đặt

### 1. Cài đặt Backend

Mở terminal tại thư mục gốc của dự án (nơi chứa file `server.js`):

```bash
# Khởi tạo package.json (nếu chưa có)
npm init -y

# Cài đặt các thư viện cần thiết cho Backend
npm install express mongoose cors socket.io jsonwebtoken body-parser nodemon
```

### 2. Cài đặt Frontend

Dự án này sử dụng React. Đảm bảo bạn đã cài đặt các thư viện Frontend. Nếu bạn đang gộp chung folder, hãy chạy lệnh sau:

```bash
# Cài đặt các thư viện React và UI
npm install react react-dom react-scripts typescript @types/react @types/react-dom @types/node
npm install tailwindcss postcss autoprefixer
npm install @hello-pangea/dnd framer-motion socket.io-client i18next react-i18next lucide-react
```

> **Lưu ý:** Nếu bạn tách riêng folder `client` và `server`, hãy chạy lệnh cài đặt trong từng folder tương ứng.

---

## 🔧 Cấu hình Môi trường

### Cấu hình Backend (`server.js`)
Mặc định dự án đang sử dụng các hằng số trong `server.js`. Để bảo mật tốt hơn, bạn nên tạo file `.env` (tùy chọn) hoặc chỉnh sửa trực tiếp các dòng sau trong `server.js` nếu muốn chạy database local:

```javascript
// server.js
const PORT = 5000;
// Thay thế bằng MongoDB URI của bạn nếu muốn (Local hoặc Atlas)
const MONGO_URI = "mongodb+srv://<username>:<password>@cluster..."; 
const JWT_SECRET = "your_super_secret_key"; 
```

---

## 🚀 Hướng dẫn Chạy dự án

Bạn cần mở **2 Terminal** để chạy song song Backend và Frontend.

### Terminal 1: Chạy Backend (API & Socket Server)

```bash
# Chạy server với nodemon (tự động restart khi sửa code)
npx nodemon server.js

# Hoặc chạy bằng node thường
node server.js
```
*Backend sẽ chạy tại: `http://localhost:5000`*

### Terminal 2: Chạy Frontend (React App)

```bash
# Khởi chạy ứng dụng React
npm start
```
*Frontend sẽ chạy tại: `http://localhost:3000`*

---

## 🧪 Tài khoản Demo mặc định

Hệ thống có cơ chế tự động tạo Admin nếu chưa tồn tại khi đăng nhập bằng email cụ thể. Bạn có thể sử dụng thông tin sau để test ngay lập tức:

**Tài khoản Admin:**
- **Email:** `admin@kanbanflow.com`
- **Password:** `123456` (Hoặc bất kỳ mật khẩu nào bạn nhập lần đầu, hệ thống sẽ tự tạo user này).

**Tài khoản Member (Tự đăng ký):**
- Bạn có thể nhấn vào nút "Create account" trên màn hình đăng nhập để tạo user mới.

---

## 📂 Cấu trúc thư mục

```
kanban-flow/
├── components/          # Các React Components (Board, Card, List, Modal...)
│   ├── ui/              # Các UI components tái sử dụng (Button...)
│   ├── BoardView.tsx    # Giao diện chính của bảng Kanban
│   ├── BoardList.tsx    # Dashboard danh sách các bảng
│   └── ...
├── services/            # Xử lý gọi API và Socket
│   └── api.ts
├── types.ts             # Định nghĩa TypeScript Interfaces
├── i18n.ts              # Cấu hình đa ngôn ngữ
├── App.tsx              # Component gốc, xử lý Routing & Auth
├── index.tsx            # Điểm khởi chạy React
├── server.js            # Entry point của Backend (Express + Socket.io)
└── README.md            # Tài liệu hướng dẫn
```

## ⚠️ Lưu ý quan trọng khi Migrate

Nếu bạn đang nâng cấp từ phiên bản cũ (Single Board) lên phiên bản mới (Multi Board), hãy thực hiện:
1.  **Xóa Database cũ:** Do cấu trúc Schema thay đổi, cách nhanh nhất là xóa toàn bộ dữ liệu cũ trong MongoDB để hệ thống tạo lại cấu trúc mới sạch sẽ.
2.  **Tạo lại User:** Đăng ký tài khoản mới để trải nghiệm tính năng Multi-board.

---

## 🤝 Đóng góp

Mọi đóng góp đều được hoan nghênh! Vui lòng tạo Pull Request hoặc mở Issue nếu bạn tìm thấy lỗi.

Happy Coding! 🎉
