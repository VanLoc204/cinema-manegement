const express = require("express");
const cors = require("cors");
const path = require("path");
const { createServer } = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");

// 1. Kết nối Database
connectDB();

// 2. ĐĂNG KÝ MODELS
require("./models/Movie");
require("./models/Room"); 
require("./models/Showtime");
require("./models/Booking");
require("./models/User");
require("./models/Snack");

const app = express();

// 📡 3. KHỞI TẠO HTTP SERVER VÀ SOCKET.IO
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173", // URL của Vite bên Frontend
    methods: ["GET", "POST"]
  }
});

// 🚀 Gắn biến io vào app để sử dụng ở các file routes/controllers
app.set("socketio", io);

app.use(cors());
app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.send("Backend Cinema Lux Real-time đang nổ máy sếp ơi...");
});

// 4. SỬ DỤNG CÁC ROUTES
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/movies", require("./routes/movieRoutes"));
app.use("/api/rooms", require("./routes/roomRoutes"));
app.use("/api/showtimes", require("./routes/showtimeRoutes"));
app.use("/api/bookings", require("./routes/bookingRoutes"));
app.use("/api/payment", require("./routes/paymentRoutes"));
app.use("/api/snacks", require("./routes/snackRoutes")); 

// 📡 5. LOGIC SOCKET.IO CƠ BẢN
io.on("connection", (socket) => {
  console.log(`📡 [Socket] Có người vừa kết nối: ${socket.id}`);

  // A. Tham gia vào phòng riêng của suất chiếu
  socket.on("join-showtime", (showtimeId) => {
    socket.join(showtimeId);
    console.log(`👤 User ${socket.id} đã vào phòng: ${showtimeId}`);
  });

  // B. 🔥 PHẦN MỚI: Xử lý khi người dùng đang click chọn ghế (Chưa thanh toán)
  socket.on("selecting-seat", (data) => {
    // data bao gồm: { showtimeId, userId, selectedSeats }
    // Gửi thông tin này cho TẤT CẢ mọi người trong phòng, TRỪ người vừa gửi (socket.to)
    socket.to(data.showtimeId).emit("someone-clicking", data);
  });

  // C. Khi User thoát trang đặt ghế
  socket.on("leave-showtime", (showtimeId) => {
    socket.leave(showtimeId);
    console.log(`👋 User ${socket.id} đã rời phòng: ${showtimeId}`);
  });

  socket.on("disconnect", () => {
    console.log("❌ [Socket] Một kết nối đã ngắt.");
  });
});

const PORT = process.env.PORT || 5000;

// ⚠️ Dùng httpServer.listen để chạy cả HTTP và Socket.io
httpServer.listen(PORT, () => {
  console.log(`🚀 Cinema Lux Server đang chạy Real-time tại port ${PORT}`);
});