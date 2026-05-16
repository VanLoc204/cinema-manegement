// models/Booking.js
const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  showtimeId: { type: mongoose.Schema.Types.ObjectId, ref: "Showtime" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  seats: [String],

  // 🍿 PHẦN CẬP NHẬT: Lưu chi tiết bắp nước vào hóa đơn
  snacks: [
    {
      snackId: { type: String }, // Giữ là String để khớp với dữ liệu test của sếp
      name: { type: String },
      quantity: { type: Number, default: 1 },
      price: { type: Number },
      // 📸 THÊM DÒNG NÀY: Lưu đường dẫn ảnh upload (/uploads/abc.jpg)
      image: { type: String }
    }
  ],

  totalAmount: Number,
  status: { type: String, default: "Success" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Booking", bookingSchema);