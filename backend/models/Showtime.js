const mongoose = require("mongoose");

const showtimeSchema = new mongoose.Schema({
  movieId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Movie", 
    required: true 
  },
  roomId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Room", // ✨ Liên kết chính xác với tên Model "Room"
    required: true 
  },
  time: { type: Date, required: true },
  // seats: Array // Bạn có thể bỏ trường này nếu quản lý ghế qua bảng Booking
});

module.exports = mongoose.model("Showtime", showtimeSchema);
