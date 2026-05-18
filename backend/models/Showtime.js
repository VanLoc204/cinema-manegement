const mongoose = require("mongoose");

const showtimeSchema = new mongoose.Schema({
  movieId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Movie", 
    required: true 
  },
  roomId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Room", 
    required: true 
  },
  time: { type: Date, required: true }, // Thời gian bắt đầu chiếu
  isDraft: { type: Boolean, default: false }, // 🤖 Bản nháp AI (User không thấy)
  isAiSuggested: { type: Boolean, default: false } // Đánh dấu lịch này là do AI tạo ra
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ✨ TRƯỜNG ẢO: Tự động xác định trạng thái chuẩn 3 giai đoạn
showtimeSchema.virtual('status').get(function() {
  const now = new Date();
  const startTime = new Date(this.time);
  
  // 🍿 Lấy thời lượng phim (Nếu Model Movie có field duration thì dùng, không thì mặc định 120p)
  const durationInMinutes = this.movieId?.duration || 120; 
  const endTime = new Date(startTime.getTime() + durationInMinutes * 60000);

  if (now < startTime) {
    return "upcoming"; // 🟢 Chưa đến giờ chiếu
  } else if (now >= startTime && now <= endTime) {
    return "running";  // 🔵 Đang chiếu (Phim đang chạy trong rạp)
  } else {
    return "finished"; // 🔴 Đã chiếu xong hoàn toàn
  }
});

// ✨ TRƯỜNG ẢO: Kiểm tra hết hạn (Chỉ hết hạn khi phim đã chiếu xong)
showtimeSchema.virtual('isExpired').get(function() {
  const startTime = new Date(this.time);
  const duration = this.movieId?.duration || 120;
  const endTime = new Date(startTime.getTime() + duration * 60000);
  return new Date() > endTime;
});

module.exports = mongoose.model("Showtime", showtimeSchema);