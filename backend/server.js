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
require("./models/Review"); // ✨ DÒNG MỚI: Đăng ký bảng Review

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

app.get("/", (req, res) => {
  res.send("Backend Cinema Lux Real-time đang nổ máy sếp ơi...");
});

// 4. SỬ DỤNG CÁC ROUTES
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/movies", require("./routes/movieRoutes"));
app.use("/api/rooms", require("./routes/roomRoutes"));
app.use("/api/showtimes", require("./routes/showtimeRoutes"));
app.use("/api/bookings", require("./routes/bookingRoutes"));
app.use("/api/payment", require("./routes/paymentRoutes"));
app.use("/api/snacks", require("./routes/snackRoutes")); 
app.use("/api/reviews", require("./routes/reviewRoutes")); // ✨ DÒNG MỚI: Kết nối đường dây Review

// 📡 5. LOGIC SOCKET.IO: REAL-TIME TRẠNG THÁI & HẸN GIỜ NHẢ GHẾ (GIỮ NGUYÊN)
const activeSelections = {}; 
const holdTimers = {}; // ⏰ Sổ tay quản lý đồng hồ đếm ngược: { userId: timerObject }

io.on("connection", (socket) => {
  console.log(`📡 [Socket] Kết nối mới: ${socket.id}`);

  // A. Khi User vào phòng đặt ghế
  socket.on("join-showtime", (showtimeId) => {
    socket.join(showtimeId);
    socket.showtimeId = showtimeId;

    if (activeSelections[showtimeId]) {
      const currentOtherSeats = Object.values(activeSelections[showtimeId]).flat();
      socket.emit("initial-selections", currentOtherSeats);
    }
  });

  // B. Khi User click chọn ghế (Bắt đầu/Reset đếm ngược 3 phút)
  socket.on("selecting-seat", (data) => {
    const { showtimeId, userId, selectedSeats } = data;
    socket.userId = userId;
    socket.showtimeId = showtimeId;

    // 1. Reset đồng hồ nếu sếp đang chọn dở mà click thêm ghế
    if (holdTimers[userId]) {
      clearTimeout(holdTimers[userId]);
      delete holdTimers[userId];
    }

    // 2. Nếu có chọn ghế, bắt đầu đếm ngược 3 phút (180.000ms)
    if (selectedSeats.length > 0) {
      holdTimers[userId] = setTimeout(() => {
        console.log(`⏰ [Timeout] Hết 3 phút! Tự động nhả ghế cho user: ${userId}`);
        
        // Xóa trong sổ cái trạng thái
        if (activeSelections[showtimeId]) {
          delete activeSelections[showtimeId][userId];
        }

        // Báo cho mọi người trong phòng biết ghế này đã trống
        io.to(showtimeId).emit("someone-clicking", {
          userId: userId,
          selectedSeats: []
        });

        // Báo riêng cho "khách chậm chạp" đó biết là đã hết giờ
        socket.emit("hold-timeout", { message: "Hết 3 phút giữ ghế rồi sếp ơi, mời sếp chọn lại!" });
        
        delete holdTimers[userId];
      }, 3 * 60 * 1000); 
    }

    // 3. Cập nhật sổ cái và phát tín hiệu như bình thường
    if (!activeSelections[showtimeId]) activeSelections[showtimeId] = {};
    activeSelections[showtimeId][userId] = selectedSeats;
    socket.to(showtimeId).emit("someone-clicking", data);
  });

  // C. 🎟️ QUAN TRỌNG: Khi thanh toán thành công (Xóa đồng hồ đếm ngược)
  socket.on("payment-success", (data) => {
    const { userId, showtimeId } = data;
    if (holdTimers[userId]) {
      clearTimeout(holdTimers[userId]);
      delete holdTimers[userId];
      console.log(`✅ [Paid] Đã hủy đếm ngược cho user ${userId} vì đã thanh toán.`);
    }
    // Xóa khỏi danh sách "đang giữ" vì giờ nó đã là "đã bán" trong DB
    if (activeSelections[showtimeId]) {
      delete activeSelections[showtimeId][userId];
    }
  });

  // D. Cleanup khi User rời đi
  const handleLeave = () => {
    const { showtimeId, userId } = socket;
    if (holdTimers[userId]) {
      clearTimeout(holdTimers[userId]);
      delete holdTimers[userId];
    }
    if (showtimeId && userId && activeSelections[showtimeId]) {
      delete activeSelections[showtimeId][userId];
      io.to(showtimeId).emit("someone-clicking", {
        userId: userId,
        selectedSeats: []
      });
    }
  };

  socket.on("leave-showtime", handleLeave);
  socket.on("disconnect", handleLeave);
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Cinema Lux Server đang chạy Real-time tại port ${PORT}`);
});