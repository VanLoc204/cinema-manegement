const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

// 1. Kết nối Database
connectDB();

// 2. ĐĂNG KÝ TẤT CẢ MODELS (Thêm đoạn này để sửa lỗi MissingSchemaError)
// Mongoose cần biết các Schema này tồn tại trước khi dùng .populate()
require("./models/Movie");
require("./models/Room"); 
require("./models/Showtime");
require("./models/Booking");
require("./models/User");

const app = express();

app.use(cors());
app.use(express.json());

// test API
app.get("/", (req, res) => {
  res.send("Backend running...");
});

// 3. Sử dụng các routes
app.use("/api/movies", require("./routes/movieRoutes"));
app.use("/api/showtimes", require("./routes/showtimeRoutes"));
app.use("/api/bookings", require("./routes/bookingRoutes"));
app.use("/api/payment", require("./routes/paymentRoutes"));
app.use("/api/auth", require("./routes/authRoutes")); // 👈 PHẢI CÓ DÒNG NÀY

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
