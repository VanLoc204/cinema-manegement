const mongoose = require("mongoose");
require("dotenv").config();

// Import các model để truy vấn cấu trúc
const User = require("./models/User");
const Movie = require("./models/Movie");
const Room = require("./models/Room");
const Showtime = require("./models/Showtime");
const Booking = require("./models/Booking");
const Snack = require("./models/Snack");
const ProfileDetail = require("./models/ProfileDetail");
const Review = require("./models/Review");
const Voucher = require("./models/Voucher");

const localUri = "mongodb://127.0.0.1:27017/cinema";
const atlasUri = process.env.MONGO_URI;

const migrate = async () => {
  try {
    if (!atlasUri || atlasUri.includes("127.0.0.1")) {
      console.error("❌ LỖI: Vui lòng cấu hình MONGO_URI trong file .env là link MongoDB Atlas trước!");
      process.exit(1);
    }

    console.log("🔌 Bước 1: Đang kết nối tới MongoDB Localhost...");
    await mongoose.connect(localUri);
    console.log("✅ Đã kết nối Localhost. Đang tải dữ liệu vào bộ nhớ tạm...");

    // Lấy toàn bộ dữ liệu từ Localhost dạng plain object (lean) để giữ nguyên _id
    const users = await User.find().lean();
    const movies = await Movie.find().lean();
    const rooms = await Room.find().lean();
    const snacks = await Snack.find().lean();
    const showtimes = await Showtime.find().lean();
    const bookings = await Booking.find().lean();
    const profiles = await ProfileDetail.find().lean();
    const reviews = await Review.find().lean();
    const vouchers = await Voucher.find().lean();

    console.log(`📊 Đã đọc từ Localhost:
   - 👥 ${users.length} Users
   - 👤 ${profiles.length} Profiles
   - 🎬 ${movies.length} Movies
   - 🏟️ ${rooms.length} Rooms
   - 🍿 ${snacks.length} Snacks
   - 📅 ${showtimes.length} Showtimes
   - 🎟️ ${bookings.length} Bookings
   - 💬 ${reviews.length} Reviews
   - 🎫 ${vouchers.length} Vouchers`);

    console.log("🔌 Đang ngắt kết nối với Localhost...");
    await mongoose.disconnect();

    console.log("🔌 Bước 2: Đang kết nối tới MongoDB Atlas...");
    await mongoose.connect(atlasUri);
    console.log("✅ Đã kết nối MongoDB Atlas thành công.");

    // Dọn dẹp Atlas trước khi nạp để tránh trùng lặp
    console.log("🧹 Đang dọn dẹp dữ liệu cũ trên Atlas...");
    await Promise.all([
      User.deleteMany({}),
      ProfileDetail.deleteMany({}),
      Movie.deleteMany({}),
      Room.deleteMany({}),
      Snack.deleteMany({}),
      Showtime.deleteMany({}),
      Booking.deleteMany({}),
      Review.deleteMany({}),
      Voucher.deleteMany({})
    ]);
    console.log("✨ Đã dọn dẹp sạch Atlas.");

    // Đẩy dữ liệu lên Atlas (giữ nguyên _id và các quan hệ)
    console.log("🚀 Đang đồng bộ dữ liệu lên MongoDB Atlas...");
    if (users.length) await User.insertMany(users);
    if (profiles.length) await ProfileDetail.insertMany(profiles);
    if (movies.length) await Movie.insertMany(movies);
    if (rooms.length) await Room.insertMany(rooms);
    if (snacks.length) await Snack.insertMany(snacks);
    if (showtimes.length) await Showtime.insertMany(showtimes);
    if (bookings.length) await Booking.insertMany(bookings);
    if (reviews.length) await Review.insertMany(reviews);
    if (vouchers.length) await Voucher.insertMany(vouchers);

    console.log("\n🎉 ĐỒNG BỘ DỮ LIỆU THÀNH CÔNG RỰC RỠ!");
    console.log("Toàn bộ tài khoản (Admin, Staff, Hồ Văn Lộc...), phim, phòng chiếu, bắp nước và hóa đơn đã ở trên Cloud Atlas 🟢");
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi trong quá trình di chuyển dữ liệu:", error);
    process.exit(1);
  }
};

migrate();
