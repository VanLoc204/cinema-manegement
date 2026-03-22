// models/Booking.js
const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  showtimeId: { type: mongoose.Schema.Types.ObjectId, ref: "Showtime" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  seats: [String],
  totalAmount: Number,
  status: { type: String, default: "Success" }, // Đã thanh toán
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Booking", bookingSchema);
