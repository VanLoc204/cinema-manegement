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

// 📡 5. LOGIC SOCKET.IO NÂNG CAO (REAL-TIME TRẠNG THÁI)
// 📝 "Sổ cái" lưu trữ: { [showtimeId]: { [userId]: [mảng_ghế_đang_chọn] } }
const activeSelections = {}; 

io.on("connection", (socket) => {
  console.log(`📡 [Socket] Kết nối mới: ${socket.id}`);

  // A. Khi User vào phòng đặt ghế
  socket.on("join-showtime", (showtimeId) => {
    socket.join(showtimeId);
    // Lưu lại showtimeId vào socket để lúc disconnect biết đường mà nhả ghế
    socket.showtimeId = showtimeId;

    // 📥 Gửi ngay trạng thái hiện tại cho người mới vào
    if (activeSelections[showtimeId]) {
      // Gom tất cả ghế của những người đang chọn trong phòng này lại thành 1 mảng phẳng
      const currentOtherSeats = Object.values(activeSelections[showtimeId]).flat();
      socket.emit("initial-selections", currentOtherSeats);
    }
    console.log(`👤 User ${socket.id} vào phòng: ${showtimeId}`);
  });

  // B. Khi User đang click chọn ghế
  socket.on("selecting-seat", (data) => {
    const { showtimeId, userId, selectedSeats } = data;
    // Lưu userId vào socket để cleanup khi thoát
    socket.userId = userId;

    // 📝 Ghi vào sổ cái trạng thái mới nhất của User này
    if (!activeSelections[showtimeId]) activeSelections[showtimeId] = {};
    activeSelections[showtimeId][userId] = selectedSeats;

    // Phát tín hiệu cho những người khác thấy ghế đổi màu X
    socket.to(showtimeId).emit("someone-clicking", data);
  });

  // C. Khi User thoát trang hoặc mất kết nối (CLEANUP)
  const handleLeave = () => {
    const { showtimeId, userId } = socket;
    if (showtimeId && userId && activeSelections[showtimeId]) {
      // Xóa dữ liệu của User này trong sổ cái
      delete activeSelections[showtimeId][userId];
      
      // Báo cho mọi người trong phòng là User này đã "nhả" toàn bộ ghế
      const remainingSeats = Object.values(activeSelections[showtimeId]).flat();
      io.to(showtimeId).emit("someone-clicking", {
        userId: userId,
        selectedSeats: [] // Xóa màu X trên máy người khác
      });
      console.log(`👋 User ${userId} đã rời/ngắt kết nối, nhả ghế phòng ${showtimeId}`);
    }
  };

  socket.on("leave-showtime", (showtimeId) => {
    socket.leave(showtimeId);
    handleLeave();
  });

  socket.on("disconnect", () => {
    handleLeave();
    console.log(`❌ [Socket] Ngắt kết nối: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Cinema Lux Server đang chạy Real-time tại port ${PORT}`);
});