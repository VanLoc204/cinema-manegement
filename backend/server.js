const express = require("express");
const cors = require("cors");
const path = require("path"); // 👈 Thêm thư viện này để xử lý đường dẫn file
const connectDB = require("./config/db");

// 1. Kết nối Database
connectDB();

// 2. ĐĂNG KÝ TẤT CẢ MODELS
require("./models/Movie");
require("./models/Room"); 
require("./models/Showtime");
require("./models/Booking");
require("./models/User");
require("./models/Snack"); // 🍿 ĐĂNG KÝ THÊM MODEL SNACK NÀY NỮA SẾP ƠI

const app = express();

app.use(cors());
app.use(express.json());

// 📸 3. CỰC KỲ QUAN TRỌNG: Mở thư mục uploads để xem được ảnh bắp nước
// Khi sếp truy cập http://localhost:5000/uploads/ten_anh.jpg nó sẽ hiện ra hình
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// test API
app.get("/", (req, res) => {
  res.send("Backend Cinema Lux đang chạy cực mượt sếp ơi...");
});

// 4. SỬ DỤNG CÁC ROUTES
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/movies", require("./routes/movieRoutes"));
app.use("/api/rooms", require("./routes/roomRoutes"));
app.use("/api/showtimes", require("./routes/showtimeRoutes"));
app.use("/api/bookings", require("./routes/bookingRoutes"));
app.use("/api/payment", require("./routes/paymentRoutes"));

// 🍿 CỔNG QUẢN LÝ BẮP NƯỚC (CRUD + UPLOAD)
app.use("/api/snacks", require("./routes/snackRoutes")); 

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server đang "nổ máy" tại port ${PORT}`);
});