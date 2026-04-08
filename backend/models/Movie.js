const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: [true, "Sếp ơi, phim phải có tên chứ!"], 
    trim: true 
  },
  description: { type: String },
  genre: { type: String },
  duration: { type: Number }, // Thời lượng phim (phút)
  
  // 📸 POSTER PHIM: Bây giờ sẽ lưu đường dẫn file như "/uploads/movies/avengers.jpg"
  image: { 
    type: String, 
    default: "/uploads/movies/default-poster.jpg" // Ảnh mặc định nếu sếp chưa kịp upload
  },
  
  // 🎬 TRẠNG THÁI: Sếp có thể dùng để lọc phim ở trang chủ (Đang chiếu / Sắp chiếu)
  status: { 
    type: String, 
    enum: ["now_showing", "coming_soon", "ended"], // Giới hạn các lựa chọn cho chuẩn
    default: "now_showing" 
  },
  
  trailer: { type: String, default: "https://www.youtube.com" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Movie", movieSchema);