# 🎬 Cinema Lux - Hệ thống Quản lý Rạp Chiếu Phim Tích Hợp AI

**Cinema Lux** là một dự án ứng dụng web toàn diện (Full-stack MERN) dành cho rạp chiếu phim. Điểm nổi bật nhất của dự án là việc tích hợp **Hệ thống Trí tuệ Nhân tạo (AI) xếp lịch chiếu tự động** dựa trên thuật toán Học máy phân cụm (K-Means) và Thuật toán tối ưu hóa Di truyền (Genetic Algorithm).

---

## 🚀 Công nghệ sử dụng
- **Frontend:** React.js, Vite, Axios
- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose
- **Thanh toán:** Tích hợp Cổng thanh toán quét mã QR (PayOS)
- **Realtime:** Socket.io (Đồng bộ trạng thái ghế ngồi và thanh toán trực tiếp)
- **AI Core:** Thuật toán K-Means, Genetic Algorithm (GA), Time Decay Factor.

---

## ⚙️ Hướng dẫn cài đặt và chạy dự án

### 1. Yêu cầu hệ thống
- [Node.js](https://nodejs.org/) (Khuyến nghị phiên bản v18.x trở lên)
- [MongoDB](https://www.mongodb.com/try/download/community) (Đang chạy local hoặc dùng MongoDB Atlas)

### 2. Cài đặt Backend
Mở terminal và trỏ vào thư mục `backend`:
```bash
cd backend
npm install
```

**Cấu hình biến môi trường:**
Tạo một file `.env` trong thư mục `backend` và điền các thông số sau (có thể tham khảo file `.env.example` nếu có):
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/cinema_lux
JWT_SECRET=chuoi_ky_tu_bi_mat_cua_ban
# Các thông số của PayOS (nếu có)
```

**Chạy Server:**
```bash
npm start
# Hoặc chạy ở chế độ dev: npm run dev
```
*(Server sẽ chạy tại: `http://localhost:5000`)*

### 3. Cài đặt Frontend
Mở một terminal mới và trỏ vào thư mục `frontend`:
```bash
cd frontend
npm install
```
**Chạy Web:**
```bash
npm run dev
```
*(Giao diện sẽ chạy tại: `http://localhost:5173`)*

---

## 🛠 Hướng dẫn khởi tạo Dữ liệu mẫu (Seed Data)

Hệ thống cung cấp các công cụ giả lập dữ liệu cực kỳ mạnh mẽ để bạn có thể test ngay các tính năng bán vé và Xếp lịch AI mà không cần nhập liệu bằng tay.

Mở terminal, trỏ vào thư mục `backend` và chạy các lệnh sau:

**1. Tạo dữ liệu bán vé 7 ngày qua (Dùng để test doanh thu & Khởi động AI):**
```bash
node seedData.js
```
*Script này sẽ tạo ra hàng chục ngàn vé ngẫu nhiên trong 7 ngày gần nhất, sau đó chấm điểm và in ra Top 3 phim bán chạy nhất.*

**2. Tạo dữ liệu để thử nghiệm độ nhạy bén của K-Means AI:**
```bash
node seedTestAi.js
```
*Script này bốc ngẫu nhiên 3 phim bất kỳ và "bơm" lượng lớn vé giả vào 2 ngày gần nhất để biến chúng thành siêu phẩm phòng vé, phục vụ cho việc kiểm thử tính thích nghi của AI.*

**3. Kiểm toán AI tự động (Chấm điểm lịch chiếu AI):**
```bash
node evaluateAI.js
```
*Đóng vai trò như một Hội đồng giám khảo, tự động chạy lõi AI tạo lịch cho ngày mai và đánh giá xem lịch chiếu đó có tối ưu doanh thu và tuân thủ các luật về độ tuổi/thể loại hay không.*

---

## 👥 Tài khoản Test mặc định (Nếu có)
*(Lưu ý: Thay đổi tùy theo dữ liệu khởi tạo trong Database của bạn)*
- **Admin:** (Email: admin@gmail.com / Pass: 123456)
- **Nhân viên (Staff):** (Email: staff@gmail.com / Pass: 123456)
- **Khách hàng:** (Đăng ký tài khoản mới trên giao diện web)

---

## 🧠 Chức năng nổi bật
1. **AI Xếp Lịch Tự Động:** AI tự động đọc doanh thu 30 ngày qua, phân rã thời gian, phân cụm phim Hot/Ế và dùng thuật toán Di truyền để xếp kín rạp (Không có thời gian chết) mà vẫn tối ưu lợi nhuận (Luật Pareto 80/20).
2. **Bán vé POS tại quầy (Nhân viên):** Chọn ghế thời gian thực, quét mã QR thanh toán PayOS và in vé giấy tự động.
3. **Quản trị Admin:** Theo dõi doanh thu, Duyệt/Hủy lịch chiếu nháp của AI chỉ bằng 1 nút bấm.
4. **Khách hàng:** Đặt vé trực tuyến, chọn combo bắp nước, xem lịch sử giao dịch.

---
**Chúc bạn bảo vệ đồ án xuất sắc và đạt điểm tuyệt đối! 🎉**
