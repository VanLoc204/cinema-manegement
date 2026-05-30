require("dotenv").config();
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
require("./models/ProfileDetail");
require("./models/Snack");
require("./models/Review");
require("./models/Voucher");

const app = express();

// 📡 3. KHỞI TẠO HTTP SERVER VÀ SOCKET.IO
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

app.set("socketio", io);
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 4. SỬ DỤNG CÁC ROUTES (Sếp nhớ thêm /api vào link gọi Axios ở Frontend nhé)
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/movies", require("./routes/movieRoutes"));
app.use("/api/rooms", require("./routes/roomRoutes"));
app.use("/api/showtimes", require("./routes/showtimeRoutes"));
app.use("/api/bookings", require("./routes/bookingRoutes"));
app.use("/api/payment", require("./routes/paymentRoutes"));
app.use("/api/snacks", require("./routes/snackRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));
app.use("/api/vouchers", require("./routes/voucherRoutes"));

// 🌟 4.5. SERVE FRONTEND STATIC FILES IN PRODUCTION (Ngrok public link)
app.use(express.static(path.join(__dirname, "../frontend/dist")));
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

// 📡 5. LOGIC SOCKET.IO: ĐÃ ĐỒNG BỘ TÊN SỰ KIỆN (_)
const activeSelections = {};
const holdTimers = {};

io.on("connection", (socket) => {
  console.log(`📡 [Socket] Kết nối mới: ${socket.id}`);

  // A. Khi User vào phòng đặt ghế
  // Trong file server.js
  socket.on("join_showtime", (showtimeId) => {
    socket.join(showtimeId);
    socket.showtimeId = showtimeId;
    console.log(`👤 User ${socket.id} gia nhập phòng: ${showtimeId}`);

    // 🚩 ĐOẠN QUAN TRỌNG: Gửi danh sách ghế đang được giữ cho người VỪA VÀO dưới dạng object đầy đủ
    if (activeSelections[showtimeId]) {
      socket.emit("initial_selections", activeSelections[showtimeId]);
    }
  });

  // B. Khi User click chọn ghế (Đổi sang gạch dưới _)
  socket.on("selecting_seat", (data) => {
    const { showtimeId, userId, selectedSeats } = data;
    socket.userId = userId;
    socket.showtimeId = showtimeId;

    if (holdTimers[userId]) {
      clearTimeout(holdTimers[userId]);
      delete holdTimers[userId];
    }

    if (selectedSeats && selectedSeats.length > 0) {
      holdTimers[userId] = setTimeout(() => {
        if (activeSelections[showtimeId]) {
          delete activeSelections[showtimeId][userId];
        }
        io.to(showtimeId).emit("someone_clicking", activeSelections[showtimeId] || {});
        socket.emit("hold_timeout", { message: "Hết 5 phút giữ ghế rồi sếp ơi!" });
        delete holdTimers[userId];
      }, 5 * 60 * 1000);
    }

    if (!activeSelections[showtimeId]) activeSelections[showtimeId] = {};
    activeSelections[showtimeId][userId] = selectedSeats;

    // Phát toàn bộ object activeSelections cho những người trong phòng
    io.to(showtimeId).emit("someone_clicking", activeSelections[showtimeId]);
  });

  // C. 🎟️ KHI THANH TOÁN THÀNH CÔNG (Cả khách và staff đều dùng cái này)
  socket.on("confirm_booking", (data) => {
    const { showtimeId, seats, userId } = data;

    // Hủy đếm ngược vì họ đã mua rồi
    if (userId && holdTimers[userId]) {
      clearTimeout(holdTimers[userId]);
      delete holdTimers[userId];
    }

    // Xóa khỏi danh sách "đang giữ"
    if (showtimeId && userId && activeSelections[showtimeId]) {
      delete activeSelections[showtimeId][userId];
    }

    // 🚩 HÉT LÊN CHO CẢ PHÒNG: "GHẾ NÀY BÁN RỒI, CẬP NHẬT ĐI!"
    io.to(showtimeId).emit("confirm_booking", { seats });
  });

  // D. Cleanup khi User rời đi
  const handleLeave = () => {
    const { showtimeId, userId } = socket;
    if (userId && holdTimers[userId]) {
      clearTimeout(holdTimers[userId]);
      delete holdTimers[userId];
    }
    if (showtimeId && userId && activeSelections[showtimeId]) {
      delete activeSelections[showtimeId][userId];
      io.to(showtimeId).emit("someone_clicking", activeSelections[showtimeId] || {});
    }
  };

  socket.on("leave_showtime", handleLeave);
  socket.on("disconnect", handleLeave);
  socket.on("cancel-hold-timer", handleLeave);
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Cinema Lux Server đang chạy Real-time tại port ${PORT}`);
});